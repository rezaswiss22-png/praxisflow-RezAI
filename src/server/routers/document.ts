import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";
import { nanoid } from "nanoid";

const docTypeEnum = z.enum([
  "LABORBERICHT",
  "REZEPT",
  "UEBERWEISUNG",
  "BEFUND",
  "BRIEF",
  "SONSTIGES",
]);

export const documentRouter = router({
  list: permissionProcedure("view", "dokument")
    .input(
      z
        .object({
          docType: docTypeEnum.optional(),
          patientId: z.string().optional(),
          status: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(input?.docType ? { docType: input.docType } : {}),
          ...(input?.patientId ? { patientId: input.patientId } : {}),
          ...(input?.status ? { status: input.status } : {}),
        },
        include: { patient: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    }),

  get: permissionProcedure("view", "dokument")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { patient: true, vorgang: true },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return doc;
    }),

  // [MOCK] Upload-Simulation – speichert nur Metadaten, keine echte Datei.
  upload: permissionProcedure("create", "dokument")
    .input(
      z.object({
        title: z.string().min(1),
        docType: docTypeEnum.default("SONSTIGES"),
        patientId: z.string().optional(),
        vorgangId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.create({
        data: {
          tenantId: ctx.tenantId,
          title: input.title,
          docType: input.docType,
          patientId: input.patientId,
          vorgangId: input.vorgangId,
          storageKey: `mock/${nanoid(10)}.pdf`,
          mimeType: "application/pdf",
          uploadedBy: ctx.user.id,
          patientZuordnung: input.patientId ? "bestaetigt" : "offen",
        },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "dokument",
        resourceId: doc.id,
        ipAddress: ctx.ip,
      });
      return doc;
    }),

  assignPatient: permissionProcedure("update", "dokument")
    .input(z.object({ id: z.string(), patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.document.update({
        where: { id: input.id },
        data: { patientId: input.patientId, patientZuordnung: "bestaetigt" },
      });
    }),

  // Ärztliche Kontrolle bestätigen – nur ARZT
  confirmMedical: permissionProcedure("medical", "dokument")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: { aerztlicheKontrolle: true, status: "kontrolliert" },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "APPROVE",
        resource: "dokument",
        resourceId: input.id,
        ipAddress: ctx.ip,
      });
      return updated;
    }),
});
