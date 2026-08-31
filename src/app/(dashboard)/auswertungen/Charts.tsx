"use client";

import { trpc } from "@/lib/trpc/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PRIO_LABEL: Record<string, string> = { URGENT: "Dringend", HOCH: "Hoch", MITTEL: "Mittel", NIEDRIG: "Niedrig" };
const STATUS_LABEL: Record<string, string> = {
  OFFEN: "Offen", IN_BEARBEITUNG: "In Bearbeitung", WARTET: "Wartet",
  FREIGABE_ERFORDERLICH: "Freigabe nötig", ABGESCHLOSSEN: "Abgeschlossen", ARCHIVIERT: "Archiviert",
};
const COLORS = ["#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed", "#0891b2"];

export function AuswertungenCharts() {
  const { data: vorgaenge, isLoading } = trpc.vorgang.list.useQuery(undefined);
  const { data: overview } = trpc.dashboard.overview.useQuery();

  const list = vorgaenge ?? [];

  const prioData = Object.entries(
    list.reduce<Record<string, number>>((acc, v: { priority: string }) => {
      acc[v.priority] = (acc[v.priority] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([k, v]) => ({ name: PRIO_LABEL[k] ?? k, value: v }));

  const statusData = Object.entries(
    list.reduce<Record<string, number>>((acc, v: { status: string }) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v }));

  const kpiData = overview
    ? [
        { name: "Neue Eingänge", value: overview.neueEingaenge },
        { name: "Dringende Vorgänge", value: overview.dringendeVorgaenge },
        { name: "Überfällige Aufgaben", value: overview.ueberfaelligeAufgaben },
        { name: "Offene Freigaben", value: overview.offeneFreigaben },
      ]
    : [];

  if (isLoading) return <p className="text-slate-400">Wird geladen …</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-600">Vorgänge nach Priorität</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={prioData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-600">Vorgänge nach Status</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {statusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4 lg:col-span-2">
        <h2 className="mb-4 text-sm font-semibold text-slate-600">Aktuelle Kennzahlen</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={kpiData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
