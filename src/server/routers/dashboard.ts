import { router, protectedProcedure } from "../trpc";

/**
 * Dashboard-KPIs für die Übersicht.
 * Liefert die Zahlen für das Widget-Grid inkl. Ampel-Bewertung.
 */
export const dashboardRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantId;
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      neueEingaenge,
      dringendeVorgaenge,
      ueberfaelligeAufgaben,
      heutigeRueckrufe,
      heutigeTermine,
      vorgaengeOhneVerantwortliche,
      offeneZuordnungen,
      integrationsstoerungen,
      meineAufgaben,
      offeneFreigaben,
    ] = await Promise.all([
      ctx.prisma.eingang.count({ where: { tenantId, status: "NEU", deletedAt: null } }),
      ctx.prisma.vorgang.count({
        where: { tenantId, priority: "URGENT", status: { notIn: ["ABGESCHLOSSEN", "ARCHIVIERT"] }, deletedAt: null },
      }),
      ctx.prisma.task.count({
        where: { tenantId, status: { in: ["OFFEN", "IN_BEARBEITUNG"] }, dueDate: { lt: now } },
      }),
      ctx.prisma.callback.count({
        where: { tenantId, status: { in: ["AUSSTEHEND", "GEPLANT"] }, scheduledAt: { lte: endOfDay } },
      }),
      ctx.prisma.appointment.count({
        where: { tenantId, startAt: { gte: startOfDay, lte: endOfDay }, status: { notIn: ["ABGESAGT"] } },
      }),
      ctx.prisma.vorgang.count({
        where: { tenantId, assignedTo: null, status: { notIn: ["ABGESCHLOSSEN", "ARCHIVIERT"] }, deletedAt: null },
      }),
      ctx.prisma.eingang.count({ where: { tenantId, patientId: null, status: { not: "ABGESCHLOSSEN" }, deletedAt: null } }),
      ctx.prisma.integrationAdapter.count({ where: { tenantId, status: "FEHLER" } }),
      ctx.prisma.task.count({
        where: { tenantId, assignedTo: ctx.user.id, status: { in: ["OFFEN", "IN_BEARBEITUNG"] } },
      }),
      ctx.prisma.freigabe.count({ where: { tenantId, decision: null } }),
    ]);

    return {
      neueEingaenge,
      dringendeVorgaenge,
      ueberfaelligeAufgaben,
      heutigeRueckrufe,
      heutigeTermine,
      vorgaengeOhneVerantwortliche,
      offeneZuordnungen,
      integrationsstoerungen,
      meineAufgaben,
      offeneFreigaben,
    };
  }),
});
