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

Der einfachste Weg. Datenbank und App laufen in Containern; **Migrationen und
synthetische Seed-Daten werden beim ersten Start automatisch angewendet**
(siehe `docker-entrypoint.sh`, gesteuert über `RUN_SEED=true` in
`docker-compose.yml`).

```bash
# 1. Repository klonen
git clone https://github.com/rezaswiss22-png/praxisflow-RezAI.git
cd praxisflow-RezAI

# 2. Container bauen und starten (Datenbank + App)
#    Beim ersten Start: automatische Migration + Seed
docker compose up --build

# 3. App öffnen
#    http://localhost:3000
```

Optional mit Datenbank-Admin-UI (Adminer auf http://localhost:8080):

```bash
docker compose --profile dev-tools up --build
```

> Die in `docker-compose.yml` hinterlegten Werte für `AUTH_SECRET`,
> Datenbankpasswort usw. sind **nur lokale Pilot-Werte** und müssen für einen
> echten Betrieb ersetzt werden. Für den lokalen Pilot ist keine weitere
> Konfiguration nötig – eine `.env`-Datei wird für den Docker-Weg nicht
> benötigt.

---

## Lokale Installation (ohne Docker)

```bash
# 1. Repository klonen
git clone https://github.com/rezaswiss22-png/praxisflow-RezAI.git
cd praxisflow-RezAI

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten: DATABASE_URL, AUTH_SECRET und AUTH_URL setzen
#   AUTH_SECRET erzeugen z. B. mit:  openssl rand -base64 32

# 4. PostgreSQL starten und DATABASE_URL in .env eintragen
#    Beispiel: postgresql://praxisflow:passwort@localhost:5432/praxisflow_dev

# 5. Datenbankmigrationen ausführen (erzeugt Schema + Prisma Client)
npx prisma migrate dev

# 6. Synthetische Testdaten laden
npm run db:seed

# 7. Entwicklungsserver starten
npm run dev

# 8. App öffnen
#    http://localhost:3000
```

---

## Testdaten laden

Das Seed-Skript ist **idempotent** (nutzt `upsert`) und lädt einen vollständigen,
rein synthetischen Datenbestand: Organisation, Standort, 5 Benutzer (alle Rollen),
30 Patienten (inkl. Dubletten), 50 Eingänge, Vorgänge, Aufgaben, Termine,
Rückrufe, Audit-Logs, Kategorien, Kanäle sowie 7 Mock-Adapter.

```bash
# Alle synthetischen Testdaten laden
npm run db:seed

# Schema + Daten komplett zurücksetzen und neu aufbauen
npx prisma migrate reset   # führt danach automatisch den Seed aus
```

---

## Testkonten (Pilot – synthetische Daten)

| Rolle | E-Mail | Passwort |
|---|---|---|
| Arzt (ARZT) | dr.mueller@praxisflow.test | Pilot2026! |
| MPA / Empfang (MPA_EMPFANG) | empfang@praxisflow.test | Pilot2026! |
| Praxisleitung (PRAXISLEITUNG) | leitung@praxisflow.test | Pilot2026! |
| Personal (PERSONAL) | personal@praxisflow.test | Pilot2026! |
| Systemadministration (SYSADMIN) | admin@praxisflow.test | Pilot2026! |

> ⚠️ Diese Konten existieren **nur in der Pilotumgebung** mit synthetischen Daten.

---

## Projektstruktur

```
praxisflow-RezAI/
├── src/
│   ├── app/                    # Next.js App Router (Seiten & API)
│   │   ├── (dashboard)/        # Geschützte Bereiche (Dashboard, Eingang,
│   │   │                       #   Vorgänge, Aufgaben, Patienten, Kalender,
│   │   │                       #   Dokumente, Auswertungen, Einstellungen)
│   │   ├── auth/login/         # Login
│   │   └── api/trpc/           # tRPC API-Route
│   ├── server/                 # Server-only Code
│   │   ├── routers/            # tRPC-Router (pro Domäne)
│   │   ├── trpc.ts             # tRPC-Setup, geschützte Procedures
│   │   ├── context.ts          # Request-Context (Session, Prisma)
│   │   └── audit.ts            # Audit-Logging
│   ├── lib/
│   │   ├── adapters/           # [MOCK] Integrationsadapter (ESPAS, OneDoc,
│   │   │                       #   HIN, E-Mail, RocketHealth, Kalender, Labor)
│   │   ├── ai/                 # KI-Assistenz (regelbasiert, transparent)
│   │   ├── auth/               # Auth.js-Konfiguration (DB-Sessions)
│   │   ├── permissions.ts      # RBAC (Rollen & Rechte)
│   │   ├── trpc/               # tRPC React-Client + Provider
│   │   └── roles.ts            # Rollen-Bezeichnungen
│   └── components/
│       ├── ui/                 # PilotBanner, MockBadge, StatusBadge (Ampel),
│       │                       #   AiSuggestionCard, ConfirmationDialog, DataTable
│       └── layout/             # Sidebar, TopBar, MobileNav, Navigation
├── prisma/
│   ├── schema.prisma           # Datenmodell (~24 Modelle)
│   ├── migrations/             # Versionierte Migrationen
│   └── seed.ts                 # Synthetische Testdaten
├── src/__tests__/              # Vitest-Tests (RBAC, KI, Adapter)
├── docs/                       # Architektur, Datenmodell, Sicherheit, ADRs
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── .env.example
├── .gitignore
└── README.md
```

---

## Umgebungsvariablen

Für den Betrieb ohne Docker: Kopiere `.env.example` nach `.env` und fülle die
Werte aus:

```bash
cp .env.example .env
```

Wichtigste Variablen:

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung, z. B. `postgresql://praxisflow:passwort@localhost:5432/praxisflow_dev` |
| `AUTH_SECRET` | Zufalls-Secret für Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | Basis-URL der App, lokal `http://localhost:3000` |
| `PILOT_MODE` | `true` – aktiviert Pilot-Banner und Mock-Modus |

Alle verfügbaren Variablen sind in `.env.example` dokumentiert. **Niemals `.env`
oder Secrets committen!** (Beim Docker-Weg werden diese Werte direkt in
`docker-compose.yml` gesetzt – eine `.env` ist dort nicht nötig.)

---

## Tests

```bash
# Alle Unit-/Integrationstests (Vitest) – RBAC, KI, Adapter
npm test

# Vitest im Watch-Modus
npm run test:watch

# End-to-End-Tests (Playwright)
npm run test:e2e

# Typprüfung (TypeScript, strict)
npm run typecheck

# Linting
npm run lint

# Produktions-Build (inkl. prisma generate)
npm run build
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
| Phase 2 | Kern-App, Pilot-Workflows, Testdaten | ✅ Abgeschlossen (Pilot v1) |
| Phase 3 | Tests, Sicherheits-Audit | 🔒 Wartet auf Phase 2-Review |
| Phase 4 | Pilot-Review, Abnahme | 🔒 Wartet auf Phase 3 |
| Phase 5 | Produktionsvorbereitung, echte Integrationen | 🔒 Nach Echtbetrieb-Freigabe |

---

## Lizenz

Proprietär – Praxisklinik Binningen AG. Nicht öffentlich zugänglich.

---

## Kontakt

Technische Fragen: Architektur-Team PraxisFlow AI
