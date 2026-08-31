import { suggestion, type AiSuggestion } from "./types";
import { similarity } from "./levenshtein";

export interface PatientKandidat {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum?: Date | null;
}

export interface MatchInput {
  vorname?: string | null;
  nachname?: string | null;
  geburtsdatum?: Date | null;
  freitext?: string | null;
}

export interface MatchErgebnis {
  patientId: string | null;
  /** Alle Kandidaten mit Score (absteigend). */
  kandidaten: { patientId: string; score: number; name: string }[];
  /** true, wenn mehrere Kandidaten ähnlich stark sind (Mensch muss entscheiden). */
  mehrdeutig: boolean;
}

/**
 * Unscharfer Patientenabgleich (regelbasiert, Levenshtein + Geburtsdatum).
 * Gibt bei Mehrdeutigkeit KEINE automatische Zuordnung, sondern markiert
 * `mehrdeutig=true` – die Entscheidung trifft ein Mensch.
 */
export function matchPatient(
  input: MatchInput,
  kandidaten: PatientKandidat[],
): AiSuggestion<MatchErgebnis> {
  const vorname = (input.vorname ?? "").trim();
  const nachname = (input.nachname ?? "").trim();
  const freitext = (input.freitext ?? "").trim();

  const scored = kandidaten
    .map((k) => {
      let score = 0;
      const parts: string[] = [];
      if (nachname) {
        const s = similarity(nachname, k.nachname);
        score += s * 0.5;
        parts.push(`Nachname ${(s * 100).toFixed(0)}%`);
      }
      if (vorname) {
        const s = similarity(vorname, k.vorname);
        score += s * 0.3;
        parts.push(`Vorname ${(s * 100).toFixed(0)}%`);
      }
      if (freitext) {
        const full = `${k.vorname} ${k.nachname}`;
        const s = similarity(freitext, full);
        score = Math.max(score, s * 0.7);
      }
      if (input.geburtsdatum && k.geburtsdatum) {
        const gleich =
          new Date(input.geburtsdatum).toISOString().slice(0, 10) ===
          new Date(k.geburtsdatum).toISOString().slice(0, 10);
        if (gleich) {
          score += 0.2;
          parts.push("Geburtsdatum exakt");
        } else {
          score -= 0.15;
        }
      }
      return {
        patientId: k.id,
        score: Math.max(0, Math.min(1, score)),
        name: `${k.vorname} ${k.nachname}`,
        detail: parts.join(", "),
      };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];

  // Keine Kandidaten
  if (!top || top.score < 0.4) {
    return suggestion<MatchErgebnis>(
      { patientId: null, kandidaten: scored.map(({ patientId, score, name }) => ({ patientId, score, name })), mehrdeutig: false },
      top ? top.score : 0.1,
      "Kein ausreichend ähnlicher Patient gefunden – manuelle Zuordnung erforderlich.",
      ["Levenshtein-Namensabgleich"],
    );
  }

  // Mehrdeutig: zwei Kandidaten sehr nah beieinander
  const mehrdeutig = !!second && top.score - second.score < 0.1 && second.score >= 0.4;
  if (mehrdeutig) {
    return suggestion<MatchErgebnis>(
      { patientId: null, kandidaten: scored.map(({ patientId, score, name }) => ({ patientId, score, name })), mehrdeutig: true },
      0.5,
      `Mehrere ähnliche Patienten (${top.name}, ${second!.name}) – bitte manuell prüfen.`,
      ["Levenshtein-Namensabgleich", "Mehrdeutigkeitsprüfung"],
    );
  }

  return suggestion<MatchErgebnis>(
    { patientId: top.patientId, kandidaten: scored.map(({ patientId, score, name }) => ({ patientId, score, name })), mehrdeutig: false },
    top.score,
    `Eindeutigster Treffer: ${top.name} (${top.detail}).`,
    ["Levenshtein-Namensabgleich"],
  );
}
