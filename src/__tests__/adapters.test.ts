import { describe, it, expect } from "vitest";
import { espasAdapter } from "@/lib/adapters/espas";
import { laborAdapter } from "@/lib/adapters/labor";
import { rockethealthAdapter } from "@/lib/adapters/rockethealth";
import { kalenderAdapter, buildIcs } from "@/lib/adapters/kalender";
import { listAdapters, getAdapter, ADAPTERS } from "@/lib/adapters";

describe("Adapter – Registry", () => {
  it("registriert genau 7 Adapter, alle MOCK", () => {
    const all = listAdapters();
    expect(all).toHaveLength(7);
    expect(all.every((a) => a.isMock)).toBe(true);
  });
  it("Rockethealth ist nur-lesend", () => {
    expect(getAdapter("ROCKETHEALTH")?.readOnly).toBe(true);
  });
  it("kennt alle erwarteten Schlüssel", () => {
    ["ESPAS", "ONEDOC", "HIN", "EMAIL", "ROCKETHEALTH", "KALENDER", "LABOR"].forEach((k) => {
      expect(ADAPTERS[k]).toBeDefined();
    });
  });
});

describe("Adapter – healthCheck", () => {
  it("ESPAS healthCheck liefert ok", async () => {
    const r = await espasAdapter.healthCheck();
    expect(r.status).toBe("ok");
    expect(r.message).toContain("[MOCK]");
  });
});

describe("Adapter – ingest & Idempotenz", () => {
  it("ESPAS ingest erzeugt einen Eingang", async () => {
    const r = await espasAdapter.ingest({
      callerNumber: "+41 61 111 22 33",
      timestamp: new Date(),
      durationSec: 60,
    });
    expect(r.success).toBe(true);
    expect(r.data?.channel).toBe("ESPAS_PHONE");
  });
  it("Idempotenz verhindert Doppelverarbeitung", async () => {
    const key = "idem-key-1";
    const payload = { callerNumber: "+41 61 000", timestamp: new Date(), durationSec: 10 };
    const first = await espasAdapter.ingest(payload, key);
    const second = await espasAdapter.ingest(payload, key);
    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
  it("Labor erkennt kritische Werte", async () => {
    const r = await laborAdapter.ingest({
      patientName: "Anna Meier",
      labName: "Zentrallabor",
      orderId: "L-1",
      reportDate: new Date(),
      pdfFileName: "L-1_befund.pdf",
      results: [{ analyte: "Kalium", value: "7.2", unit: "mmol/l", flag: "kritisch" as const }],
    });
    expect(r.success).toBe(true);
    expect(r.data?.hasCriticalValue).toBe(true);
  });
  it("Rockethealth Suche liefert synthetische Treffer (nur-lesend)", async () => {
    const r = await rockethealthAdapter.ingest({ query: "Meier", limit: 5 });
    expect(r.success).toBe(true);
    expect(Array.isArray(r.data)).toBe(true);
  });
});

describe("Adapter – Kalender ICS", () => {
  it("Import und Export sind konsistent", async () => {
    const ics = buildIcs([
      { uid: "u1", title: "Test", start: new Date("2026-01-15T09:00:00Z"), end: new Date("2026-01-15T09:30:00Z") },
    ]);
    const r = await kalenderAdapter.ingest({ ics });
    expect(r.success).toBe(true);
    expect(r.data?.[0]?.uid).toBe("u1");
  });
});
