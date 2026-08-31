import { z } from "zod";
import { BaseMockAdapter, mockLatency, type AdapterResult } from "./base";

/**
 * [MOCK] Kalender-Adapter (ICS Import/Export).
 * Simuliert Import und Export von Terminen im iCalendar-Format.
 * Erzeugt/liest ausschliesslich synthetische Termine.
 */

const importSchema = z.object({
  ics: z.string().min(1),
});
const eventSchema = z.object({
  uid: z.string(),
  title: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  location: z.string().optional(),
});

type ImportIn = z.infer<typeof importSchema>;
type CalEvent = z.infer<typeof eventSchema>;

/** Minimaler, toleranter ICS-Parser (nur für synthetische Mock-Daten). */
function parseIcs(ics: string): CalEvent[] {
  const events: CalEvent[] = [];
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`${key}[:;][^\\r\\n]*:?([^\\r\\n]*)`));
      const line = block.split(/\r?\n/).find((l) => l.startsWith(key));
      if (line) return line.substring(line.indexOf(":") + 1).trim();
      return m?.[1]?.trim() ?? "";
    };
    const toDate = (v: string) => {
      // Format: 20260115T090000 oder 20260115
      const y = v.substring(0, 4), mo = v.substring(4, 6), d = v.substring(6, 8);
      const h = v.substring(9, 11) || "00", mi = v.substring(11, 13) || "00";
      return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
    };
    const uid = get("UID") || `mock-${Math.random().toString(36).slice(2)}`;
    const title = get("SUMMARY") || "[MOCK] Termin";
    const dtstart = get("DTSTART");
    const dtend = get("DTEND");
    if (!dtstart) continue;
    events.push({
      uid,
      title,
      start: toDate(dtstart),
      end: dtend ? toDate(dtend) : toDate(dtstart),
      location: get("LOCATION") || undefined,
    });
  }
  return events;
}

/** Baut ICS-Text aus synthetischen Terminen. */
export function buildIcs(events: CalEvent[]): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PraxisFlow//Pilot//DE"];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `SUMMARY:${e.title}`,
      `DTSTART:${fmt(e.start)}`,
      `DTEND:${fmt(e.end)}`,
      ...(e.location ? [`LOCATION:${e.location}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export class KalenderAdapter extends BaseMockAdapter<ImportIn, CalEvent[]> {
  name = "Kalender (ICS Import/Export)";

  getSchema() {
    return { input: importSchema, output: z.array(eventSchema) };
  }

  /** Importiert Termine aus ICS-Text (synthetisch). */
  async ingest(payload: ImportIn, idempotencyKey?: string): Promise<AdapterResult<CalEvent[]>> {
    if (!this.checkIdempotency(idempotencyKey)) {
      return { success: false, error: "Bereits verarbeitet (Idempotenz)", retryable: false };
    }
    const parsed = importSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Ungültige ICS-Daten", retryable: false };
    }
    await new Promise((r) => setTimeout(r, mockLatency()));
    const events = parseIcs(parsed.data.ics);
    return { success: true, retryable: false, idempotencyKey, data: events };
  }

  /** Exportiert synthetische Termine als ICS-Text. */
  async exportEvents(events: CalEvent[]): Promise<AdapterResult<string>> {
    await new Promise((r) => setTimeout(r, mockLatency()));
    return { success: true, retryable: false, data: buildIcs(events) };
  }
}

export const kalenderAdapter = new KalenderAdapter();
