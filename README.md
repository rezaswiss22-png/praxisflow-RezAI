# PraxisFlow AI

> ⚠️ **PILOT v1 – Ausschliesslich synthetische Testdaten. Keine echten Patienten- oder Praxisdaten.**  
> ⚠️ **Alle externen Integrationen sind Mock-Adapter. Kein echter Datenaustausch.**

**PraxisFlow AI** ist die zentrale digitale Rezeption und intelligente Verarbeitungsschicht der Praxisklinik Binningen AG. Es ist kein EHR-Ersatz, sondern eine strukturierte Eingangs- und Vorgangsverarbeitungsplattform.

---

## Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Lokale Installation (Docker)](#lokale-installation-docker)
- [Lokale Installation (ohne Docker)](#lokale-installation-ohne-docker)
- [Testdaten laden](#testdaten-laden)
- [Testkonten](#testkonten)
- [Projektstruktur](#projektstruktur)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Tests](#tests)
- [Architektur](#architektur)
- [Sicherheit](#sicherheit)
- [Roadmap](#roadmap)

---

## Voraussetzungen

| Software | Version |
|---|---|
| Node.js | ≥ 20 LTS |
| npm | ≥ 10 |
| Docker | ≥ 24 (optional, empfohlen) |
| Docker Compose | ≥ 2.20 (optional) |
| PostgreSQL | ≥ 16 (wenn ohne Docker) |

---

## Lokale Installation (Docker) – Empfohlen

```bash
# 1. Repository klonen
git clone https://github.com/rezaswiss22-png/praxisflow-RezAI.git
cd praxisflow-RezAI

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# .env.local mit sicheren Werten befüllen (siehe Abschnitt Umgebungsvariablen)

# 3. Container starten (Datenbank + App)
docker compose up -d

# 4. Datenbankmigrationen ausführen
docker compose exec app npx prisma migrate deploy

# 5. Synthetische Testdaten laden
docker compose exec app npm run db:seed

# 6. App öffnen
open http://localhost:3000
```

---

## Lokale Installation (ohne Docker)

```bash
# 1. Repository klonen
git clone https://github.com/rezaswiss22-png/praxisflow-RezAI.git
cd praxisflow-RezAI

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local

# 4. PostgreSQL starten und DATABASE_URL in .env.local setzen

# 5. Datenbankmigrationen ausführen
npx prisma migrate dev

# 6. Prisma Client generieren
npx prisma generate

# 7. Synthetische Testdaten laden
npm run db:seed

# 8. Entwicklungsserver starten
npm run dev

# 9. App öffnen
open http://localhost:3000
```

---

## Testdaten laden

```bash
# Alle synthetischen Testdaten laden (30 Patienten, 50 Eingänge, alle Rollen)
npm run db:seed

# Datenbank zurücksetzen und neu befüllen
npm run db:reset

# Nur Benutzer und Rollen erstellen
npm run db:seed:users
```

---

## Testkonten (Pilot – synthetische Daten)

| Rolle | E-Mail | Passwort | Beschreibung |
|---|---|---|---|
| Arzt | dr.mustermann@pilot.local | Pilot2026! | Dr. Max Mustermann |
| MPA | mpa.muster@pilot.local | Pilot2026! | Muster MPA |
| Praxisleitung | leitung@pilot.local | Pilot2026! | Praxisleitung |
| Personal | personal@pilot.local | Pilot2026! | Weiteres Personal |
| Sysadmin | admin@pilot.local | Pilot2026! | Systemadministrator |

> ⚠️ Diese Konten existieren **nur in der Pilotumgebung** mit synthetischen Daten.

---

## Projektstruktur

```
praxisflow-RezAI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Session
│   │   ├── (app)/              # Geschützte Bereiche
│   │   └── api/                # API-Routen
│   ├── server/                 # Server-only Code
│   │   ├── auth/               # Session & RBAC
│   │   ├── db/                 # Prisma Client
│   │   ├── services/           # Geschäftslogik
│   │   ├── adapters/           # [MOCK] Integrationsadapter
│   │   └── ai/                 # KI-Assistenz (regelbasiert)
│   ├── components/             # React-Komponenten
│   └── lib/                    # Geteilte Utilities
├── prisma/
│   ├── schema.prisma           # Datenmodell
│   ├── migrations/             # Versionierte Migrationen
│   └── seed.ts                 # Synthetische Testdaten
├── docs/
│   ├── adr/                    # Architekturentscheidungen
│   ├── architecture/           # Systemarchitektur
│   ├── data-model/             # Datenmodell
│   └── security/               # Sicherheitskonzept
├── tests/
│   ├── unit/                   # Vitest Unit-Tests
│   ├── integration/            # Vitest Integrations-Tests
│   └── e2e/                    # Playwright E2E-Tests
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

---

## Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` und fülle alle Werte aus:

```bash
cp .env.example .env.local
```

Alle verfügbaren Variablen sind in `.env.example` beschrieben. **Niemals `.env.local` committen!**

---

## Tests

```bash
# Unit-Tests
npm run test:unit

# Integrationstests
npm run test:integration

# E2E-Tests (Playwright)
npm run test:e2e

# Alle Tests
npm run test

# Testabdeckung
npm run test:coverage
```

---

## Architektur

Siehe [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)

## Rollen & Rechte

Siehe [`docs/architecture/ROLES_AND_PERMISSIONS.md`](docs/architecture/ROLES_AND_PERMISSIONS.md)

## Datenmodell

Siehe [`docs/data-model/DATA_MODEL.md`](docs/data-model/DATA_MODEL.md)

## Sicherheit

Siehe [`docs/security/SECURITY_CONCEPT.md`](docs/security/SECURITY_CONCEPT.md)

## Architekturentscheidungen (ADR)

- [ADR-001](docs/adr/ADR-001-nextjs-app-router.md): Next.js mit App Router
- [ADR-002](docs/adr/ADR-002-postgresql-prisma.md): PostgreSQL mit Prisma ORM
- [ADR-003](docs/adr/ADR-003-authjs-sessions.md): Auth.js mit datenbankgestützten Sessions
- [ADR-004](docs/adr/ADR-004-mock-adapters.md): Mock-Adapter für externe Integrationen
- [ADR-005](docs/adr/ADR-005-ai-assistance.md): KI-Assistenz (regelbasiert im Pilot)

---

## Roadmap

| Phase | Inhalt | Status |
|---|---|---|
| Phase 1 | Architektur, Datenmodell, Dokumentation | ✅ Abgeschlossen |
| Phase 2 | Kern-App, Pilot-Workflows, Testdaten | 🔒 Wartet auf Freigabe |
| Phase 3 | Tests, Sicherheits-Audit | 🔒 Wartet auf Phase 2 |
| Phase 4 | Pilot-Review, Abnahme | 🔒 Wartet auf Phase 3 |
| Phase 5 | Produktionsvorbereitung, echte Integrationen | 🔒 Nach Echtbetrieb-Freigabe |

---

## Lizenz

Proprietär – Praxisklinik Binningen AG. Nicht öffentlich zugänglich.

---

## Kontakt

Technische Fragen: Architektur-Team PraxisFlow AI
