/**
 * ============================================================
 * KI-VORSCHLÄGE (REGELBASIERT)
 * ============================================================
 * Im Pilot sind alle "KI"-Funktionen REGELBASIERT (kein LLM,
 * keine externen Modelle). Jeder Vorschlag ist erklärbar
 * (reasoning), nennt seine Quellen (sources) und eine
 * Konfidenz (0..1). Vorschläge sind IMMER überschreibbar.
 * ============================================================
 */
export interface AiSuggestion<T = string> {
  value: T;
  /** Konfidenz 0..1 */
  confidence: number;
  /** Begründung in Deutsch (erklärbar) */
  reasoning: string;
  /** Herangezogene Merkmale/Quellen */
  sources: string[];
  /** Modellversion – hier stets regelbasiert */
  modelVersion: "rule-based-v1";
}

export function suggestion<T>(
  value: T,
  confidence: number,
  reasoning: string,
  sources: string[],
): AiSuggestion<T> {
  return {
    value,
    confidence: Math.max(0, Math.min(1, confidence)),
    reasoning,
    sources,
    modelVersion: "rule-based-v1",
  };
}
