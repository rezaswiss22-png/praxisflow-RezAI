import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { can as canCheck } from "@/lib/permissions";
import { checkApiRateLimit } from "@/lib/rate-limit";

/**
 * tRPC-Basis-Setup.
 *
 * Der Context enthält Session, Prisma-Client und (bei Authentifizierung)
 * die tenantId. Alle geschützten Procedures erzwingen serverseitig
 * Authentifizierung und – wo nötig – RBAC.
 */
export interface Context {
  session: Session | null;
  prisma: typeof prisma;
  ip: string;
  userAgent: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

/** Erzwingt eine gültige Session. Stellt tenantId + user typsicher bereit. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Nicht angemeldet." });
  }

  // API-Rate-Limit pro Benutzer (200 Req/min)
  const rl = checkApiRateLimit(ctx.session.user.id);
  if (!rl.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Zu viele Anfragen. Bitte in ${rl.retryAfterSec} Sekunden erneut versuchen.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
      tenantId: ctx.session.user.tenantId,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * roleProcedure – schränkt eine Procedure auf bestimmte Rollen ein.
 * Beispiel: roleProcedure(["ARZT"]).mutation(...)
 */
export function roleProcedure(allowedRoles: UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Für diese Aktion fehlt die Berechtigung.",
      });
    }
    return next({ ctx });
  });
}

/**
 * permissionProcedure – erzwingt eine konkrete (action, resource)-Berechtigung
 * über die zentrale RBAC-Matrix (can()).
 */
export function permissionProcedure(action: string, resource: string) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!canCheck(ctx.user.role, action, resource)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Keine Berechtigung für ${action}:${resource}.`,
      });
    }
    return next({ ctx });
  });
}
