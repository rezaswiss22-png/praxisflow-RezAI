# ADR-002: PostgreSQL mit Prisma ORM

**Status:** Akzeptiert  
**Datum:** 31.08.2026  
**Entscheider:** Architektur-Team PraxisFlow AI

---

## Kontext

Die Datenbank muss:
- ACID-konform sein (kritisch für Gesundheitsdaten)
- Mandantenfähigkeit unterstützen (tenantId in allen Tabellen)
- Versionierte Migrationen ermöglichen
- Vollständig portabel und selbst hostbar sein
- Mit TypeScript typsicher angesprochen werden können

## Entscheidung

PostgreSQL 16 als Datenbank mit Prisma ORM (aktuelle stabile Version).

## Begründung

- **ACID:** PostgreSQL ist industriell bewährt für transaktionale Gesundheitsdaten
- **Prisma:** Generiert TypeScript-Typen direkt aus dem Schema; Migrationen sind versioniert
- **Exportierbarkeit:** Schema ist in `schema.prisma` vollständig exportierbar
- **Selbst-hostbar:** PostgreSQL läuft auf jedem Server (kein Cloud-Lock-in)
- **Schweizer Hosting:** Exoscale CH und Infomaniak unterstützen PostgreSQL
- **Skalierbarkeit:** PgBouncer für Connection Pooling; Sharding bei Bedarf nachrüstbar

## Nachteile (akzeptiert)

- Prisma hat Einschränkungen bei komplexen Aggregationen (mitigiert via Raw-SQL für Reports)
- Kein eingebautes Multi-Tenancy-Pattern (mitigiert via Prisma-Middleware)

## Alternativen verworfen

- **MySQL/MariaDB:** Schlechtere JSON-Unterstützung, historisch schwächere ACID-Garantien
- **MongoDB:** Kein relationales Modell; ungünstig für stark vernetzte Gesundheitsdaten
- **Drizzle ORM:** Jüngere Lösung, kleineres Ökosystem
