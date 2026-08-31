import { cn } from "@/lib/utils";

/** Kennzeichnet Daten/Aktionen, die von einem Mock-Adapter stammen. */
export function MockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700",
        className,
      )}
      title="Synthetische Daten aus einem Mock-Adapter"
    >
      <span aria-hidden>🧪</span> [MOCK]
    </span>
  );
}
