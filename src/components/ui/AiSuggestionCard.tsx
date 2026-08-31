"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatKonfidenz } from "@/lib/utils";
import { Sparkles, Check, Pencil, Info } from "lucide-react";

/**
 * Karte für einen KI-Vorschlag (regelbasiert).
 * Zeigt Vorschlag, Konfidenz (%), Begründung und Quellen.
 * Der/die Nutzer:in kann den Vorschlag ANNEHMEN oder KORRIGIEREN
 * (Vorschläge sind niemals bindend).
 */
export interface AiSuggestionCardProps {
  titel: string;
  vorschlag: string;
  konfidenz: number; // 0..1
  begruendung: string;
  quellen?: string[];
  onAnnehmen?: () => void;
  onKorrigieren?: () => void;
  className?: string;
}

function konfidenzAmpel(k: number): string {
  if (k >= 0.75) return "text-ampel-gruen";
  if (k >= 0.5) return "text-ampel-gelb";
  return "text-ampel-rot";
}

export function AiSuggestionCard({
  titel,
  vorschlag,
  konfidenz,
  begruendung,
  quellen = [],
  onAnnehmen,
  onKorrigieren,
  className,
}: AiSuggestionCardProps) {
  const [details, setDetails] = useState(false);
  return (
    <div className={cn("rounded-xl border border-brand-100 bg-brand-50/50 p-4", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
        <span className="text-sm font-semibold text-brand-700">🤖 KI-Vorschlag</span>
        <span className="ml-auto text-xs text-slate-500">{titel}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-slate-800">{vorschlag}</span>
        <span className={cn("text-sm font-medium", konfidenzAmpel(konfidenz))}>
          {formatKonfidenz(konfidenz)} Konfidenz
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDetails((d) => !d)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
        {details ? "Begründung ausblenden" : "Begründung anzeigen"}
      </button>

      {details && (
        <div className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-600">
          <p>{begruendung}</p>
          {quellen.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">Quellen: {quellen.join(" · ")}</p>
          )}
        </div>
      )}

      {(onAnnehmen || onKorrigieren) && (
        <div className="mt-3 flex gap-2">
          {onAnnehmen && (
            <button type="button" onClick={onAnnehmen} className="btn-primary text-xs">
              <Check className="h-3.5 w-3.5" aria-hidden /> Übernehmen
            </button>
          )}
          {onKorrigieren && (
            <button type="button" onClick={onKorrigieren} className="btn-secondary text-xs">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Korrigieren
            </button>
          )}
        </div>
      )}
    </div>
  );
}
