import { z } from "zod";
import { BaseMockAdapter, type AdapterResult } from "./base";

/**
 * [MOCK] Standard-E-Mail-Adapter.
 * Simuliert normale (unverschlüsselte) E-Mails. KEIN echtes Postfach.
 */
const inputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.coerce.date(),
});
const outputSchema = z.object({
  channel: z.literal("EMAIL"),
  senderName: z.string(),
  senderContact: z.string(),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.date(),
});
type In = z.infer<typeof inputSchema>;
type Out = z.infer<typeof outputSchema>;

export class EmailAdapter extends BaseMockAdapter<In, Out> {
  name = "E-Mail (Standard)";
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
        channel: "EMAIL",
        senderName: p.from,
        senderContact: p.from,
        subject: `[MOCK] ${p.subject}`,
        body: p.body,
        receivedAt: p.receivedAt,
      },
    };
  }
}
export const emailAdapter = new EmailAdapter();
