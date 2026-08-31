"use client";

import { trpc } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MockBadge } from "@/components/ui/MockBadge";
import { formatDatumZeit } from "@/lib/utils";
import { useState } from "react";

type Adapter = {
  key: string;
  name: string;
  isMock: boolean;
  readOnly: boolean;
  status: "AKTIV" | "INAKTIV" | "FEHLER";
  lastHealthCheck: Date | null;
};

export default function EinstellungenPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adapter.list.useQuery();
  const health = trpc.adapter.healthCheck.useMutation({
    onSuccess: () => utils.adapter.list.invalidate(),
  });
  const [checking, setChecking] = useState<string | null>(null);

  const adapters = (data as Adapter[]) ?? [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Einstellungen</h1>
      <p className="mb-6 text-sm text-slate-500">
        Integrationen und Systemstatus. Im Pilot sind alle Adapter Mock-Adapter (Sandbox).
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-700">Integrationsadapter</h2>
        {isLoading && <p className="text-slate-400">Wird geladen …</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {adapters.map((a) => (
            <div key={a.key} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{a.name}</span>
                    <MockBadge />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.readOnly ? "Nur-lesend" : "Lesen/Schreiben"} · Schlüssel: {a.key}
                  </p>
                </div>
                <StatusBadge
                  ampel={a.status === "FEHLER" ? "rot" : a.status === "AKTIV" ? "gruen" : "neutral"}
                  label={a.status === "FEHLER" ? "Fehler" : a.status === "AKTIV" ? "Aktiv" : "Inaktiv"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Letzter Check: {a.lastHealthCheck ? formatDatumZeit(a.lastHealthCheck) : "—"}
                </span>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={health.isPending && checking === a.key}
                  onClick={() => {
                    setChecking(a.key);
                    health.mutate({ key: a.key });
                  }}
                >
                  {health.isPending && checking === a.key ? "Prüfe …" : "Health-Check"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
