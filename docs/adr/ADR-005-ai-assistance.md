# ADR-005: KI-Assistenz als regelbasiertes System im Pilot

**Status:** Akzeptiert  
**Datum:** 31.08.2026  
**Entscheider:** Architektur-Team PraxisFlow AI

---

## Kontext

PraxisFlow benötigt KI-Assistenzfunktionen für:
- Kategorie-Vorschlag
- Dringlichkeits-Vorschlag
- Patientenzuordnung
- Nächster Schritt
- Zusammenfassung

Gleichzeitig bestehen im Piloten Einschränkungen:
- Keine produktiven Patientendaten in KI-Prompts
- Keine medizinische Diagnose, keine autonome Triage
- Kein bestätigter externer LLM-API-Vertrag (Datenschutz)

## Entscheidung

Im Pilot v1 werden alle KI-Funktionen als **regelbasiertes System** implementiert (kein externer LLM-Aufruf). Die Schnittstelle ist identisch mit einer späteren LLM-Implementierung; der Austausch ist jederzeit möglich.

## Implementierung

```typescript
// server/ai/classifier.ts
export interface AIResult {
  suggestion: string
  confidence: number        // 0.0 – 1.0
  reasoning: string         // Begründung für Benutzer
  source: string            // Woher kommt die Information
  isAISuggestion: true      // Immer als KI-Vorschlag kennzeichnen
}

// Regelbasierte Implementierung für Pilot:
// - Schlüsselwort-Matching für Kategorie
// - Prioritätsregeln für Dringlichkeit
// - Fuzzy-Matching für Patientenzuordnung (Name, Telefon)
```

## Begründung

- **Datenschutz:** Keine Patientendaten verlassen das System
- **Rechtssicherheit:** Keine Abhängigkeit von externem LLM-Anbieter
- **Testbarkeit:** Regelbasierte Logik ist deterministisch und testbar
- **Erweiterbarkeit:** LLM-Adapter kann später eingehängt werden

## KI-Grundsätze (unveränderlich)

1. Jeder KI-Vorschlag ist als solcher gekennzeichnet
2. Konfidenzwert wird immer angezeigt
3. Menschliche Bestätigung ist für jede Aktion erforderlich
4. Keine medizinische Diagnose oder autonome Triage
5. Bei Unsicherheit (Konfidenz < 0.6): Eskalation an berechtigte Person
6. KI-Entscheide werden vollständig protokolliert (wer bestätigt hat, wann)

## LLM-Produktionspfad (Phase 5)

Vor LLM-Einsatz müssen folgende Punkte geklärt sein:
- [ ] Datenschutzprüfung des LLM-Anbieters (CH/EU-Datenlokalisierung)
- [ ] Auftragsverarbeitungsvertrag
- [ ] Pseudonymisierung aller Prompts
- [ ] Auditierung der LLM-Ausgaben
- [ ] Medizin-rechtliche Einschätzung (Haftung)
