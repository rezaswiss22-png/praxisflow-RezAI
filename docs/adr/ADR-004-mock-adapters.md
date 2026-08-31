# ADR-004: Mock-Adapter für alle externen Integrationen im Pilot

**Status:** Akzeptiert  
**Datum:** 31.08.2026  
**Entscheider:** Architektur-Team PraxisFlow AI

---

## Kontext

Für alle externen Systeme (Rockethealth, OneDoc, ESPAS, HIN/BlueConnect, E-Mail, Kalender, Labor) fehlen zum Pilotbeginn:
- Offizielle API-Dokumentation
- Vertragliche Freigaben
- Zugangsdaten

Es darf nicht behauptet werden, dass eine echte Integration vorhanden ist.

## Entscheidung

Alle externen Integrationen werden im Pilot als **klar gekennzeichnete Mock-Adapter** implementiert. Der Adapter-Code ist austauschbar (Adapter-Pattern). Jeder Mock ist mit `[MOCK]` in der UI und `// MOCK ADAPTER` im Code markiert.

## Adapter-Schnittstelle

```typescript
interface IntegrationAdapter {
  name: string
  isMock: boolean        // true im Pilot
  mode: 'mock' | 'sandbox' | 'production'

  // Eingehende Ereignisse simulieren
  simulateIncoming(type: string, payload?: unknown): Promise<AdapterEvent>

  // Health Check
  healthCheck(): Promise<HealthCheckResult>

  // Daten senden (Mock: gibt simulierte Antwort zurück)
  send(payload: unknown): Promise<AdapterResponse>
}
```

## Begründung

- **Ehrlichkeit:** Kein Benutzer wird über den Integrationsstatus getäuscht
- **Austauschbarkeit:** Echter Adapter kann Mock ersetzen, ohne Kernlogik zu ändern
- **Testbarkeit:** Mock-Adapter ermöglichen reproduzierbare Integrationstests
- **Sicherheit:** Kein versehentlicher Datenaustausch mit Produktivsystemen

## Produktionspfad

Für jede echte Integration wird ein separater ADR erstellt, sobald API-Dokumentation und Zugangsdaten vorliegen. Der Mock-Adapter bleibt für Tests erhalten.

## Adapter-Übersicht

| System | Mock | Protokoll (geplant) | Status |
|---|---|---|---|
| Rockethealth (KIS) | ✅ | REST/HL7? (unbekannt) | Keine API-Doku |
| OneDoc | ✅ | REST/Webhook | Keine Zugangsdaten |
| ESPAS | ✅ | Proprietär (unbekannt) | Keine API-Doku |
| HIN/BlueConnect | ✅ | E-Mail via HIN | Kein Zertifikat |
| E-Mail (SMTP/IMAP) | ✅ | SMTP/IMAP (Standard) | Kein SMTP-Account |
| Kalender (CalDAV) | ✅ | CalDAV (Standard) | Kein Endpunkt |
| Labor UC-1000/UC-1100 | ✅ | HL7/proprietär? | Kein Protokoll |
