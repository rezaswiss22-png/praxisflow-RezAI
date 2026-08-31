import { z } from "zod";
import { BaseMockAdapter, type AdapterResult } from "./base";

/**
 * [MOCK] OneDoc-Terminadapter.
 * Simuliert Terminbuchungen (NEU, GEAENDERT, STORNIERT).
 * KEIN echter OneDoc-Zugriff.
 */
const inputSchema = z.object({
  onedocId: z.string(),
  action: z.enum(["NEU", "GEAENDERT", "STORNIERT"]),
  patientName: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  reason: z.string().optional(),
});
const outputSchema = z.object({
  channel: z.literal("ONEDOC_APPOINTMENT"),
  senderName: z.string(),
  subject: z.string(),
  body: z.string(),
  onedocId: z.string(),
  action: z.string(),
  startAt: z.date(),
  endAt: z.date(),
});
type In = z.infer<typeof inputSchema>;
type Out = z.infer<typeof outputSchema>;

export class OnedocAdapter extends BaseMockAdapter<In, Out> {
  name = "OneDoc (Termine)";
  getSchema() {
    return { input: inputSchema, output: outputSchema };
  }
  async ingest(payload: In, idempotencyKey?: string): Promise<AdapterResult<Out>> {
    if (!this.checkIdempotency(idempotencyKey))
      return { success: false, error: "Bereits verarbeitet (Idempotenz)", retryable: false };
    const parsed = inputSchema.safeParse(payload);
    if (!parsed.success) return { success: false, error: "Ungültige Nutzlast", retryable: false };
    const p = parsed.data;
    return {
      success: true,
      retryable: false,
      idempotencyKey,
      data: {
        channel: "ONEDOC_APPOINTMENT",
        senderName: "OneDoc",
        subject: `[MOCK] Termin ${p.action}: ${p.patientName}`,
        body: p.reason ?? `Termin ${p.action.toLowerCase()} über OneDoc (Mock).`,
        onedocId: p.onedocId,
        action: p.action,
        startAt: p.startAt,
        endAt: p.endAt,
      },
    };
  }
}
export const onedocAdapter = new OnedocAdapter();
