import { z } from "zod";
import { router, protectedProcedure, roleProcedure } from "../trpc";
import { listAdapters, getAdapter } from "@/lib/adapters";
import { createAudit } from "@/lib/audit";

/**
 * Adapter-Router.
 * Listet die (Mock-)Integrationsadapter, führt Health-Checks aus und
 * kann synthetische Mock-Ereignisse auslösen. Alle Adapter sind MOCK.
 */
export const adapterRouter = router({
  /** Liste aller registrierten Adapter inkl. DB-Status. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const registered = listAdapters();
    const dbAdapters = await ctx.prisma.integrationAdapter.findMany({
      where: { tenantId: ctx.tenantId },
    });
    return registered.map((a) => {
      const db = dbAdapters.find((d) => d.adapterType === a.key);
      return {
        key: a.key,
        name: a.name,
        isMock: a.isMock,
        readOnly: a.readOnly,
        status: db?.status ?? "AKTIV",
        lastHealthCheck: db?.lastHealthCheck ?? null,
      };
    });
  }),

  /** Health-Check eines Adapters (Mock-Latenz, aktualisiert lastHealthCheck). */
  healthCheck: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adapter = getAdapter(input.key);
      if (!adapter) {
        throw new Error("Unbekannter Adapter");
      }
      const result = await adapter.healthCheck();
      await ctx.prisma.integrationAdapter.updateMany({
        where: { tenantId: ctx.tenantId, adapterType: input.key },
        data: {
          lastHealthCheck: new Date(),
          status: result.status === "ok" ? "AKTIV" : "FEHLER",
        },
      });
      return result;
    }),

  /** Löst ein synthetisches Mock-Ereignis aus (nur SYSADMIN/PRAXISLEITUNG). */
  triggerMock: roleProcedure(["SYSADMIN", "PRAXISLEITUNG"])
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adapter = getAdapter(input.key);
      if (!adapter) {
        throw new Error("Unbekannter Adapter");
      }
      const db = await ctx.prisma.integrationAdapter.findFirst({
        where: { tenantId: ctx.tenantId, adapterType: input.key },
      });
      if (db) {
        await ctx.prisma.integrationEvent.create({
          data: {
            tenantId: ctx.tenantId,
            adapterId: db.id,
            eventType: "MOCK_TRIGGER",
            direction: "INBOUND",
            status: "VERARBEITET",
            processedAt: new Date(),
            payload: { note: "[MOCK] manuell ausgelöstes synthetisches Ereignis" },
          },
        });
      }
      await createAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
        action: "UPDATE",
        resource: "adapter",
        resourceId: db?.id ?? input.key,
        result: `[MOCK] Ereignis für Adapter ${input.key} ausgelöst`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true, message: `[MOCK] Ereignis für ${adapter.name} ausgelöst.` };
    }),
});
