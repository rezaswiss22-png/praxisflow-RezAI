"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { StatusBadge, type Ampel } from "@/components/ui/StatusBadge";
import {
  Inbox,
  AlertTriangle,
  Clock,
  Phone,
  Calendar,
  UserX,
  Link2,
  ServerCrash,
  ListChecks,
  CheckSquare,
} from "lucide-react";

interface Kpi {
  label: string;
  value: number;
  href: string;
  icon: typeof Inbox;
  ampel: (v: number) => Ampel;
  hint: (v: number) => string;
}

interface KpiData {
  neueEingaenge: number;
  dringendeVorgaenge: number;
  ueberfaelligeAufgaben: number;
  heutigeRueckrufe: number;
  heutigeTermine: number;
  vorgaengeOhneVerantwortliche: number;
  offeneZuordnungen: number;
  integrationsstoerungen: number;
  meineAufgaben: number;
  offeneFreigaben: number;
}

const CONFIG: (Kpi & { key: keyof KpiData })[] = [
  { key: "neueEingaenge", label: "Neue Eingänge", href: "/eingang", icon: Inbox, value: 0,
    ampel: (v) => (v > 20 ? "rot" : v > 8 ? "gelb" : "gruen"), hint: (v) => `${v} unbearbeitet` },
  { key: "dringendeVorgaenge", label: "Dringende Vorgänge", href: "/vorgaenge", icon: AlertTriangle, value: 0,
    ampel: (v) => (v > 5 ? "rot" : v > 0 ? "gelb" : "gruen"), hint: (v) => `${v} mit Priorität URGENT` },
  { key: "ueberfaelligeAufgaben", label: "Überfällige Aufgaben", href: "/aufgaben", icon: Clock, value: 0,
    ampel: (v) => (v > 5 ? "rot" : v > 0 ? "gelb" : "gruen"), hint: (v) => `${v} überfällig` },
  { key: "heutigeRueckrufe", label: "Rückrufe heute", href: "/vorgaenge", icon: Phone, value: 0,
    ampel: (v) => (v > 10 ? "gelb" : "gruen"), hint: (v) => `${v} geplant` },
  { key: "heutigeTermine", label: "Termine heute", href: "/kalender", icon: Calendar, value: 0,
    ampel: () => "neutral", hint: (v) => `${v} im Kalender` },
  { key: "vorgaengeOhneVerantwortliche", label: "Ohne Verantwortliche", href: "/vorgaenge", icon: UserX, value: 0,
    ampel: (v) => (v > 5 ? "rot" : v > 0 ? "gelb" : "gruen"), hint: (v) => `${v} nicht zugewiesen` },
  { key: "offeneZuordnungen", label: "Offene Zuordnungen", href: "/eingang", icon: Link2, value: 0,
    ampel: (v) => (v > 10 ? "gelb" : "gruen"), hint: (v) => `${v} ohne Patient` },
  { key: "integrationsstoerungen", label: "Integrationsstörungen", href: "/einstellungen", icon: ServerCrash, value: 0,
    ampel: (v) => (v > 0 ? "rot" : "gruen"), hint: (v) => (v > 0 ? `${v} Adapter mit Fehler` : "Alle Adapter aktiv") },
  { key: "meineAufgaben", label: "Meine Aufgaben", href: "/aufgaben", icon: ListChecks, value: 0,
    ampel: () => "neutral", hint: (v) => `${v} offen` },
  { key: "offeneFreigaben", label: "Offene Freigaben", href: "/vorgaenge", icon: CheckSquare, value: 0,
    ampel: (v) => (v > 5 ? "gelb" : "gruen"), hint: (v) => `${v} zu prüfen` },
];

export default function DashboardPage() {
  const { data, isLoading } = trpc.dashboard.overview.useQuery();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Übersicht</h1>
      <p className="mb-6 text-sm text-slate-500">
        Tageskennzahlen der Praxis. Farben werden stets mit Icon und Text kombiniert.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CONFIG.map((kpi) => {
          const v = data ? data[kpi.key] : 0;
          const Icon = kpi.icon;
          return (
            <Link key={kpi.key} href={kpi.href} className="card p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="text-sm font-medium">{kpi.label}</span>
                </div>
                <StatusBadge ampel={kpi.ampel(v)} label={kpi.ampel(v) === "rot" ? "Kritisch" : kpi.ampel(v) === "gelb" ? "Achtung" : kpi.ampel(v) === "gruen" ? "OK" : "—"} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-800">{isLoading ? "…" : v}</p>
              <p className="mt-1 text-xs text-slate-400">{kpi.hint(v)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
