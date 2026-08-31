"use client";

import { trpc } from "@/lib/trpc/client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDatum } from "@/lib/utils";
import { FileText } from "lucide-react";

type DocType = "LABORBERICHT" | "REZEPT" | "UEBERWEISUNG" | "BEFUND" | "BRIEF" | "SONSTIGES";
const DOCTYPE_LABEL: Record<DocType, string> = {
  LABORBERICHT: "Laborbericht",
  REZEPT: "Rezept",
  UEBERWEISUNG: "Überweisung",
  BEFUND: "Befund",
  BRIEF: "Brief",
  SONSTIGES: "Sonstiges",
};

type Row = {
  id: string;
  title: string;
  docType: DocType;
  aerztlicheKontrolle: boolean;
  patientZuordnung: string;
  createdAt: Date;
  patient: { firstName: string; lastName: string } | null;
};

export default function DokumentePage() {
  const { data, isLoading } = trpc.document.list.useQuery(undefined);

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Dokument",
      render: (r) => (
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <FileText className="h-4 w-4 text-slate-400" aria-hidden /> {r.title}
        </span>
      ),
    },
    { key: "docType", header: "Typ", render: (r) => DOCTYPE_LABEL[r.docType] },
    {
      key: "patient",
      header: "Patient",
      render: (r) => (r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "— nicht zugeordnet"),
    },
    {
      key: "aerztlicheKontrolle",
      header: "Ärztliche Kontrolle",
      render: (r) =>
        r.aerztlicheKontrolle ? (
          <StatusBadge ampel="gruen" label="Kontrolliert" />
        ) : (
          <StatusBadge ampel="gelb" label="Ausstehend" />
        ),
    },
    { key: "createdAt", header: "Erstellt", render: (r) => formatDatum(r.createdAt) },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Dokumente</h1>
      <p className="mb-4 text-sm text-slate-500">
        Dokumentenablage (Pilot: nur Metadaten, keine echten Dateien).
      </p>
      <DataTable<Row> columns={columns} rows={(data as Row[]) ?? []} loading={isLoading} emptyText="Keine Dokumente gefunden." />
    </div>
  );
}
