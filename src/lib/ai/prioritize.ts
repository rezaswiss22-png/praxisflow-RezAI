import { suggestion, type AiSuggestion } from "./types";

/** Priorität entspricht dem Prisma-Enum Priority. */
export type Prioritaet = "URGENT" | "HOCH" | "MITTEL" | "NIEDRIG";

const URGENT_WORDS = ["notfall", "akut", "atemnot", "brustschmerz", "kritisch", "sofort", "bewusstlos"];
const HOCH_WORDS = ["dringend", "starke schmerzen", "fieber", "heute", "schnellstmöglich"];
const NIEDRIG_WORDS = ["information", "gelegentlich", "irgendwann", "kein stress", "danke"];

/**
 * Regelbasierte Priorisierung anhand von Signalwörtern, Kategorie und
 * (optional) kritischem Laborwert.
 */
export function prioritize(input: {
  subject?: string | null;
  body?: string | null;
  kategorie?: string | null;
  hasCriticalValue?: boolean;
}): AiSuggestion<Prioritaet> {
  const text = `${input.subject ?? ""} ${input.body ?? ""}`.toLowerCase();
  const sources: string[] = [];

  if (input.hasCriticalValue) {
    return suggestion<Prioritaet>("URGENT", 0.95, "Kritischer Laborwert erkannt – sofortige Bearbeitung nötig.", ["Kritischer Laborwert"]);
  }

  const urgentHits = URGENT_WORDS.filter((w) => text.includes(w));
  if (urgentHits.length > 0) {
    return suggestion<Prioritaet>("URGENT", 0.9, `Notfall-Signalwörter: ${urgentHits.join(", ")}.`, [`Signalwörter: ${urgentHits.join(", ")}`]);
  }

  const hochHits = HOCH_WORDS.filter((w) => text.includes(w));
  if (hochHits.length > 0) {
    sources.push(`Signalwörter: ${hochHits.join(", ")}`);
    return suggestion<Prioritaet>("HOCH", 0.8, `Dringlichkeits-Signalwörter: ${hochHits.join(", ")}.`, sources);
  }

  if (input.kategorie === "Notfall") {
    return suggestion<Prioritaet>("URGENT", 0.85, "Kategorie 'Notfall' impliziert höchste Priorität.", ["Kategorie: Notfall"]);
  }
  if (input.kategorie === "Laborbefund" || input.kategorie === "Rezeptanfrage") {
    return suggestion<Prioritaet>("HOCH", 0.65, `Kategorie '${input.kategorie}' wird meist zeitnah bearbeitet.`, [`Kategorie: ${input.kategorie}`]);
  }

  const niedrigHits = NIEDRIG_WORDS.filter((w) => text.includes(w));
  if (niedrigHits.length > 0) {
    return suggestion<Prioritaet>("NIEDRIG", 0.6, `Hinweise auf geringe Dringlichkeit: ${niedrigHits.join(", ")}.`, [`Signalwörter: ${niedrigHits.join(", ")}`]);
  }

  return suggestion<Prioritaet>("MITTEL", 0.5, "Keine besonderen Dringlichkeitssignale – Standardpriorität.", ["Standardregel"]);
}
