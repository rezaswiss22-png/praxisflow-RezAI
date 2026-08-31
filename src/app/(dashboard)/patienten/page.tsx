"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type Ampel } from "@/components/ui/StatusBadge";
import { formatDatum } from "@/lib/utils";

type Consent = "ERTEILT" | "AUSSTEHEND" | "VERWEIGERT" | "WIDERRUFEN";
const CONSENT: Record<string, { ampel: Ampel; label: string }> = {
  ERTEILT: { ampel: "gruen", label: "Einwilligung erteilt" },
  AUSSTEHEND: { ampel: "gelb", label: "Einwilligung ausstehend" },
  VERWEIGERT: { ampel: "rot", label: "Verweigert" },
  WIDERRUFEN: { ampel: "rot", label: "Widerrufen" },
};

type Row = {
  id: string;
  patientenNummer: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  kanton: string | null;
  consentStatus: Consent;
  duplicateOfId: string | null;
};

export default function PatientenPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.patient.list.useQuery(search ? { search } : undefined);

  const columns: Column<Row>[] = [
    { key: "patientenNummer", header: "Nr.", render: (r) => <span className="font-mono text-xs text-slate-500">{r.patientenNummer ?? "—"}</span> },
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <span className="font-medium text-slate-700">
          {r.lastName}, {r.firstName}
          {r.duplicateOfId && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              mögliche Dublette
            </span>
          )}
        </span>
      ),
    },
    { key: "dateOfBirth", header: "Geburtsdatum", render: (r) => (r.dateOfBirth ? formatDatum(r.dateOfBirth) : "—") },
    { key: "kanton", header: "Kanton", render: (r) => r.kanton ?? "—" },
    {
      key: "consentStatus",
      header: "Einwilligung",
      render: (r) => <StatusBadge ampel={CONSENT[r.consentStatus]?.ampel ?? "neutral"} label={CONSENT[r.consentStatus]?.label ?? r.consentStatus} />,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Patienten</h1>
      <p className="mb-4 text-sm text-slate-500">Synthetische Patientenstammdaten (Pilot). Keine echten Personendaten.</p>

      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder="Suche nach Name oder Nummer …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable<Row> columns={columns} rows={(data as Row[]) ?? []} loading={isLoading} emptyText="Keine Patienten gefunden." />
    </div>
  );
}
