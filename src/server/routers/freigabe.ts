import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, permissionProcedure } from "../trpc";
import { createAudit } from "@/lib/audit";

/**
 * Freigabe-Workflow (medizinische Freigabe).
 * - request: von berechtigten Rollen (MPA, Leitung, Arzt)
 * - approve/reject/return: NUR ARZT (permissionProcedure approve:freigabe)
 */
export const freigabeRouter = router({
  queue: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.freigabe.findMany({
      where: { tenantId: ctx.tenantId, decision: null },
      include: {
        vorgang: { select: { id: true, nummer: true, title: true, priority: true } },
        requester: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  request: protectedProcedure
    .input(
      z.object({
        vorgangId: z.string(),
        typ: z.string().default("aerztlich"),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vorgang = await ctx.prisma.vorgang.findFirst({
        where: { id: input.vorgangId, tenantId: ctx.tenantId },
      });
      if (!vorgang) throw new TRPCError({ code: "NOT_FOUND" });
      const freigabe = await ctx.prisma.freigabe.create({
        data: {
          tenantId: ctx.tenantId,
          vorgangId: input.vorgangId,
          requestedBy: ctx.user.id,
          typ: input.typ,
          reason: input.reason,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await ctx.prisma.vorgang.update({
        where: { id: input.vorgangId },
        data: { status: "FREIGABE_ERFORDERLICH", freigabeErforderlich: true },
      });
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "CREATE",
        resource: "freigabe",
        resourceId: freigabe.id,
        ipAddress: ctx.ip,
      });
      return freigabe;
    }),

  decide: permissionProcedure("approve", "freigabe")
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["GENEHMIGT", "ABGELEHNT", "ZURUECKGEWIESEN"]),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const freigabe = await ctx.prisma.freigabe.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!freigabe) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.freigabe.update({
        where: { id: input.id },
        data: {
          decision: input.decision,
          reviewedBy: ctx.user.id,
          decidedAt: new Date(),
          reason: input.note ?? freigabe.reason,
        },
      });
      // Vorgangsstatus je nach Entscheidung
      if (freigabe.vorgangId) {
        await ctx.prisma.vorgang.update({
          where: { id: freigabe.vorgangId },
          data: {
            status: input.decision === "GENEHMIGT" ? "IN_BEARBEITUNG" : "OFFEN",
          },
        });
      }
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: input.decision === "GENEHMIGT" ? "APPROVE" : "REJECT",
        resource: "freigabe",
        resourceId: input.id,
        after: { decision: input.decision },
        ipAddress: ctx.ip,
      });
      return updated;
    }),
});
