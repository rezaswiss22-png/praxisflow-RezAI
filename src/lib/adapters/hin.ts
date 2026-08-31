import { z } from "zod";
import { BaseMockAdapter, type AdapterResult } from "./base";

/**
 * [MOCK] HIN / BlueConnect E-Mail-Adapter (sichere ärztliche E-Mail).
 * Simuliert verschlüsselte ärztliche E-Mails inkl. Anhänge.
 * KEIN echter HIN-Zugriff.
 */
const inputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  attachments: z.array(z.object({ filename: z.string(), mimeType: z.string() })).default([]),
  receivedAt: z.coerce.date(),
});
const outputSchema = z.object({
  channel: z.literal("HIN_EMAIL"),
  senderName: z.string(),
  senderContact: z.string(),
  subject: z.string(),
  body: z.string(),
  attachmentCount: z.number(),
  receivedAt: z.date(),
});
type In = z.infer<typeof inputSchema>;
type Out = z.infer<typeof outputSchema>;

export class HinAdapter extends BaseMockAdapter<In, Out> {
  name = "HIN / BlueConnect (E-Mail)";
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
        channel: "HIN_EMAIL",
        senderName: p.from,
        senderContact: p.from,
        subject: `[MOCK] ${p.subject}`,
        body: p.body,
        attachmentCount: p.attachments.length,
        receivedAt: p.receivedAt,
      },
    };
  }
}
export const hinAdapter = new HinAdapter();
