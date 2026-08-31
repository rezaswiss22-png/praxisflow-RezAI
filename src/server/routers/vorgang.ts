import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure, protectedProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";
import { nanoid } from "nanoid";

const prioEnum = z.enum(["URGENT", "HOCH", "MITTEL", "NIEDRIG"]);
const statusEnum = z.enum([
  "OFFEN",
  "IN_BEARBEITUNG",
  "WARTET",
  "FREIGABE_ERFORDERLICH",
  "ABGESCHLOSSEN",
  "ARCHIVIERT",
]);

export const vorgangRouter = router({
  list: permissionProcedure("view", "vorgang")
    .input(
      z
        .object({
          status: statusEnum.optional(),
          priority: prioEnum.optional(),
          categoryId: z.string().optional(),
          assignedTo: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.vorgang.findMany({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.priority ? { priority: input.priority } : {}),
          ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input?.assignedTo ? { assignedTo: input.assignedTo } : {}),
        },
        include: {
          patient: true,
          category: true,
          assignee: { select: { id: true, name: true } },
          _count: { select: { tasks: true, kommentare: true, freigaben: true } },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 300,
      });
    }),

  get: permissionProcedure("view", "vorgang")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vorgang = await ctx.prisma.vorgang.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          patient: true,
          category: true,
          eingang: { include: { channel: true } },
          assignee: { select: { id: true, name: true, role: true } },
          tasks: { orderBy: { createdAt: "desc" } },
          kommentare: {
            where: { deletedAt: null },
            include: { author: { select: { name: true, role: true } } },
            orderBy: { createdAt: "desc" },
          },
          freigaben: {
            include: {
              requester: { select: { name: true } },
              reviewer: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          dokumente: { where: { deletedAt: null } },
        },
      });
      if (!vorgang) throw new TRPCError({ code: "NOT_FOUND" });
      return vorgang;
    }),

  create: permissionProcedure("create", "vorgang")
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        patientId: z.string().optional(),
        priority: prioEnum.default("MITTEL"),
        dueDate: z.date().optional(),
        freigabeErforderlich: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vorgang = await ctx.prisma.vorgang.create({
        data: {
          tenantId: ctx.tenantId,
          nummer: `VG-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`,
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          patientId: input.patientId,
          priority: input.priority,
          dueDate: input.dueDate,
          freigabeErforderlich: input.freigabeErforderlich,
          status: input.freigabeErforderlich ? "FREIGABE_ERFORDERLICH" : "OFFEN",
        },
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

  update: permissionProcedure("update", "vorgang")
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: statusEnum.optional(),
        priority: prioEnum.optional(),
        assignedTo: z.string().nullable().optional(),
        categoryId: z.string().optional(),
        dueDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.vorgang.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const vorgang = await ctx.prisma.vorgang.update({
        where: { id },
        data: { ...data, version: { increment: 1 } },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "vorgang",
        resourceId: id,
        before: { status: existing.status, priority: existing.priority },
        after: { status: vorgang.status, priority: vorgang.priority },
        ipAddress: ctx.ip,
      });
      return vorgang;
    }),

  close: permissionProcedure("close", "vorgang")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.vorgang.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const vorgang = await ctx.prisma.vorgang.update({
        where: { id: input.id },
        data: { status: "ABGESCHLOSSEN", closedAt: new Date(), closedBy: ctx.user.id },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "vorgang",
        resourceId: input.id,
        after: { status: "ABGESCHLOSSEN" },
        ipAddress: ctx.ip,
      });
      return vorgang;
    }),

  escalate: permissionProcedure("escalate", "vorgang")
    .input(z.object({ id: z.string(), escalatedTo: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.vorgang.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const vorgang = await ctx.prisma.vorgang.update({
        where: { id: input.id },
        data: {
          escalatedAt: new Date(),
          escalatedTo: input.escalatedTo,
          priority: "HOCH",
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "ESCALATE",
        resource: "vorgang",
        resourceId: input.id,
        ipAddress: ctx.ip,
      });
      return vorgang;
    }),

  addKommentar: protectedProcedure
    .input(z.object({ vorgangId: z.string(), content: z.string().min(1), isInternal: z.boolean().default(true) }))
    .mutation(async ({ ctx, input }) => {
      const vorgang = await ctx.prisma.vorgang.findFirst({
        where: { id: input.vorgangId, tenantId: ctx.tenantId },
      });
      if (!vorgang) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.kommentar.create({
        data: {
          tenantId: ctx.tenantId,
          vorgangId: input.vorgangId,
          authorId: ctx.user.id,
          content: input.content,
          isInternal: input.isInternal,
        },
      });
    }),

  categories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vorgangCategory.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: "asc" },
    });
  }),
});
