# PraxisFlow AI – Repository-Struktur

**Version:** 1.0.0 | **Datum:** 31.08.2026

---

## Vollständige Verzeichnisstruktur (Phase 2 Zielzustand)

```
praxisflow-RezAI/
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: Lint, Tests, Build
│       └── security.yml        # Sicherheits-Audit (npm audit)
│
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   │   ├── ADR-001-nextjs-app-router.md
│   │   ├── ADR-002-postgresql-prisma.md
│   │   ├── ADR-003-authjs-sessions.md
│   │   ├── ADR-004-mock-adapters.md
│   │   └── ADR-005-ai-assistance.md
│   ├── architecture/
│   │   ├── ARCHITECTURE.md         # Systemarchitektur
│   │   ├── ROLES_AND_PERMISSIONS.md
│   │   └── REPOSITORY_STRUCTURE.md
│   ├── data-model/
│   │   └── DATA_MODEL.md
│   ├── security/
│   │   └── SECURITY_CONCEPT.md
│   ├── api/
│   │   └── API_OVERVIEW.md         # (Phase 2)
│   └── integrations/
│       └── MOCK_ADAPTERS.md        # (Phase 2)
│
├── prisma/
│   ├── schema.prisma               # Vollständiges Datenmodell
│   ├── migrations/                 # Versionierte Migrationen
│   │   └── 0001_initial/
│   └── seed.ts                     # Synthetische Testdaten
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root Layout
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login-Seite
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── (app)/                  # Geschützte Bereiche
│   │   │   ├── layout.tsx          # App-Layout mit Navigation
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Übersicht
│   │   │   ├── eingang/
│   │   │   │   ├── page.tsx        # Eingangs-Liste
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Eingang-Detail
│   │   │   ├── kalender/
│   │   │   │   └── page.tsx
│   │   │   ├── vorgaenge/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── aufgaben/
│   │   │   │   └── page.tsx
│   │   │   ├── patienten/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── dokumente/
│   │   │   │   └── page.tsx
│   │   │   ├── auswertungen/
│   │   │   │   └── page.tsx
│   │   │   └── einstellungen/
│   │   │       ├── page.tsx
│   │   │       ├── benutzer/
│   │   │       ├── integrationen/
│   │   │       └── audit/
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # Auth.js Handler
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts    # tRPC Handler
│   │
│   ├── server/                     # Server-only Code
│   │   ├── auth/
│   │   │   ├── config.ts           # Auth.js Konfiguration
│   │   │   ├── rbac.ts             # Berechtigungsprüfung
│   │   │   └── session.ts          # Session-Management
│   │   ├── db/
│   │   │   ├── client.ts           # Prisma Client Singleton
│   │   │   └── middleware.ts       # Tenant-Filterung
│   │   ├── services/               # Geschäftslogik
│   │   │   ├── eingang.service.ts
│   │   │   ├── vorgang.service.ts
│   │   │   ├── patient.service.ts
│   │   │   ├── aufgabe.service.ts
│   │   │   ├── freigabe.service.ts
│   │   │   ├── dokument.service.ts
│   │   │   ├── termin.service.ts
│   │   │   ├── rueckruf.service.ts
│   │   │   └── audit.service.ts
│   │   ├── adapters/               # [MOCK] Integrationsadapter
│   │   │   ├── base.adapter.ts     # Abstrakte Basis
│   │   │   ├── rockethealth/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   ├── onedoc/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   ├── espas/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   ├── hin-blueconnect/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   ├── email/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   ├── kalender/
│   │   │   │   ├── index.ts        # [MOCK]
│   │   │   │   └── types.ts
│   │   │   └── labor/
│   │   │       ├── index.ts        # [MOCK]
│   │   │       └── types.ts
│   │   ├── ai/                     # KI-Assistenz (regelbasiert)
│   │   │   ├── classifier.ts       # Kategorie & Dringlichkeit
│   │   │   ├── patient-matcher.ts  # Patientenzuordnung
│   │   │   ├── summarizer.ts       # Zusammenfassungen
│   │   │   └── next-step.ts        # Nächster Schritt
│   │   └── trpc/                   # tRPC Router
│   │       ├── root.ts
│   │       ├── context.ts
│   │       └── routers/
│   │           ├── eingang.ts
│   │           ├── vorgang.ts
│   │           ├── patient.ts
│   │           ├── aufgabe.ts
│   │           ├── freigabe.ts
│   │           ├── termin.ts
│   │           ├── rueckruf.ts
│   │           └── audit.ts
│   │
│   ├── components/                 # React-Komponenten
│   │   ├── ui/                     # Design System
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx           # Ampel-Status
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/
│   │   │   ├── navigation.tsx      # Hauptnavigation
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── eingang/
│   │   │   ├── eingang-liste.tsx
│   │   │   ├── eingang-detail.tsx
│   │   │   └── patient-zuordnung.tsx # Zuordnungsbestätigung
│   │   ├── vorgang/
│   │   │   ├── vorgang-liste.tsx
│   │   │   ├── vorgang-detail.tsx
│   │   │   ├── freigabe-panel.tsx
│   │   │   └── ai-vorschlag.tsx    # KI-Vorschlag-Anzeige
│   │   ├── patient/
│   │   │   ├── patient-liste.tsx
│   │   │   └── patient-detail.tsx
│   │   └── shared/
│   │       ├── ampel-badge.tsx     # ROT/GELB/GRÜN
│   │       ├── mock-hinweis.tsx    # [MOCK]-Banner
│   │       └── pilot-banner.tsx    # Pilot-Warnung
│   │
│   └── lib/
│       ├── constants.ts
│       ├── date.ts                 # CH-Datumsformat, Zürich TZ
│       ├── errors.ts
│       └── validators.ts           # Zod Schemas
│
├── tests/
│   ├── unit/
│   │   ├── services/               # Service-Tests
│   │   ├── rbac/                   # RBAC-Tests
│   │   └── ai/                     # KI-Tests
│   ├── integration/
│   │   ├── api/                    # API-Integrationstests
│   │   └── adapters/               # Mock-Adapter-Tests
│   └── e2e/
│       ├── auth/                   # Login, Session
│       ├── eingang/                # Eingangs-Workflow
│       ├── vorgang/                # Vorgangs-Workflow
│       └── rbac/                   # Berechtigungstests
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── README.md
```

---

## Branch-Strategie

```
main                    # Produktionsbranch (geschützt)
│
├── develop             # Integrationsbranch
│   │
│   ├── feature/phase-2-kern-app      # Phase-2-Entwicklung
│   ├── feature/auth-session-rbac
│   ├── feature/eingang-workflow
│   ├── feature/vorgang-engine
│   ├── feature/mock-adapter-onedoc
│   └── ...
│
└── hotfix/...          # Kritische Bugfixes direkt
```

## Commit-Konventionen

```
feat(eingang): Patientenzuordnung mit KI-Vorschlag
fix(rbac): MPA-Freigabe blockiert korrigiert
docs(adr): ADR-006 Logging-Strategie hinzugefügt
test(eingang): Integrationstests Workflow komplett
chore(deps): Abhängigkeiten aktualisiert
security: Rate-Limiting für Login-Route verschärft
```

## Pull-Request-Prozess

1. Feature-Branch von `develop` erstellen
2. Änderungen committen (Conventional Commits)
3. Tests lokal ausführen (`npm run test`)
4. PR gegen `develop` öffnen
5. Code-Review (min. 1 Genehmigung)
6. CI-Pipeline muss grün sein
7. Merge via Squash

Kein direkter Push auf `main` oder `develop`.
