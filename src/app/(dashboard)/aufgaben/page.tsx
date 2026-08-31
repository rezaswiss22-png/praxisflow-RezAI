"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, ampelFuerPrioritaet, type Ampel } from "@/components/ui/StatusBadge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatDatum, istUeberfaellig } from "@/lib/utils";

type Prio = "URGENT" | "HOCH" | "MITTEL" | "NIEDRIG";
type TStatus = "OFFEN" | "IN_BEARBEITUNG" | "ERLEDIGT" | "ABGEBROCHEN";
const PRIO_LABEL: Record<Prio, string> = { URGENT: "Dringend", HOCH: "Hoch", MITTEL: "Mittel", NIEDRIG: "Niedrig" };
const TSTATUS: Record<TStatus, { ampel: Ampel; label: string }> = {
  OFFEN: { ampel: "gelb", label: "Offen" },
  IN_BEARBEITUNG: { ampel: "gelb", label: "In Bearbeitung" },
  ERLEDIGT: { ampel: "gruen", label: "Erledigt" },
  ABGEBROCHEN: { ampel: "neutral", label: "Abgebrochen" },
};

type Row = {
  id: string;
  title: string;
  priority: Prio;
  status: TStatus;
  dueDate: Date | null;
  assignee: { name: string | null } | null;
  vorgang: { nummer: string; title: string } | null;
};

export default function AufgabenPage() {
  const [scope, setScope] = useState<"meine" | "team" | "alle">("meine");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.task.list.useQuery({ scope });
  const complete = trpc.task.complete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const columns: Column<Row>[] = [
    { key: "title", header: "Aufgabe", render: (r) => <span className="font-medium text-slate-700">{r.title}</span> },
    { key: "vorgang", header: "Vorgang", render: (r) => (r.vorgang ? `${r.vorgang.nummer}` : "—") },
    { key: "priority", header: "Priorität", render: (r) => <StatusBadge ampel={ampelFuerPrioritaet(r.priority)} label={PRIO_LABEL[r.priority]} /> },
    {
      key: "dueDate",
      header: "Fällig",
      render: (r) =>
        r.dueDate ? (
          <span className={istUeberfaellig(r.dueDate) && r.status !== "ERLEDIGT" ? "font-semibold text-ampel-rot" : ""}>
            {formatDatum(r.dueDate)}
          </span>
        ) : "—",
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge ampel={TSTATUS[r.status].ampel} label={TSTATUS[r.status].label} /> },
    {
      key: "aktion",
      header: "Aktion",
      render: (r) =>
        r.status !== "ERLEDIGT" && r.status !== "ABGEBROCHEN" ? (
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmId(r.id);
            }}
          >
            Erledigen
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Aufgaben</h1>
      <p className="mb-4 text-sm text-slate-500">Ihre und dem Team zugewiesene Aufgaben.</p>

      <div className="mb-4">
        <select className="input max-w-xs" value={scope} onChange={(e) => setScope(e.target.value as "meine" | "team" | "alle")}>
          <option value="meine">Meine Aufgaben</option>
          <option value="team">Team</option>
          <option value="alle">Alle</option>
        </select>
      </div>

      <DataTable<Row> columns={columns} rows={(data as Row[]) ?? []} loading={isLoading} emptyText="Keine Aufgaben gefunden." />

      <ConfirmationDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
        titel="Aufgabe erledigen"
        beschreibung="Möchten Sie diese Aufgabe wirklich als erledigt markieren? Diese Aktion wird protokolliert."
        bestaetigenText="Als erledigt markieren"
        onBestaetigen={() => {
          if (confirmId) complete.mutate({ id: confirmId });
          setConfirmId(null);
        }}
      />
    </div>
  );
}
