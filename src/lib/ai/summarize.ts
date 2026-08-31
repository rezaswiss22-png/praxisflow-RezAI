import { suggestion, type AiSuggestion } from "./types";

/**
 * Regelbasierte Kurzzusammenfassung (extraktiv).
 * Wählt die relevantesten Sätze anhand von Schlüsselwörtern und Länge –
 * KEINE generative KI.
 */
const SIGNAL = ["rezept", "termin", "labor", "befund", "überweisung", "rückruf", "dringend", "notfall", "schmerz", "medikament", "frage", "bitte"];

export function summarize(text: string, maxSaetze = 2): AiSuggestion<string> {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length === 0) {
    return suggestion("Kein Inhalt vorhanden.", 0.2, "Leerer Text.", ["Textanalyse"]);
  }
  const saetze = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  if (saetze.length <= maxSaetze) {
    return suggestion(clean, 0.6, "Text ist bereits kurz – vollständig übernommen.", ["Textanalyse"]);
  }

  const scored = saetze.map((satz, idx) => {
    const lower = satz.toLowerCase();
    const hits = SIGNAL.filter((w) => lower.includes(w)).length;
    // Frühe Sätze etwas höher gewichten
    const positionBonus = idx === 0 ? 0.5 : 0;
    return { satz, score: hits + positionBonus, idx };
  });

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSaetze)
    .sort((a, b) => a.idx - b.idx)
    .map((s) => s.satz);

  return suggestion(
    top.join(" "),
    0.65,
    `Extraktive Zusammenfassung der ${maxSaetze} relevantesten Sätze (von ${saetze.length}).`,
    ["Extraktive Satzbewertung"],
  );
}
