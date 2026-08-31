import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { encode as defaultEncode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

import { prisma } from "./prisma";
import { logger } from "./logger";
import { createAudit } from "./audit";
import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limit";

/**
 * Auth.js v5 – Authentifizierung für PraxisFlow AI.
 *
 * DATABASE SESSIONS (nicht JWT):
 * Sitzungen werden in der Tabelle `sessions` gespeichert und sind damit
 * sofort widerrufbar (Admin-Logout, Sperrung). Da der Credentials-Provider
 * in Auth.js v5 standardmässig JWT verwendet, wird über einen dokumentierten
 * Workaround (`jwt.encode`) beim Login eine DB-Session erzeugt und der
 * Session-Token als Cookie gesetzt. Nachfolgende Requests lösen die Session
 * über den Adapter (`getSessionAndUser`) aus der Datenbank auf.
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
    strategy: "database",
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
    // Markiert Credentials-Logins, damit `jwt.encode` eine DB-Session erzeugt.
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
    // Bei database-Strategie liefert der Adapter den vollständigen User.
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user as unknown as { role: UserRole }).role;
        session.user.tenantId = (user as unknown as { tenantId: string }).tenantId;
      }
      return session;
    },
  },
  jwt: {
    // Workaround: DB-Session bei Credentials-Login anlegen und Token als Cookie setzen.
    async encode(params) {
      if ((params.token as { credentials?: boolean } | undefined)?.credentials) {
        const sub = params.token?.sub;
        if (!sub) throw new Error("Keine Benutzer-ID im Token");
        const sessionToken = randomUUID();
        const created = await adapter.createSession?.({
          sessionToken,
          userId: sub,
          expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
        });
        if (!created) throw new Error("DB-Session konnte nicht erstellt werden");
        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
  trustHost: true,
});
