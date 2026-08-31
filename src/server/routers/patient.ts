import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

export const patientRouter = router({
  list: permissionProcedure("view", "patient")
    .input(
      z
        .object({
          search: z.string().optional(),
          includeDeleted: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      return ctx.prisma.patient.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input?.includeDeleted ? {} : { deletedAt: null }),
          ...(search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { patientenNummer: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 200,
      });
    }),

  get: permissionProcedure("view", "patient")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          vorgaenge: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
          dokumente: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
          appointments: { orderBy: { startAt: "desc" } },
          callbacks: { orderBy: { createdAt: "desc" } },
          consents: true,
        },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "VIEW",
        resource: "patient",
        resourceId: patient.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return patient;
    }),

  duplicates: permissionProcedure("view", "patient").query(async ({ ctx }) => {
    return ctx.prisma.patient.findMany({
      where: { tenantId: ctx.tenantId, duplicateOfId: { not: null }, deletedAt: null },
    });
  }),

  create: permissionProcedure("create", "patient")
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        kanton: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.create({
        data: {
          tenantId: ctx.tenantId,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          phone: input.phone,
          email: input.email || null,
          kanton: input.kanton,
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "patient",
        resourceId: patient.id,
        ipAddress: ctx.ip,
      });
      return patient;
    }),

  update: permissionProcedure("update", "patient")
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        consentStatus: z.enum(["ERTEILT", "WIDERRUFEN", "AUSSTEHEND"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.patient.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const patient = await ctx.prisma.patient.update({ where: { id }, data });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "patient",
        resourceId: id,
        ipAddress: ctx.ip,
      });
      return patient;
    }),

  softDelete: permissionProcedure("delete", "patient")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.patient.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.patient.update({
        where: { id: input.id },
        data: { deletedAt: new Date(), status: "geloescht" },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "DELETE",
        resource: "patient",
        resourceId: input.id,
        ipAddress: ctx.ip,
      });
      return { success: true };
    }),
});
