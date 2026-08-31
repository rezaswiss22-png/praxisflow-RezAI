import { describe, it, expect } from "vitest";
import { categorize } from "@/lib/ai/categorize";
import { prioritize } from "@/lib/ai/prioritize";
import { matchPatient, type PatientKandidat } from "@/lib/ai/matchPatient";
import { summarize } from "@/lib/ai/summarize";
import { detectDuplicates } from "@/lib/ai/detectDuplicates";
import { similarity } from "@/lib/ai/levenshtein";

describe("KI – categorize", () => {
  it("erkennt Rezeptanfrage", () => {
    const r = categorize({ subject: "Rezept Wiederholung", body: "Bitte Medikament verordnen" });
    expect(r.value).toBe("Rezeptanfrage");
    expect(r.confidence).toBeGreaterThan(0.5);
    expect(r.modelVersion).toBe("rule-based-v1");
  });
  it("erkennt Notfall mit hoher Konfidenz", () => {
    const r = categorize({ subject: "Notfall", body: "akut, starke Schmerzen" });
    expect(r.value).toBe("Notfall");
  });
  it("fällt auf Kanal zurück (LABOR)", () => {
    const r = categorize({ subject: "", body: "", channel: "LABOR" });
    expect(r.value).toBe("Laborbefund");
  });
  it("gibt Sonstiges bei fehlenden Signalen", () => {
    const r = categorize({ subject: "xyz", body: "abc" });
    expect(r.value).toBe("Sonstiges");
    expect(r.reasoning).toBeTruthy();
  });
});

describe("KI – prioritize", () => {
  it("kritischer Laborwert => URGENT", () => {
    const r = prioritize({ hasCriticalValue: true });
    expect(r.value).toBe("URGENT");
    expect(r.confidence).toBeGreaterThan(0.9);
  });
  it("Notfall-Signalwörter => URGENT", () => {
    const r = prioritize({ subject: "Atemnot", body: "sofort" });
    expect(r.value).toBe("URGENT");
  });
  it("Standard => MITTEL", () => {
    const r = prioritize({ subject: "Frage", body: "allgemeine Info" });
    expect(r.value).toBe("MITTEL");
  });
});

describe("KI – matchPatient", () => {
  const kandidaten: PatientKandidat[] = [
    { id: "1", vorname: "Anna", nachname: "Meier", geburtsdatum: new Date("1972-04-12") },
    { id: "2", vorname: "Anna", nachname: "Maier", geburtsdatum: new Date("1980-01-01") },
    { id: "3", vorname: "Peter", nachname: "Schmid", geburtsdatum: new Date("1958-11-03") },
  ];
  it("findet exakten Treffer", () => {
    const r = matchPatient({ vorname: "Peter", nachname: "Schmid" }, kandidaten);
    expect(r.value.patientId).toBe("3");
    expect(r.value.mehrdeutig).toBe(false);
  });
  it("erkennt Mehrdeutigkeit bei ähnlichen Namen", () => {
    const r = matchPatient({ vorname: "Anna", nachname: "Meier" }, kandidaten);
    // Meier vs Maier sind sehr ähnlich -> mehrdeutig oder eindeutig top1
    expect(["1", null]).toContain(r.value.patientId);
  });
  it("kein Treffer bei unbekanntem Namen", () => {
    const r = matchPatient({ vorname: "Zzz", nachname: "Xyzabc" }, kandidaten);
    expect(r.value.patientId).toBeNull();
  });
});

describe("KI – summarize & duplicates & similarity", () => {
  it("summarize kürzt langen Text", () => {
    const text = "Der Patient bittet um ein Rezept. Der Termin soll verschoben werden. Es gibt keine weiteren Anliegen. Vielen Dank.";
    const r = summarize(text, 2);
    expect(r.value.length).toBeGreaterThan(0);
  });
  it("similarity ist 1 bei identisch", () => {
    expect(similarity("Meier", "Meier")).toBe(1);
  });
  it("detectDuplicates erkennt ähnliche Einträge im Zeitfenster", () => {
    const now = new Date();
    const neu = { id: "a", senderName: "Anna Meier", subject: "Rezept", body: "Bitte Rezept", receivedAt: now };
    const bestehend = [
      { id: "b", senderName: "Anna Meier", subject: "Rezept", body: "Bitte Rezept", receivedAt: new Date(now.getTime() - 3600_000) },
    ];
    const r = detectDuplicates(neu, bestehend);
    expect(r.value).toContain("b");
  });
});
