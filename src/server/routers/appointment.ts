import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

export const appointmentRouter = router({
  list: permissionProcedure("view", "termin")
    .input(z.object({ from: z.date().optional(), to: z.date().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input?.from || input?.to
            ? { startAt: { gte: input?.from, lte: input?.to } }
            : {}),
        },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          provider: { select: { name: true } },
        },
        orderBy: { startAt: "asc" },
        take: 300,
      });
    }),

  get: permissionProcedure("view", "termin")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { patient: true, provider: true },
      });
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
      return appt;
    }),

  create: permissionProcedure("create", "termin")
    .input(
      z.object({
        title: z.string().min(1),
        startAt: z.date(),
        endAt: z.date(),
        patientId: z.string().optional(),
        providerId: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.create({
        data: {
          tenantId: ctx.tenantId,
          title: input.title,
          startAt: input.startAt,
          endAt: input.endAt,
          patientId: input.patientId,
          providerId: input.providerId,
          location: input.location,
          notes: input.notes,
          status: "GEPLANT",
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "termin",
        resourceId: appt.id,
        ipAddress: ctx.ip,
      });
      return appt;
    }),

  // Stornierung erfordert (organisatorisch) Freigabe für MPA – hier protokolliert.
  cancel: permissionProcedure("cancel", "termin")
    .input(z.object({ id: z.string(), grund: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.appointment.update({
        where: { id: input.id },
        data: { status: "ABGESAGT", notes: input.grund ?? appt.notes },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "termin",
        resourceId: input.id,
        after: { status: "ABGESAGT" },
        ipAddress: ctx.ip,
      });
      return updated;
    }),
});
