import { suggestion, type AiSuggestion } from "./types";
import type { UserRole } from "@prisma/client";

export interface AssigneeKandidat {
  id: string;
  name: string;
  role: UserRole;
  offeneAufgaben: number;
}

/**
 * Regelbasierter Zuständigkeitsvorschlag.
 * Wählt anhand der Kategorie die passende Rolle und daraus die Person mit
 * der geringsten aktuellen Auslastung.
 */
const KATEGORIE_ROLLE: Record<string, UserRole[]> = {
  Rezeptanfrage: ["ARZT"],
  Laborbefund: ["ARZT"],
  Überweisung: ["ARZT"],
  Notfall: ["ARZT", "MPA_EMPFANG"],
  Terminanfrage: ["MPA_EMPFANG"],
  Rückrufbitte: ["MPA_EMPFANG"],
  Administratives: ["MPA_EMPFANG", "PERSONAL"],
  Sonstiges: ["MPA_EMPFANG"],
};

export function suggestAssignee(
  kategorie: string | null | undefined,
  kandidaten: AssigneeKandidat[],
): AiSuggestion<string | null> {
  const zielRollen = (kategorie && KATEGORIE_ROLLE[kategorie]) || ["MPA_EMPFANG"];
  const passende = kandidaten.filter((k) => zielRollen.includes(k.role));

  if (passende.length === 0) {
    return suggestion<string | null>(null, 0.2, `Keine passende Person für Kategorie '${kategorie ?? "unbekannt"}' gefunden.`, ["Rollen-Mapping"]);
  }

  const gewaehlt = [...passende].sort((a, b) => a.offeneAufgaben - b.offeneAufgaben)[0];
  const conf = passende.length === 1 ? 0.8 : 0.65;
  return suggestion<string | null>(
    gewaehlt.id,
    conf,
    `${gewaehlt.name} (${gewaehlt.role}) hat mit ${gewaehlt.offeneAufgaben} offenen Aufgaben die geringste Auslastung für Kategorie '${kategorie ?? "unbekannt"}'.`,
    ["Rollen-Mapping", "Auslastungsausgleich"],
  );
}
