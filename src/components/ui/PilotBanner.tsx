/**
 * Nicht schliessbarer Pilot-Hinweis. Muss auf jeder Seite sichtbar sein.
 * Weist deutlich auf ausschliesslich synthetische Testdaten hin.
 */
export function PilotBanner() {
  return (
    <div
      role="alert"
      className="flex w-full items-center justify-center gap-2 bg-ampel-gelb px-4 py-2 text-center text-sm font-semibold text-white"
    >
      <span aria-hidden>⚠️</span>
      <span>PILOTUMGEBUNG – Ausschliesslich synthetische Testdaten</span>
    </div>
  );
}
