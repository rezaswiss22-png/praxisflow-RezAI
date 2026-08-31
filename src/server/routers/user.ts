import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

const roleEnum = z.enum(["ARZT", "MPA_EMPFANG", "PRAXISLEITUNG", "PERSONAL", "SYSADMIN"]);

export const userRouter = router({
  // Für Zuweisungs-Dropdowns – jede angemeldete Rolle darf die Namensliste sehen.
  listAssignable: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { tenantId: ctx.tenantId, deletedAt: null, aktiv: true },
      select: { id: true, name: true, role: true, kuerzel: true },
      orderBy: { name: "asc" },
    });
  }),

  list: permissionProcedure("manage", "user").query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        aktiv: true,
        lastLoginAt: true,
        mfaEnabled: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  updateRole: permissionProcedure("manage", "user")
    .input(z.object({ id: z.string(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "benutzer",
        resourceId: input.id,
        before: { role: existing.role },
        after: { role: input.role },
        ipAddress: ctx.ip,
      });
      return { id: updated.id, role: updated.role };
    }),

  setActive: permissionProcedure("manage", "user")
    .input(z.object({ id: z.string(), aktiv: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      // Bei Deaktivierung: aktive Sessions widerrufen (sofortiger Effekt)
      if (!input.aktiv) {
        await ctx.prisma.session.deleteMany({ where: { userId: input.id } });
      }
      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { aktiv: input.aktiv, status: input.aktiv ? "aktiv" : "deaktiviert" },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "benutzer",
        resourceId: input.id,
        after: { aktiv: input.aktiv },
        ipAddress: ctx.ip,
      });
      return { id: updated.id, aktiv: updated.aktiv };
    }),
});
