import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

const prioEnum = z.enum(["URGENT", "HOCH", "MITTEL", "NIEDRIG"]);
const statusEnum = z.enum(["OFFEN", "IN_BEARBEITUNG", "ERLEDIGT", "ABGEBROCHEN"]);

export const taskRouter = router({
  // PERSONAL sieht nur eigene Aufgaben – Filterlogik serverseitig erzwungen.
  list: protectedProcedure
    .input(
      z.object({ scope: z.enum(["meine", "team", "alle"]).default("meine") }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const scope = input?.scope ?? "meine";
      const isPersonal = ctx.user.role === "PERSONAL";
      const where: any = { tenantId: ctx.tenantId };

      if (isPersonal || scope === "meine") {
        where.assignedTo = ctx.user.id;
      }
      // Team/Alle nur für nicht-PERSONAL Rollen sichtbar
      return ctx.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true } },
          vorgang: { select: { id: true, nummer: true, title: true } },
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        take: 300,
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { assignee: true, vorgang: true, patient: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role === "PERSONAL" && task.assignedTo !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return task;
    }),

  create: permissionProcedure("create", "aufgabe")
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        vorgangId: z.string().optional(),
        patientId: z.string().optional(),
        priority: prioEnum.default("MITTEL"),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.create({
        data: {
          tenantId: ctx.tenantId,
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          assignedBy: ctx.user.id,
          vorgangId: input.vorgangId,
          patientId: input.patientId,
          priority: input.priority,
          dueDate: input.dueDate,
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "aufgabe",
        resourceId: task.id,
        ipAddress: ctx.ip,
      });
      return task;
    }),

  update: permissionProcedure("update", "aufgabe")
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        status: statusEnum.optional(),
        priority: prioEnum.optional(),
        assignedTo: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.task.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.task.update({ where: { id }, data });
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.task.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      // PERSONAL darf nur eigene Aufgaben erledigen
      if (ctx.user.role === "PERSONAL" && existing.assignedTo !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const task = await ctx.prisma.task.update({
        where: { id: input.id },
        data: { status: "ERLEDIGT", completedAt: new Date(), completedBy: ctx.user.id },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "aufgabe",
        resourceId: input.id,
        after: { status: "ERLEDIGT" },
        ipAddress: ctx.ip,
      });
      return task;
    }),
});
