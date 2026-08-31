"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, ampelFuerPrioritaet } from "@/components/ui/StatusBadge";
import { formatDatum } from "@/lib/utils";

type Prio = "URGENT" | "HOCH" | "MITTEL" | "NIEDRIG";
type VStatus = "OFFEN" | "IN_BEARBEITUNG" | "WARTET" | "FREIGABE_ERFORDERLICH" | "ABGESCHLOSSEN" | "ARCHIVIERT";

const PRIO_LABEL: Record<Prio, string> = { URGENT: "Dringend", HOCH: "Hoch", MITTEL: "Mittel", NIEDRIG: "Niedrig" };
const VSTATUS_LABEL: Record<VStatus, string> = {
  OFFEN: "Offen", IN_BEARBEITUNG: "In Bearbeitung", WARTET: "Wartet",
  FREIGABE_ERFORDERLICH: "Freigabe nötig", ABGESCHLOSSEN: "Abgeschlossen", ARCHIVIERT: "Archiviert",
};

type Row = {
  id: string;
  nummer: string;
  title: string;
  priority: Prio;
  status: VStatus;
  dueDate: Date | null;
  patient: { firstName: string; lastName: string } | null;
  category: { name: string } | null;
  assignee: { name: string | null } | null;
};

export default function VorgaengePage() {
  const [prio, setPrio] = useState<Prio | "">("");
  const { data, isLoading } = trpc.vorgang.list.useQuery(prio ? { priority: prio } : undefined);

  const columns: Column<Row>[] = [
    { key: "nummer", header: "Nr.", render: (r) => <span className="font-mono text-xs text-slate-500">{r.nummer}</span> },
    { key: "title", header: "Titel", render: (r) => <span className="font-medium text-slate-700">{r.title}</span> },
    {
      key: "priority",
      header: "Priorität",
      render: (r) => <StatusBadge ampel={ampelFuerPrioritaet(r.priority)} label={PRIO_LABEL[r.priority]} />,
    },
    { key: "category", header: "Kategorie", render: (r) => r.category?.name ?? "—" },
    {
      key: "patient",
      header: "Patient",
      render: (r) => (r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "—"),
    },
    { key: "assignee", header: "Verantwortlich", render: (r) => r.assignee?.name ?? "— offen" },
    { key: "status", header: "Status", render: (r) => VSTATUS_LABEL[r.status] },
    { key: "dueDate", header: "Fällig", render: (r) => (r.dueDate ? formatDatum(r.dueDate) : "—") },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Vorgänge</h1>
      <p className="mb-4 text-sm text-slate-500">Alle Praxis-Vorgänge mit Priorität, Zuständigkeit und Status.</p>

      <div className="mb-4">
        <select className="input max-w-xs" value={prio} onChange={(e) => setPrio(e.target.value as Prio | "")}>
          <option value="">Alle Prioritäten</option>
          {Object.entries(PRIO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <DataTable<Row> columns={columns} rows={(data as Row[]) ?? []} loading={isLoading} emptyText="Keine Vorgänge gefunden." />
    </div>
  );
}
