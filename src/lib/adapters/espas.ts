import { z } from "zod";
import { BaseMockAdapter, type AdapterResult } from "./base";

/**
 * [MOCK] ESPAS-Telefonadapter.
 * Simuliert eingehende Telefonanrufe (Anruf-Events).
 * KEIN echter Telefonie-Dienst.
 */
const inputSchema = z.object({
  callerNumber: z.string(),
  callerName: z.string().optional(),
  timestamp: z.coerce.date(),
  durationSec: z.number().int().nonnegative(),
  transcript: z.string().optional(),
});
const outputSchema = z.object({
  channel: z.literal("ESPAS_PHONE"),
  senderName: z.string(),
  senderContact: z.string(),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.date(),
});

type In = z.infer<typeof inputSchema>;
type Out = z.infer<typeof outputSchema>;

export class EspasAdapter extends BaseMockAdapter<In, Out> {
  name = "ESPAS (Telefon)";

  getSchema() {
    return { input: inputSchema, output: outputSchema };
  }

  async ingest(payload: In, idempotencyKey?: string): Promise<AdapterResult<Out>> {
    if (!this.checkIdempotency(idempotencyKey)) {
      return { success: false, error: "Bereits verarbeitet (Idempotenz)", retryable: false };
    }
    const parsed = inputSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Ungültige Nutzlast", retryable: false };
    }
    const p = parsed.data;
    return {
      success: true,
      retryable: false,
      idempotencyKey,
      data: {
        channel: "ESPAS_PHONE",
        senderName: p.callerName ?? "Unbekannter Anrufer",
        senderContact: p.callerNumber,
        subject: `[MOCK] Telefonanruf (${p.durationSec}s)`,
        body: p.transcript ?? "Rückrufbitte – keine Transkription verfügbar (Mock).",
        receivedAt: p.timestamp,
      },
    };
  }
}

export const espasAdapter = new EspasAdapter();
