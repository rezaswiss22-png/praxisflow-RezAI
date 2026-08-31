import type { ZodSchema } from "zod";

/**
 * ============================================================
 * MOCK-ADAPTER-BASIS
 * ============================================================
 * Alle externen Integrationen (ESPAS, OneDoc, HIN, E-Mail,
 * Rockethealth, Kalender, Labor) sind im Pilot MOCK-Adapter.
 * Sie erzeugen ausschliesslich synthetische Daten und rufen
 * KEINE echten externen Dienste auf.
 *
 * Gemeinsame Merkmale (siehe ADR-004):
 *  - Fehlerbehandlung + Retry-Logik (3 Versuche, exp. Backoff)
 *  - Idempotency-Key
 *  - Health-Check
 *  - Sandbox/Production-Flag (im Pilot immer sandbox=true)
 * ============================================================
 */

export interface AdapterConfig {
  name: string;
  isMock: boolean;
  sandbox: boolean;
}

export interface AdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryable: boolean;
  idempotencyKey?: string;
}

export interface HealthCheckResult {
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
}

export interface Adapter<TIn, TOut> {
  name: string;
  isMock: boolean;
  ingest(payload: TIn, idempotencyKey?: string): Promise<AdapterResult<TOut>>;
  healthCheck(): Promise<HealthCheckResult>;
  getSchema(): { input: ZodSchema; output: ZodSchema };
}

/** Deterministischer Zufall im Mock (leichte, latenzarme Simulation). */
export function mockLatency(min = 20, max = 120): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retry-Wrapper mit exponentiellem Backoff (max. 3 Versuche).
 * Für Mock-Adapter, um produktionsnahe Fehlerbehandlung abzubilden.
 */
export async function withRetry<T>(
  fn: () => Promise<AdapterResult<T>>,
  maxAttempts = 3,
): Promise<AdapterResult<T>> {
  let lastResult: AdapterResult<T> | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await fn();
    if (lastResult.success || !lastResult.retryable) {
      return lastResult;
    }
    // Exponentielles Backoff: 100ms, 200ms, 400ms ...
    const delay = 100 * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, delay));
  }
  return lastResult!;
}

/** Basis-Klasse mit gemeinsamer Idempotenz-/Health-Logik. */
export abstract class BaseMockAdapter<TIn, TOut> implements Adapter<TIn, TOut> {
  abstract name: string;
  isMock = true;
  sandbox = true;
  protected seen = new Set<string>();

  abstract ingest(payload: TIn, idempotencyKey?: string): Promise<AdapterResult<TOut>>;
  abstract getSchema(): { input: ZodSchema; output: ZodSchema };

  /** Prüft/registriert Idempotency-Key (verhindert Doppelverarbeitung). */
  protected checkIdempotency(key?: string): boolean {
    if (!key) return true; // ohne Key immer verarbeiten
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const latencyMs = mockLatency();
    await new Promise((r) => setTimeout(r, latencyMs));
    return { status: "ok", latencyMs, message: `[MOCK] ${this.name} erreichbar (Sandbox)` };
  }
}
