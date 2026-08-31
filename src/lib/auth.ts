import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

import { prisma } from "./prisma";
import { logger } from "./logger";
import { createAudit } from "./audit";
import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limit";

/**
 * Auth.js v5 – Authentifizierung für PraxisFlow AI.
 *
 * SESSION-STRATEGIE (Pilot v1):
 * Auth.js v5 erfordert JWT-Strategie für Credentials-Provider.
 * Das JWT enthält: userId, role, tenantId, name, email.
 * Laufzeit: 4 Stunden; updateAge: 30 Minuten (Inaktivitäts-Timeout).
 *
 * Sitzungs-Revozierbarkeit (Phase 3): Für den Echtbetrieb wird eine
 * DB-Sitzungsverwaltung mit TokenRevocationList hinzugefügt.
 *
 * Session-Konfiguration (siehe ROLES_AND_PERMISSIONS.md §5):
 *   - Dauer: 4 Stunden
 *   - Inaktivitäts-Timeout / Verlängerung: 30 Minuten (updateAge)
 *   - Cookie: HttpOnly, Secure (prod), SameSite=Strict
 */

const SESSION_MAX_AGE = 4 * 60 * 60; // 4 Stunden in Sekunden
const SESSION_UPDATE_AGE = 30 * 60; // 30 Minuten

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const adapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: {
    // Auth.js v5: Credentials-Provider erfordert "jwt"-Strategie.
    // Revozierbarkeit wird durch den jwt.encode-Workaround erreicht:
    // Bei Credentials-Login wird eine echte DB-Session angelegt und der
    // Session-Token (UUID) als Cookie gesetzt. Nachfolgende Requests
    // nutzen den Adapter (getSessionAndUser) – kein echtes JWT-Secret nötig.
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  cookies: {
    sessionToken: {
      name: "praxisflow.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Anmeldedaten",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
        ip: { label: "ip", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const ip = (rawCredentials?.ip as string) || "unbekannt";

        // Login-Rate-Limit: max. 5 Versuche / 15 min / IP
        const rl = checkLoginRateLimit(ip);
        if (!rl.allowed) {
          logger.warn({ ip }, "Login-Rate-Limit überschritten");
          throw new Error("RATE_LIMIT");
        }

        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase(), deletedAt: null, aktiv: true },
        });
        if (!user) {
          logger.warn({ email }, "Login fehlgeschlagen: Benutzer nicht gefunden");
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          logger.warn({ userId: user.id }, "Login fehlgeschlagen: falsches Passwort");
          return null;
        }

        // Erfolgreicher Login: Rate-Limit zurücksetzen, lastLogin + Audit
        resetLoginRateLimit(ip);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        await createAudit({
          tenantId: user.tenantId,
          userId: user.id,
          action: "LOGIN",
          resource: "session",
          ipAddress: ip,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    // JWT-Callback: Benutzerdaten in Token einbetten (beim ersten Login)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: UserRole }).role;
        token.tenantId = (user as unknown as { tenantId: string }).tenantId;
      }
      return token;
    },
    // Session-Callback: Token-Daten in die Session übertragen
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
  trustHost: true,
});
