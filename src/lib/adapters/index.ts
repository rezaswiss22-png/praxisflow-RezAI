import { espasAdapter } from "./espas";
import { onedocAdapter } from "./onedoc";
import { hinAdapter } from "./hin";
import { emailAdapter } from "./email";
import { rockethealthAdapter } from "./rockethealth";
import { kalenderAdapter } from "./kalender";
import { laborAdapter } from "./labor";
import type { HealthCheckResult } from "./base";

/**
 * ============================================================
 * ADAPTER-REGISTRY
 * ============================================================
 * Zentrale Registrierung aller (Mock-)Integrationsadapter.
 * Der `key` entspricht dem Wert in IntegrationAdapter.key (DB).
 * Alle Adapter sind im Pilot MOCK (isMock=true, Sandbox).
 * ============================================================
 */

export interface RegisteredAdapter {
  key: string;
  name: string;
  isMock: boolean;
  /** Ob der Adapter nur lesend arbeitet (z. B. Rockethealth). */
  readOnly: boolean;
  healthCheck(): Promise<HealthCheckResult>;
}

export const ADAPTERS: Record<string, RegisteredAdapter> = {
  ESPAS: { key: "ESPAS", name: espasAdapter.name, isMock: true, readOnly: false, healthCheck: () => espasAdapter.healthCheck() },
  ONEDOC: { key: "ONEDOC", name: onedocAdapter.name, isMock: true, readOnly: false, healthCheck: () => onedocAdapter.healthCheck() },
  HIN: { key: "HIN", name: hinAdapter.name, isMock: true, readOnly: false, healthCheck: () => hinAdapter.healthCheck() },
  EMAIL: { key: "EMAIL", name: emailAdapter.name, isMock: true, readOnly: false, healthCheck: () => emailAdapter.healthCheck() },
  ROCKETHEALTH: { key: "ROCKETHEALTH", name: rockethealthAdapter.name, isMock: true, readOnly: true, healthCheck: () => rockethealthAdapter.healthCheck() },
  KALENDER: { key: "KALENDER", name: kalenderAdapter.name, isMock: true, readOnly: false, healthCheck: () => kalenderAdapter.healthCheck() },
  LABOR: { key: "LABOR", name: laborAdapter.name, isMock: true, readOnly: false, healthCheck: () => laborAdapter.healthCheck() },
};

export function listAdapters(): RegisteredAdapter[] {
  return Object.values(ADAPTERS);
}

export function getAdapter(key: string): RegisteredAdapter | undefined {
  return ADAPTERS[key];
}

export {
  espasAdapter,
  onedocAdapter,
  hinAdapter,
  emailAdapter,
  rockethealthAdapter,
  kalenderAdapter,
  laborAdapter,
};
