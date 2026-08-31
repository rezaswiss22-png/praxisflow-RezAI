import { suggestion, type AiSuggestion } from "./types";
import { similarity } from "./levenshtein";

export interface EingangRef {
  id: string;
  senderName?: string | null;
  subject?: string | null;
  body?: string | null;
  receivedAt: Date;
}

/**
 * Regelbasierte Dublettenerkennung.
 * Vergleicht Absender + Betreff + Textanfang und ein Zeitfenster (72h).
 */
export function detectDuplicates(
  neu: EingangRef,
  bestehende: EingangRef[],
): AiSuggestion<string[]> {
  const dubletten: { id: string; score: number }[] = [];
  const neuText = `${neu.subject ?? ""} ${(neu.body ?? "").slice(0, 120)}`;

  for (const e of bestehende) {
    if (e.id === neu.id) continue;
    const stundenDiff = Math.abs(neu.receivedAt.getTime() - e.receivedAt.getTime()) / 3_600_000;
    if (stundenDiff > 72) continue;

    let score = 0;
    if (neu.senderName && e.senderName) {
      score += similarity(neu.senderName, e.senderName) * 0.4;
    }
    const eText = `${e.subject ?? ""} ${(e.body ?? "").slice(0, 120)}`;
    score += similarity(neuText, eText) * 0.6;

    if (score >= 0.8) {
      dubletten.push({ id: e.id, score });
    }
  }

  dubletten.sort((a, b) => b.score - a.score);
  const ids = dubletten.map((d) => d.id);

  if (ids.length === 0) {
    return suggestion<string[]>([], 0.7, "Keine wahrscheinlichen Dubletten im 72-Stunden-Fenster gefunden.", ["Absender-/Text-Ähnlichkeit", "Zeitfenster 72h"]);
  }

  return suggestion<string[]>(
    ids,
    Math.min(0.95, dubletten[0].score),
    `${ids.length} mögliche Dublette(n) anhand ähnlicher Absender/Betreff im 72-Stunden-Fenster.`,
    ["Absender-/Text-Ähnlichkeit", "Zeitfenster 72h"],
  );
}
