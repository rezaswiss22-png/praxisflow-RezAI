"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type Ampel } from "@/components/ui/StatusBadge";
import { MockBadge } from "@/components/ui/MockBadge";
import { formatDatumZeit } from "@/lib/utils";

type EingangStatus = "NEU" | "IN_BEARBEITUNG" | "ZUGEORDNET" | "ABGESCHLOSSEN" | "FEHLER";

const STATUS_AMPEL: Record<EingangStatus, { ampel: Ampel; label: string }> = {
  NEU: { ampel: "gelb", label: "Neu" },
  IN_BEARBEITUNG: { ampel: "gelb", label: "In Bearbeitung" },
  ZUGEORDNET: { ampel: "gruen", label: "Zugeordnet" },
  ABGESCHLOSSEN: { ampel: "gruen", label: "Abgeschlossen" },
  FEHLER: { ampel: "rot", label: "Fehler" },
};

type Row = {
  id: string;
  subject: string | null;
  senderName: string | null;
  status: EingangStatus;
  createdAt: Date;
  channel: { type: string } | null;
  patient: { firstName: string; lastName: string } | null;
};

export default function EingangPage() {
  const [status, setStatus] = useState<EingangStatus | "">("");
  const { data, isLoading } = trpc.eingang.list.useQuery(
    status ? { status } : undefined,
  );

  const columns: Column<Row>[] = [
    {
      key: "subject",
      header: "Betreff",
      render: (r) => (
        <div className="flex items-center gap-2">
          <MockBadge />
          <span className="font-medium text-slate-700">{r.subject ?? "(ohne Betreff)"}</span>
        </div>
      ),
    },
    { key: "senderName", header: "Absender", render: (r) => r.senderName ?? "—" },
    { key: "channel", header: "Kanal", render: (r) => r.channel?.type ?? "—" },
    {
      key: "patient",
      header: "Patient",
      render: (r) => (r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "— nicht zugeordnet"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge ampel={STATUS_AMPEL[r.status].ampel} label={STATUS_AMPEL[r.status].label} />,
    },
    { key: "createdAt", header: "Eingegangen", render: (r) => formatDatumZeit(r.createdAt) },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Eingang</h1>
      <p className="mb-4 text-sm text-slate-500">
        Zentrale Eingangsverarbeitung aller Kanäle. Alle Einträge stammen aus Mock-Adaptern.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="input max-w-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value as EingangStatus | "")}
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_AMPEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <DataTable<Row>
        columns={columns}
        rows={(data as Row[]) ?? []}
        loading={isLoading}
        emptyText="Keine Eingänge gefunden."
      />
    </div>
  );
}
