import { suggestion, type AiSuggestion } from "./types";

/**
 * Regelbasierte Kategorisierung eines Eingangs anhand von Schlüsselwörtern
 * in Betreff/Text und (optional) Kanal.
 */
export type Kategorie =
  | "Rezeptanfrage"
  | "Terminanfrage"
  | "Laborbefund"
  | "Überweisung"
  | "Rückrufbitte"
  | "Administratives"
  | "Notfall"
  | "Sonstiges";

const REGELN: { kategorie: Kategorie; keywords: string[]; weight: number }[] = [
  { kategorie: "Notfall", keywords: ["notfall", "dringend", "akut", "sofort", "starke schmerzen", "atemnot"], weight: 1.0 },
  { kategorie: "Rezeptanfrage", keywords: ["rezept", "medikament", "verordnung", "wiederholung", "dauermedikation"], weight: 0.9 },
  { kategorie: "Terminanfrage", keywords: ["termin", "verschieben", "absagen", "vereinbaren", "buchung", "onedoc"], weight: 0.85 },
  { kategorie: "Laborbefund", keywords: ["labor", "befund", "blutbild", "werte", "analyse"], weight: 0.9 },
  { kategorie: "Überweisung", keywords: ["überweisung", "zuweisung", "facharzt", "spezialist", "hin"], weight: 0.8 },
  { kategorie: "Rückrufbitte", keywords: ["rückruf", "zurückrufen", "anruf", "telefon", "melden"], weight: 0.75 },
  { kategorie: "Administratives", keywords: ["rechnung", "adresse", "versicherung", "formular", "bescheinigung"], weight: 0.7 },
];

export function categorize(input: {
  subject?: string | null;
  body?: string | null;
  channel?: string | null;
}): AiSuggestion<Kategorie> {
  const text = `${input.subject ?? ""} ${input.body ?? ""}`.toLowerCase();
  let best: { kategorie: Kategorie; score: number; hits: string[] } | null = null;

  for (const regel of REGELN) {
    const hits = regel.keywords.filter((k) => text.includes(k));
    if (hits.length > 0) {
      const score = regel.weight * Math.min(1, 0.6 + hits.length * 0.2);
      if (!best || score > best.score) {
        best = { kategorie: regel.kategorie, score, hits };
      }
    }
  }

  // Kanalbasierter Fallback
  if (!best && input.channel) {
    if (input.channel === "LABOR") return suggestion<Kategorie>("Laborbefund", 0.8, "Kanal 'LABOR' deutet auf einen Laborbefund hin.", ["Kanal: LABOR"]);
    if (input.channel === "ESPAS_PHONE") return suggestion<Kategorie>("Rückrufbitte", 0.6, "Telefonkanal (ESPAS) deutet häufig auf eine Rückrufbitte hin.", ["Kanal: ESPAS_PHONE"]);
    if (input.channel === "ONEDOC_APPOINTMENT") return suggestion<Kategorie>("Terminanfrage", 0.75, "Kanal 'OneDoc' betrifft in der Regel Termine.", ["Kanal: ONEDOC_APPOINTMENT"]);
  }

  if (!best) {
    return suggestion<Kategorie>("Sonstiges", 0.3, "Keine eindeutigen Schlüsselwörter erkannt.", ["Textanalyse"]);
  }

  return suggestion<Kategorie>(
    best.kategorie,
    best.score,
    `Schlüsselwörter erkannt: ${best.hits.join(", ")}.`,
    [`Schlüsselwörter: ${best.hits.join(", ")}`],
  );
}
