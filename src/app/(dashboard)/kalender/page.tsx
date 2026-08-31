"use client";

import { trpc } from "@/lib/trpc/client";
import { StatusBadge, type Ampel } from "@/components/ui/StatusBadge";
import { MockBadge } from "@/components/ui/MockBadge";
import { formatDatum, formatZeit } from "@/lib/utils";

type AStatus = "GEPLANT" | "BESTAETIGT" | "ABGESAGT" | "UMGEPLANT" | "ERFOLGT";
const ASTATUS: Record<AStatus, { ampel: Ampel; label: string }> = {
  GEPLANT: { ampel: "gelb", label: "Geplant" },
  BESTAETIGT: { ampel: "gruen", label: "Bestätigt" },
  ABGESAGT: { ampel: "rot", label: "Abgesagt" },
  UMGEPLANT: { ampel: "gelb", label: "Umgeplant" },
  ERFOLGT: { ampel: "gruen", label: "Erfolgt" },
};

type Appt = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: AStatus;
  location: string | null;
  onedocId: string | null;
  patient: { firstName: string; lastName: string } | null;
  provider: { name: string | null } | null;
};

export default function KalenderPage() {
  const { data, isLoading } = trpc.appointment.list.useQuery(undefined);
  const appts = (data as Appt[]) ?? [];

  // Nach Tag gruppieren
  const gruppen = appts.reduce<Record<string, Appt[]>>((acc, a) => {
    const key = formatDatum(a.startAt);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Kalender</h1>
      <p className="mb-4 text-sm text-slate-500">Termine (Import/Export via ICS-Mock-Adapter).</p>

      {isLoading && <p className="text-slate-400">Wird geladen …</p>}
      {!isLoading && appts.length === 0 && (
        <div className="card p-8 text-center text-slate-400">Keine Termine vorhanden.</div>
      )}

      <div className="space-y-6">
        {Object.entries(gruppen).map(([tag, liste]) => (
          <div key={tag}>
            <h2 className="mb-2 text-sm font-semibold text-slate-500">{tag}</h2>
            <div className="space-y-2">
              {liste.map((a) => (
                <div key={a.id} className="card flex items-center gap-4 p-4">
                  <div className="w-24 shrink-0 text-sm font-semibold text-slate-700">
                    {formatZeit(a.startAt)}–{formatZeit(a.endAt)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{a.title}</span>
                      {a.onedocId && <MockBadge />}
                    </div>
                    <p className="text-xs text-slate-500">
                      {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "ohne Patient"}
                      {a.provider?.name ? ` · ${a.provider.name}` : ""}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                  <StatusBadge ampel={ASTATUS[a.status].ampel} label={ASTATUS[a.status].label} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
