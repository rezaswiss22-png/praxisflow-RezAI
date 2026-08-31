import { z } from "zod";
import { BaseMockAdapter, mockLatency, type AdapterResult, type HealthCheckResult } from "./base";

/**
 * [MOCK] Rockethealth-Praxissoftware-Adapter (NUR-LESEND).
 * Simuliert die Patientenstammdaten-Suche und den Export aus der
 * bestehenden Praxissoftware. Es werden AUSSCHLIESSLICH synthetische
 * Datensätze zurückgegeben. Schreibzugriffe sind im Pilot NICHT erlaubt.
 */

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(50).default(10),
});
const patientRecordSchema = z.object({
  externalId: z.string(),
  vorname: z.string(),
  nachname: z.string(),
  geburtsdatum: z.coerce.date(),
  ahvNummer: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
});

type SearchIn = z.infer<typeof searchSchema>;
type PatientRecord = z.infer<typeof patientRecordSchema>;

/** Synthetische Beispiel-Stammdaten (nur für Mock-Suche). */
const SYNTHETIC_RECORDS: PatientRecord[] = [
  { externalId: "RH-1001", vorname: "Anna", nachname: "Meier", geburtsdatum: new Date("1972-04-12"), ahvNummer: "756.1234.5678.90", plz: "4102", ort: "Binningen" },
  { externalId: "RH-1002", vorname: "Peter", nachname: "Schmid", geburtsdatum: new Date("1958-11-03"), ahvNummer: "756.9876.5432.10", plz: "4053", ort: "Basel" },
  { externalId: "RH-1003", vorname: "Laura", nachname: "Weber", geburtsdatum: new Date("1990-07-21"), ahvNummer: "756.2233.4455.66", plz: "4106", ort: "Therwil" },
];

export class RockethealthAdapter extends BaseMockAdapter<SearchIn, PatientRecord[]> {
  name = "Rockethealth (Praxissoftware, nur-lesend)";

  getSchema() {
    return { input: searchSchema, output: z.array(patientRecordSchema) };
  }

  /** NUR-LESEND: liefert synthetische Treffer zur Suchanfrage. */
  async ingest(payload: SearchIn, idempotencyKey?: string): Promise<AdapterResult<PatientRecord[]>> {
    const parsed = searchSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Ungültige Suchanfrage", retryable: false };
    }
    await new Promise((r) => setTimeout(r, mockLatency()));
    const q = parsed.data.query.toLowerCase();
    const hits = SYNTHETIC_RECORDS.filter(
      (r) =>
        r.nachname.toLowerCase().includes(q) ||
        r.vorname.toLowerCase().includes(q) ||
        r.externalId.toLowerCase().includes(q),
    ).slice(0, parsed.data.limit);
    return { success: true, retryable: false, idempotencyKey, data: hits };
  }

  /** Export eines einzelnen synthetischen Datensatzes (nur-lesend). */
  async exportPatient(externalId: string): Promise<AdapterResult<PatientRecord>> {
    await new Promise((r) => setTimeout(r, mockLatency()));
    const rec = SYNTHETIC_RECORDS.find((r) => r.externalId === externalId);
    if (!rec) {
      return { success: false, error: "Kein synthetischer Datensatz gefunden", retryable: false };
    }
    return { success: true, retryable: false, data: rec };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const latencyMs = mockLatency();
    await new Promise((r) => setTimeout(r, latencyMs));
    return { status: "ok", latencyMs, message: `[MOCK] ${this.name} erreichbar (nur-lesend, Sandbox)` };
  }
}

export const rockethealthAdapter = new RockethealthAdapter();
