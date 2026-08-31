import { z } from "zod";
import { BaseMockAdapter, type AdapterResult } from "./base";

/**
 * [MOCK] Labor-Adapter (Laborbefunde als PDF).
 * Deckt UC-1000 (Laborbefund-Eingang) und UC-1100 (Zuordnung)
 * ab. Erzeugt ausschliesslich synthetische Befunde und PDF-Referenzen.
 */

const inputSchema = z.object({
  patientName: z.string(),
  patientDob: z.coerce.date().optional(),
  labName: z.string().default("Zentrallabor Basel (Mock)"),
  orderId: z.string(),
  reportDate: z.coerce.date(),
  pdfFileName: z.string().default("laborbefund.pdf"),
  results: z
    .array(
      z.object({
        analyte: z.string(),
        value: z.string(),
        unit: z.string().optional(),
        referenceRange: z.string().optional(),
        flag: z.enum(["normal", "hoch", "niedrig", "kritisch"]).default("normal"),
      }),
    )
    .default([]),
});
const outputSchema = z.object({
  channel: z.literal("LABOR"),
  senderName: z.string(),
  senderContact: z.string(),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.date(),
  hasCriticalValue: z.boolean(),
  attachmentName: z.string(),
});

type In = z.infer<typeof inputSchema>;
type Out = z.infer<typeof outputSchema>;

export class LaborAdapter extends BaseMockAdapter<In, Out> {
  name = "Labor (Befunde/PDF)";

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
    const hasCritical = p.results.some((r) => r.flag === "kritisch");
    const abnormal = p.results.filter((r) => r.flag !== "normal");
    const summary =
      abnormal.length > 0
        ? `Auffällige Werte: ${abnormal.map((r) => `${r.analyte} ${r.value}${r.unit ?? ""} (${r.flag})`).join(", ")}`
        : "Alle Werte im Normbereich.";
    return {
      success: true,
      retryable: false,
      idempotencyKey,
      data: {
        channel: "LABOR",
        senderName: p.labName,
        senderContact: `Auftrag ${p.orderId}`,
        subject: `[MOCK] Laborbefund ${p.patientName}${hasCritical ? " – KRITISCH" : ""}`,
        body: `Laborbefund für ${p.patientName} vom Labor ${p.labName}. ${summary}`,
        receivedAt: p.reportDate,
        hasCriticalValue: hasCritical,
        attachmentName: p.pdfFileName,
      },
    };
  }
}

export const laborAdapter = new LaborAdapter();
