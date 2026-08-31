import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle2, Circle } from "lucide-react";

/**
 * Ampel-Status-Badge.
 * WICHTIG (Barrierefreiheit): Farbe wird NIE allein verwendet – immer
 * zusammen mit Icon UND Text-Label.
 */
export type Ampel = "rot" | "gelb" | "gruen" | "neutral";

const MAP: Record<Ampel, { cls: string; Icon: typeof Circle; defaultLabel: string }> = {
  rot: { cls: "border-red-300 bg-ampel-rotBg text-ampel-rot", Icon: AlertTriangle, defaultLabel: "Kritisch" },
  gelb: { cls: "border-amber-300 bg-ampel-gelbBg text-ampel-gelb", Icon: AlertCircle, defaultLabel: "Achtung" },
  gruen: { cls: "border-green-300 bg-ampel-gruenBg text-ampel-gruen", Icon: CheckCircle2, defaultLabel: "In Ordnung" },
  neutral: { cls: "border-slate-300 bg-slate-50 text-slate-600", Icon: Circle, defaultLabel: "Neutral" },
};

export function StatusBadge({
  ampel,
  label,
  className,
}: {
  ampel: Ampel;
  label?: string;
  className?: string;
}) {
  const { cls, Icon, defaultLabel } = MAP[ampel];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", cls, className)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}

/** Ordnet eine Priorität einer Ampelfarbe zu. */
export function ampelFuerPrioritaet(p: string): Ampel {
  switch (p) {
    case "URGENT":
      return "rot";
    case "HOCH":
      return "gelb";
    case "MITTEL":
      return "gruen";
    case "NIEDRIG":
      return "neutral";
    default:
      return "neutral";
  }
}
