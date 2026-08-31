import { describe, it, expect } from "vitest";
import { can, hasPermission, permissionsForRole, PERMISSIONS } from "@/lib/permissions";

describe("RBAC – can(role, action, resource)", () => {
  it("ARZT darf Freigaben genehmigen", () => {
    expect(can("ARZT", "approve", "freigabe")).toBe(true);
  });
  it("MPA_EMPFANG darf KEINE Freigaben genehmigen", () => {
    expect(can("MPA_EMPFANG", "approve", "freigabe")).toBe(false);
  });
  it("SYSADMIN darf Audit-Log einsehen", () => {
    expect(can("SYSADMIN", "view", "audit")).toBe(true);
  });
  it("PERSONAL darf KEINE Auswertungen sehen", () => {
    expect(can("PERSONAL", "view", "auswertungen")).toBe(false);
  });
  it("SYSADMIN hat KEINEN Zugriff auf Patientendaten", () => {
    expect(can("SYSADMIN", "view", "patient")).toBe(false);
    expect(can("SYSADMIN", "medical", "patient")).toBe(false);
  });
  it("ARZT darf medizinische Dokumente kontrollieren", () => {
    expect(can("ARZT", "medical", "dokument")).toBe(true);
  });
  it("MPA_EMPFANG darf Patienten anlegen", () => {
    expect(can("MPA_EMPFANG", "create", "patient")).toBe(true);
  });
  it("MPA_EMPFANG darf Patienten NICHT löschen", () => {
    expect(can("MPA_EMPFANG", "delete", "patient")).toBe(false);
  });
  it("PRAXISLEITUNG darf Patienten löschen und exportieren", () => {
    expect(can("PRAXISLEITUNG", "delete", "patient")).toBe(true);
    expect(can("PRAXISLEITUNG", "export", "patient")).toBe(true);
  });
  it("PRAXISLEITUNG darf Benutzer verwalten", () => {
    expect(can("PRAXISLEITUNG", "manage", "user")).toBe(true);
  });
  it("ARZT darf KEINE Benutzer verwalten", () => {
    expect(can("ARZT", "manage", "user")).toBe(false);
  });
  it("SYSADMIN darf System konfigurieren", () => {
    expect(can("SYSADMIN", "config", "system")).toBe(true);
  });
  it("ARZT darf KEIN System konfigurieren", () => {
    expect(can("ARZT", "config", "system")).toBe(false);
  });
  it("ARZT und PRAXISLEITUNG dürfen Auswertungen sehen", () => {
    expect(can("ARZT", "view", "auswertungen")).toBe(true);
    expect(can("PRAXISLEITUNG", "view", "auswertungen")).toBe(true);
  });
  it("ARZT darf Vorgänge abschliessen", () => {
    expect(can("ARZT", "close", "vorgang")).toBe(true);
  });
  it("MPA_EMPFANG darf Vorgänge NICHT abschliessen", () => {
    expect(can("MPA_EMPFANG", "close", "vorgang")).toBe(false);
  });
  it("MPA_EMPFANG darf Vorgänge eskalieren", () => {
    expect(can("MPA_EMPFANG", "escalate", "vorgang")).toBe(true);
  });
  it("PRAXISLEITUNG darf Audit-Log einsehen", () => {
    expect(can("PRAXISLEITUNG", "view", "audit")).toBe(true);
  });
  it("ARZT darf KEIN Audit-Log einsehen", () => {
    expect(can("ARZT", "view", "audit")).toBe(false);
  });
  it("unbekannte Aktion/Ressource ergibt false", () => {
    expect(can("SYSADMIN", "foo", "bar")).toBe(false);
  });
  it("hasPermission funktioniert direkt", () => {
    expect(hasPermission("ARZT", PERMISSIONS.PATIENT_MEDICAL)).toBe(true);
    expect(hasPermission("PERSONAL", PERMISSIONS.PATIENT_READ)).toBe(false);
  });
  it("permissionsForRole liefert nicht-leere Liste für ARZT und PERSONAL", () => {
    expect(permissionsForRole("ARZT").length).toBeGreaterThan(0);
    expect(permissionsForRole("PERSONAL").length).toBeGreaterThan(0);
  });
  it("PERSONAL hat stark eingeschränkte Rechte (nur eigene Aufgaben)", () => {
    expect(can("PERSONAL", "view", "patient")).toBe(false);
    expect(can("PERSONAL", "create", "vorgang")).toBe(false);
  });
});
