import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

export const callbackRouter = router({
  list: permissionProcedure("view", "rueckruf")
    .input(z.object({ nurHeute: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return ctx.prisma.callback.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input?.nurHeute ? { scheduledAt: { lte: endOfDay }, status: { in: ["AUSSTEHEND", "GEPLANT"] } } : {}),
        },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 200,
      });
    }),

  create: permissionProcedure("create", "rueckruf")
    .input(
      z.object({
        phone: z.string().min(3),
        reason: z.string().optional(),
        patientId: z.string().optional(),
        assignedTo: z.string().optional(),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cb = await ctx.prisma.callback.create({
        data: {
          tenantId: ctx.tenantId,
          phone: input.phone,
          reason: input.reason,
          patientId: input.patientId,
          assignedTo: input.assignedTo,
          scheduledAt: input.scheduledAt,
          requestedBy: ctx.user.id,
          status: "AUSSTEHEND",
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "rueckruf",
        resourceId: cb.id,
        ipAddress: ctx.ip,
      });
      return cb;
    }),

  complete: permissionProcedure("create", "rueckruf")
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cb = await ctx.prisma.callback.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!cb) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.callback.update({
        where: { id: input.id },
        data: {
          status: "ERLEDIGT",
          completedAt: new Date(),
          completedBy: ctx.user.id,
          notes: input.notes ?? cb.notes,
        },
      });
    }),
});
