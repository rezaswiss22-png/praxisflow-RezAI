import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuswertungenCharts } from "./Charts";

/**
 * Auswertungen – nur für PRAXISLEITUNG und ARZT.
 * Serverseitige Absicherung des Seitenzugriffs (zusätzlich zur Navigation).
 */
export default async function AuswertungenPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (!["PRAXISLEITUNG", "ARZT"].includes(session.user.role)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold text-ampel-rot">Kein Zugriff</p>
        <p className="mt-1 text-sm text-slate-500">
          Auswertungen sind nur für Praxisleitung und Ärztinnen/Ärzte verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Auswertungen</h1>
      <p className="mb-6 text-sm text-slate-500">
        Kennzahlen und Verteilungen (synthetische Pilotdaten).
      </p>
      <AuswertungenCharts />
    </div>
  );
}
