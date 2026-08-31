import { z } from "zod";
import { router, permissionProcedure } from "../trpc";
import { listAudit } from "@/lib/audit";

/**
 * Audit-Router – nur PRAXISLEITUNG und SYSADMIN (view:audit).
 * Nur Leseoperationen; Audit-Einträge sind unveränderlich.
 */
export const auditRouter = router({
  list: permissionProcedure("view", "audit")
    .input(
      z
        .object({
          resource: z.string().optional(),
          userId: z.string().optional(),
          action: z
            .enum([
              "VIEW",
              "CREATE",
              "UPDATE",
              "DELETE",
              "EXPORT",
              "LOGIN",
              "LOGOUT",
              "APPROVE",
              "REJECT",
              "ESCALATE",
            ])
            .optional(),
          limit: z.number().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return listAudit({
        tenantId: ctx.tenantId,
        resource: input?.resource,
        userId: input?.userId,
        action: input?.action,
        limit: input?.limit ?? 100,
      });
    }),
});
