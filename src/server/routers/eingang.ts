import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";
import { nanoid } from "nanoid";

export const eingangRouter = router({
  list: permissionProcedure("view", "eingang")
    .input(
      z
        .object({
          status: z
            .enum(["NEU", "IN_BEARBEITUNG", "ZUGEORDNET", "ABGESCHLOSSEN", "FEHLER"])
            .optional(),
          channelType: z.string().optional(),
          nurOffeneZuordnung: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.eingang.findMany({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.channelType
            ? { channel: { type: input.channelType as any } }
            : {}),
          ...(input?.nurOffeneZuordnung ? { patientId: null } : {}),
        },
        include: { channel: true, patient: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    }),

  get: permissionProcedure("view", "eingang")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const eingang = await ctx.prisma.eingang.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { channel: true, patient: true, attachments: true, vorgaenge: true },
      });
      if (!eingang) throw new TRPCError({ code: "NOT_FOUND" });
      return eingang;
    }),

  process: permissionProcedure("update", "eingang")
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["NEU", "IN_BEARBEITUNG", "ZUGEORDNET", "ABGESCHLOSSEN", "FEHLER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.eingang.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.eingang.update({
        where: { id: input.id },
        data: {
          status: input.status,
          processedAt: input.status === "ABGESCHLOSSEN" ? new Date() : existing.processedAt,
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "eingang",
        resourceId: input.id,
        after: { status: input.status },
        ipAddress: ctx.ip,
      });
      return updated;
    }),

  assignPatient: permissionProcedure("update", "eingang")
    .input(z.object({ id: z.string(), patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [eingang, patient] = await Promise.all([
        ctx.prisma.eingang.findFirst({ where: { id: input.id, tenantId: ctx.tenantId } }),
        ctx.prisma.patient.findFirst({ where: { id: input.patientId, tenantId: ctx.tenantId } }),
      ]);
      if (!eingang || !patient) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.eingang.update({
        where: { id: input.id },
        data: { patientId: input.patientId, status: "ZUGEORDNET" },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "eingang",
        resourceId: input.id,
        after: { patientId: input.patientId },
        ipAddress: ctx.ip,
      });
      return updated;
    }),

  createVorgang: permissionProcedure("create", "vorgang")
    .input(
      z.object({
        eingangId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        priority: z.enum(["URGENT", "HOCH", "MITTEL", "NIEDRIG"]).default("MITTEL"),
        freigabeErforderlich: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const eingang = await ctx.prisma.eingang.findFirst({
        where: { id: input.eingangId, tenantId: ctx.tenantId },
      });
      if (!eingang) throw new TRPCError({ code: "NOT_FOUND" });
      const vorgang = await ctx.prisma.vorgang.create({
        data: {
          tenantId: ctx.tenantId,
          nummer: `VG-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`,
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          priority: input.priority,
          patientId: eingang.patientId,
          eingangId: eingang.id,
          freigabeErforderlich: input.freigabeErforderlich,
          status: input.freigabeErforderlich ? "FREIGABE_ERFORDERLICH" : "OFFEN",
        },
      });
      await ctx.prisma.eingang.update({
        where: { id: eingang.id },
        data: { status: "IN_BEARBEITUNG" },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "vorgang",
        resourceId: vorgang.id,
        ipAddress: ctx.ip,
      });
      return vorgang;
    }),
});
