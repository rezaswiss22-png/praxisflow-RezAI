# PraxisFlow AI – Kerndatenmodell

**Version:** 1.0.0 | **Datum:** 31.08.2026 | **Status:** Phase 1 – Entwurf

---

## 1. Designprinzipien

Jede Entität enthält folgende Pflichtfelder (Basisfelder):

```
id          String   @id @default(cuid())   -- Eindeutige ID
tenantId    String                           -- Mandanten-ID (Praxis)
createdAt   DateTime @default(now())         -- Erstellungszeitpunkt
createdBy   String                           -- Ersteller (User-ID)
updatedAt   DateTime @updatedAt              -- Änderungszeitpunkt
updatedBy   String                           -- Änderer (User-ID)
status      String                           -- Aktueller Status
version     Int      @default(1)             -- Optimistic Locking
deletedAt   DateTime?                        -- Soft Delete Zeitpunkt
deletedBy   String?                          -- Wer gelöscht hat
isArchived  Boolean  @default(false)         -- Archivierungsstatus
```

---

## 2. Entity-Relationship-Übersicht

```
Organisation ──< Standort
Organisation ──< Benutzer ──< BenutzerRolle >── Rolle ──< RolleBerechtigung >── Berechtigung
Benutzer ──< Sitzung

Patient ──< Kontaktinformation
Patient ──< Einwilligung
Patient ──< AufbewahrungsRegel

Eingang >── Kanal
Eingang ──< Nachricht ──< Anhang
Eingang >──? Patient          (vorgeschlagen, muss bestätigt werden)
Eingang ──> Vorgang

Vorgang >── VorgangKategorie
Vorgang >── Dringlichkeit
Vorgang >── StatusDefinition
Vorgang >──? Patient
Vorgang ──< Aufgabe
Vorgang ──< Kommentar
Vorgang ──< Freigabe
Vorgang ──< Dokument
Vorgang ──< VorgangEreignis    (Aktivitätshistorie)

Aufgabe >──? Benutzer          (Zuweisung)
Aufgabe ──< Frist
Aufgabe ──< Kommentar

Termin >──? Patient
Termin >──? Benutzer
Termin >── Kanal               (OneDoc, intern, etc.)

Rückruf >──? Patient
Rückruf >──? Benutzer

Dokument >──? Patient
Dokument >── DokumentTyp

IntegrationsAdapter ──< IntegrationsEreignis
IntegrationsAdapter ──< AdapterKonfiguration

Benachrichtigung >── Benutzer
AuditEreignis >── Benutzer
AuditEreignis >── Tenants
```

---

## 3. Prisma Schema (vollständiger Entwurf)

```prisma
// ============================================================
// PRAXISFLOW AI – PRISMA SCHEMA
// Version: 1.0.0
// Alle externen Integrationen sind Mock-Adapter (Pilot)
// Keine echten Patientendaten
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ORGANISATION & MANDANT
// ============================================================

model Organisation {
  id          String    @id @default(cuid())
  name        String
  kurzname    String    @unique
  strasse     String?
  plz         String?
  ort         String?
  kanton      String?
  land        String    @default("CH")
  telefon     String?
  email       String?
  webseite    String?
  gln         String?   // GLN der Praxis (Schweiz)
  zsr         String?   // ZSR-Nummer (Schweiz)
  status      String    @default("aktiv")
  version     Int       @default(1)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  standorte   Standort[]
  benutzer    Benutzer[]
  patienten   Patient[]
  vorgaenge   Vorgang[]
  eingaenge   Eingang[]
  dokumente   Dokument[]
  adapter     IntegrationsAdapter[]
  auditLog    AuditEreignis[]

  @@map("organisationen")
}

model Standort {
  id             String       @id @default(cuid())
  tenantId       String
  organisation   Organisation @relation(fields: [tenantId], references: [id])
  name           String
  strasse        String?
  plz            String?
  ort            String?
  telefon        String?
  email          String?
  status         String       @default("aktiv")
  version        Int          @default(1)
  createdAt      DateTime     @default(now())
  createdBy      String
  updatedAt      DateTime     @updatedAt
  updatedBy      String
  deletedAt      DateTime?
  deletedBy      String?
  isArchived     Boolean      @default(false)

  benutzer       Benutzer[]
  termine        Termin[]

  @@map("standorte")
}

// ============================================================
// BENUTZER, ROLLEN & BERECHTIGUNGEN
// ============================================================

model Benutzer {
  id               String         @id @default(cuid())
  tenantId         String
  organisation     Organisation   @relation(fields: [tenantId], references: [id])
  standortId       String?
  standort         Standort?      @relation(fields: [standortId], references: [id])
  email            String
  emailVerifiziert DateTime?
  name             String
  vorname          String?
  titel            String?        // Dr. med., etc.
  kuerzel          String?        // z.B. "DR", "MPA1"
  telefon          String?
  avatarUrl        String?
  aktiv            Boolean        @default(true)
  mfaAktiv         Boolean        @default(false)
  mfaGeheimnis     String?        // Verschlüsselt gespeichert
  letzterLogin     DateTime?
  passwordHash     String
  status           String         @default("aktiv")
  version          Int            @default(1)
  createdAt        DateTime       @default(now())
  createdBy        String
  updatedAt        DateTime       @updatedAt
  updatedBy        String
  deletedAt        DateTime?
  deletedBy        String?
  isArchived       Boolean        @default(false)

  rollen           BenutzerRolle[]
  sitzungen        Sitzung[]
  aufgaben         Aufgabe[]      @relation("AufgabeZugewiesenAn")
  erstellteAufgaben Aufgabe[]     @relation("AufgabeErstellt")
  freigaben        Freigabe[]
  benachrichtigungen Benachrichtigung[]
  auditEreignisse  AuditEreignis[]
  kommentare       Kommentar[]

  @@unique([tenantId, email])
  @@map("benutzer")
}

model Sitzung {
  id          String    @id @default(cuid())
  benutzerId  String
  benutzer    Benutzer  @relation(fields: [benutzerId], references: [id])
  token       String    @unique
  ipAdresse   String?
  userAgent   String?
  ablaufAt    DateTime
  widerrufenAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([benutzerId])
  @@index([token])
  @@map("sitzungen")
}

model Rolle {
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  beschreibung String?
  systemRolle Boolean   @default(false)  // Nicht löschbar
  status      String    @default("aktiv")
  version     Int       @default(1)
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  benutzer    BenutzerRolle[]
  berechtigungen RolleBerechtigung[]

  @@unique([tenantId, name])
  @@map("rollen")
}

model Berechtigung {
  id          String    @id @default(cuid())
  ressource   String    // z.B. "vorgang", "patient", "audit"
  aktion      String    // z.B. "lesen", "schreiben", "freigeben", "loeschen"
  beschreibung String?

  rollen      RolleBerechtigung[]

  @@unique([ressource, aktion])
  @@map("berechtigungen")
}

model BenutzerRolle {
  id          String    @id @default(cuid())
  benutzerId  String
  benutzer    Benutzer  @relation(fields: [benutzerId], references: [id])
  rolleId     String
  rolle       Rolle     @relation(fields: [rolleId], references: [id])
  gueltigBis  DateTime?
  createdAt   DateTime  @default(now())
  createdBy   String

  @@unique([benutzerId, rolleId])
  @@map("benutzer_rollen")
}

model RolleBerechtigung {
  id             String       @id @default(cuid())
  rolleId        String
  rolle          Rolle        @relation(fields: [rolleId], references: [id])
  berechtigungId String
  berechtigung   Berechtigung @relation(fields: [berechtigungId], references: [id])
  createdAt      DateTime     @default(now())
  createdBy      String

  @@unique([rolleId, berechtigungId])
  @@map("rollen_berechtigungen")
}

// ============================================================
// PATIENT
// ============================================================

model Patient {
  id                String         @id @default(cuid())
  tenantId          String
  organisation      Organisation   @relation(fields: [tenantId], references: [id])
  patientenNummer   String?        // Interne Nummer (aus KIS)
  ahvNummer         String?        // AHV-13 – VERSCHLÜSSELT
  vorname           String
  nachname          String
  geburtsdatum      DateTime?
  geschlecht        String?        // m/f/d/unbekannt
  sprache           String?        @default("de")
  notizen           String?
  risikoMarkierung  Boolean        @default(false)
  dublettenVon      String?        // ID des Hauptpatienten bei Dublette
  kissId            String?        // Rockethealth-ID (Mock)
  status            String         @default("aktiv")
  version           Int            @default(1)
  createdAt         DateTime       @default(now())
  createdBy         String
  updatedAt         DateTime       @updatedAt
  updatedBy         String
  deletedAt         DateTime?
  deletedBy         String?
  isArchived        Boolean        @default(false)

  kontakte          Kontaktinformation[]
  einwilligungen    Einwilligung[]
  aufbewahrung      AufbewahrungsRegel[]
  eingaenge         Eingang[]
  vorgaenge         Vorgang[]
  termine           Termin[]
  rueckrufe         Rueckruf[]
  dokumente         Dokument[]

  @@index([tenantId, nachname])
  @@index([tenantId, patientenNummer])
  @@map("patienten")
}

model Kontaktinformation {
  id          String    @id @default(cuid())
  tenantId    String
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  typ         String    // "telefon", "email", "adresse", "natel"
  wert        String    // VERSCHLÜSSELT für sensitive Daten
  bezeichnung String?   // z.B. "privat", "geschäftlich", "notfall"
  primaer     Boolean   @default(false)
  gueltigBis  DateTime?
  status      String    @default("aktiv")
  version     Int       @default(1)
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  @@index([patientId])
  @@map("kontaktinformationen")
}

model Einwilligung {
  id             String    @id @default(cuid())
  tenantId       String
  patientId      String
  patient        Patient   @relation(fields: [patientId], references: [id])
  typ            String    // z.B. "datenverarbeitung", "marketing", "forschung"
  rechtsgrundlage String   // z.B. "DSG", "DSGVO Art. 6(1)(a)"
  erteiltAm      DateTime
  widerrufenAm   DateTime?
  dokument       String?   // Pfad zur Einwilligungserklärung
  status         String    @default("aktiv")
  version        Int       @default(1)
  createdAt      DateTime  @default(now())
  createdBy      String
  updatedAt      DateTime  @updatedAt
  updatedBy      String

  @@map("einwilligungen")
}

model AufbewahrungsRegel {
  id              String    @id @default(cuid())
  tenantId        String
  patientId       String?
  patient         Patient?  @relation(fields: [patientId], references: [id])
  ressource       String    // z.B. "patient", "vorgang", "dokument"
  aufbewahrungJahre Int    @default(10)  // CH: mind. 10 Jahre
  loeschungAt     DateTime?
  rechtsgrundlage String?
  status          String    @default("aktiv")
  createdAt       DateTime  @default(now())
  createdBy       String
  updatedAt       DateTime  @updatedAt
  updatedBy       String

  @@map("aufbewahrungsregeln")
}

// ============================================================
// EINGANG & KANÄLE
// ============================================================

model Kanal {
  id          String    @id @default(cuid())
  name        String    @unique
  typ         String    // "telefon", "email", "onedoc", "hin", "dokument", "espas", "labor", "intern"
  beschreibung String?
  aktiv       Boolean   @default(true)

  eingaenge   Eingang[]

  @@map("kanaele")
}

model Eingang {
  id                  String       @id @default(cuid())
  tenantId            String
  organisation        Organisation @relation(fields: [tenantId], references: [id])
  kanalId             String
  kanal               Kanal        @relation(fields: [kanalId], references: [id])
  patientId           String?
  patient             Patient?     @relation(fields: [patientId], references: [id])
  patientZuordnung    String       @default("offen")  // "offen", "vorgeschlagen", "bestaetigt", "abgelehnt", "nicht_zuordenbar"
  patientKonfidenz    Float?       // 0.0 – 1.0 (KI-Konfidenzwert)
  patientBegruendung  String?      // KI-Begründung für Zuordnung
  patientBestaetigt   Boolean      @default(false)
  patientBestaetigtVon String?
  patientBestaetigtAm DateTime?

  betreff             String?
  inhalt              String?
  absender            String?      // Maskiert in Logs
  empfaenger          String?
  externeId           String?      // ID im Quellsystem
  prioritaet          String       @default("normal")  // "niedrig", "normal", "hoch", "dringend"

  // KI-Vorschläge (immer als Vorschlag gekennzeichnet)
  aiKategorie         String?
  aiDringlichkeit     String?
  aiZustaendigeRolle  String?
  aiNaechsterSchritt  String?
  aiZusammenfassung   String?
  aiKonfidenz         Float?
  aiBestaetigtVon     String?
  aiBestaetigtAm      DateTime?

  status              String       @default("neu")
  version             Int          @default(1)
  createdAt           DateTime     @default(now())
  createdBy           String
  updatedAt           DateTime     @updatedAt
  updatedBy           String
  deletedAt           DateTime?
  deletedBy           String?
  isArchived          Boolean      @default(false)

  nachrichten         Nachricht[]
  anhaenge            Anhang[]
  vorgaenge           Vorgang[]
  dokumente           Dokument[]

  @@index([tenantId, status])
  @@index([tenantId, patientZuordnung])
  @@map("eingaenge")
}

model Nachricht {
  id          String    @id @default(cuid())
  tenantId    String
  eingangId   String
  eingang     Eingang   @relation(fields: [eingangId], references: [id])
  absender    String?
  empfaenger  String?
  inhalt      String
  html        Boolean   @default(false)
  externeId   String?
  gesendetAt  DateTime?
  status      String    @default("eingehend")  // "eingehend", "ausgehend", "intern"
  version     Int       @default(1)
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  anhaenge    Anhang[]

  @@map("nachrichten")
}

model Anhang {
  id            String     @id @default(cuid())
  tenantId      String
  nachrichtId   String?
  nachricht     Nachricht? @relation(fields: [nachrichtId], references: [id])
  eingangId     String?
  eingang       Eingang?   @relation(fields: [eingangId], references: [id])
  dateiname     String
  dateityp      String     // MIME-Typ
  groesse       Int        // Bytes
  pfad          String     // Speicherpfad (verschlüsselt)
  pruefsumme    String?    // SHA-256
  status        String     @default("vorhanden")
  createdAt     DateTime   @default(now())
  createdBy     String
  updatedAt     DateTime   @updatedAt
  updatedBy     String
  deletedAt     DateTime?
  isArchived    Boolean    @default(false)

  @@map("anhaenge")
}

// ============================================================
// VORGANG
// ============================================================

model VorgangKategorie {
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  beschreibung String?
  farbe       String?   // Hex-Farbe für UI
  icon        String?
  status      String    @default("aktiv")
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  vorgaenge   Vorgang[]

  @@unique([tenantId, name])
  @@map("vorgang_kategorien")
}

model Dringlichkeit {
  id          String    @id @default(cuid())
  name        String    @unique
  stufe       Int       // 1=niedrig, 2=normal, 3=hoch, 4=dringend, 5=notfall
  farbe       String    // "gruen", "gelb", "orange", "rot", "dunkelrot"
  beschreibung String?
  maxAntwortStunden Int? // SLA in Stunden

  vorgaenge   Vorgang[]

  @@map("dringlichkeiten")
}

model StatusDefinition {
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  beschreibung String?
  farbe       String    // "gruen", "gelb", "rot"
  abgeschlossen Boolean @default(false)
  reihenfolge Int       @default(0)
  status      String    @default("aktiv")
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String

  vorgaenge   Vorgang[]

  @@unique([tenantId, name])
  @@map("status_definitionen")
}

model Vorgang {
  id                  String            @id @default(cuid())
  tenantId            String
  organisation        Organisation      @relation(fields: [tenantId], references: [id])
  nummer              String            // z.B. "VG-2026-00042"
  titel               String
  beschreibung        String?
  kategorieId         String?
  kategorie           VorgangKategorie? @relation(fields: [kategorieId], references: [id])
  dringlichkeitId     String
  dringlichkeit       Dringlichkeit     @relation(fields: [dringlichkeitId], references: [id])
  statusId            String
  status_def          StatusDefinition  @relation(fields: [statusId], references: [id])
  patientId           String?
  patient             Patient?          @relation(fields: [patientId], references: [id])
  eingangId           String?
  eingang             Eingang?          @relation(fields: [eingangId], references: [id])
  verantwortlichId    String?
  verantwortlich      Benutzer?         @relation("VorgangVerantwortlich", fields: [verantwortlichId], references: [id])
  frist               DateTime?
  naechsterSchritt    String?
  freigabeErforderlich Boolean         @default(false)
  freigabeStatus      String?          // "ausstehend", "freigegeben", "abgelehnt"

  // KI-Vorschläge
  aiKategorie         String?
  aiDringlichkeit     String?
  aiNaechsterSchritt  String?
  aiKonfidenz         Float?
  aiBestaetigtVon     String?
  aiBestaetigtAm      DateTime?

  status              String            @default("offen")
  version             Int               @default(1)
  createdAt           DateTime          @default(now())
  createdBy           String
  updatedAt           DateTime          @updatedAt
  updatedBy           String
  deletedAt           DateTime?
  deletedBy           String?
  isArchived          Boolean           @default(false)

  aufgaben            Aufgabe[]
  kommentare          Kommentar[]
  freigaben           Freigabe[]
  dokumente           Dokument[]
  ereignisse          VorgangEreignis[]

  @@index([tenantId, status])
  @@index([tenantId, patientId])
  @@index([tenantId, frist])
  @@map("vorgaenge")
}

model VorgangEreignis {
  id          String    @id @default(cuid())
  tenantId    String
  vorgangId   String
  vorgang     Vorgang   @relation(fields: [vorgangId], references: [id])
  typ         String    // "erstellt", "status_geaendert", "zugewiesen", "kommentiert", "freigegeben", etc.
  beschreibung String
  vorher      Json?     // Vorheriger Zustand (für Audit)
  nachher     Json?     // Neuer Zustand
  createdAt   DateTime  @default(now())
  createdBy   String

  @@index([vorgangId])
  @@map("vorgang_ereignisse")
}

// ============================================================
// AUFGABEN
// ============================================================

model Aufgabe {
  id               String    @id @default(cuid())
  tenantId         String
  titel            String
  beschreibung     String?
  vorgangId        String?
  vorgang          Vorgang?  @relation(fields: [vorgangId], references: [id])
  zugewiesenAnId   String?
  zugewiesenAn     Benutzer? @relation("AufgabeZugewiesenAn", fields: [zugewiesenAnId], references: [id])
  erstelltVonId    String
  erstelltVon      Benutzer  @relation("AufgabeErstellt", fields: [erstelltVonId], references: [id])
  faelligAm        DateTime?
  prioritaet       String    @default("normal")
  erfordertFreigabe Boolean  @default(false)
  erledigtAm       DateTime?
  erledigtVon      String?
  status           String    @default("offen")
  version          Int       @default(1)
  createdAt        DateTime  @default(now())
  createdBy        String
  updatedAt        DateTime  @updatedAt
  updatedBy        String
  deletedAt        DateTime?
  deletedBy        String?
  isArchived       Boolean   @default(false)

  kommentare       Kommentar[]
  fristen          Frist[]

  @@index([tenantId, status])
  @@index([tenantId, zugewiesenAnId])
  @@map("aufgaben")
}

model Frist {
  id          String    @id @default(cuid())
  tenantId    String
  aufgabeId   String?
  aufgabe     Aufgabe?  @relation(fields: [aufgabeId], references: [id])
  vorgangId   String?
  faelligAm   DateTime
  erinnerungAm DateTime?
  typ         String    // "aufgabe", "vorgang", "rueckruf", "termin"
  eskaliert   Boolean   @default(false)
  eskaliertAm DateTime?
  eskaliertAn String?
  status      String    @default("aktiv")
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String

  @@map("fristen")
}

// ============================================================
// KOMMENTARE
// ============================================================

model Kommentar {
  id          String    @id @default(cuid())
  tenantId    String
  inhalt      String
  intern      Boolean   @default(true)  // Intern = nur Personal sichtbar
  vorgangId   String?
  vorgang     Vorgang?  @relation(fields: [vorgangId], references: [id])
  aufgabeId   String?
  aufgabe     Aufgabe?  @relation(fields: [aufgabeId], references: [id])
  autorId     String
  autor       Benutzer  @relation(fields: [autorId], references: [id])
  bearbeitetAm DateTime?
  status      String    @default("aktiv")
  version     Int       @default(1)
  createdAt   DateTime  @default(now())
  createdBy   String
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  deletedAt   DateTime?
  isArchived  Boolean   @default(false)

  @@index([vorgangId])
  @@map("kommentare")
}

// ============================================================
// TERMINE & RÜCKRUFE
// ============================================================

model Termin {
  id              String    @id @default(cuid())
  tenantId        String
  patientId       String?
  patient         Patient?  @relation(fields: [patientId], references: [id])
  benutzerId      String?
  benutzer        Benutzer? @relation(fields: [benutzerId], references: [id])
  standortId      String?
  standort        Standort? @relation(fields: [standortId], references: [id])
  titel           String
  beschreibung    String?
  startAt         DateTime
  endeAt          DateTime
  ganzerTag       Boolean   @default(false)
  typ             String    // "konsultation", "kontrolle", "operation", "intern"
  quelle          String    // "onedoc", "intern", "telefonisch"
  externeId       String?   // z.B. OneDoc-ID
  dublette        Boolean   @default(false)
  konflikte       String[]  // IDs konfligierender Termine
  storniertAm     DateTime?
  storniertVon    String?
  storniertGrund  String?
  freigabeStatus  String?   // Stornierung braucht Freigabe
  status          String    @default("bestaetigt")
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  createdBy       String
  updatedAt       DateTime  @updatedAt
  updatedBy       String
  deletedAt       DateTime?
  deletedBy       String?
  isArchived      Boolean   @default(false)

  @@index([tenantId, startAt])
  @@index([tenantId, patientId])
  @@map("termine")
}

model Rueckruf {
  id              String    @id @default(cuid())
  tenantId        String
  patientId       String?
  patient         Patient?  @relation(fields: [patientId], references: [id])
  zugewiesenAnId  String?
  zugewiesenAn    Benutzer? @relation(fields: [zugewiesenAnId], references: [id])
  telefonnummer   String    // Verschlüsselt
  grund           String?
  zusammenfassung String?
  faelligAm       DateTime?
  durchgefuehrtAm DateTime?
  durchgefuehrtVon String?
  ergebnis        String?
  status          String    @default("offen")  // "offen", "in_bearbeitung", "abgeschlossen", "nicht_erreicht"
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  createdBy       String
  updatedAt       DateTime  @updatedAt
  updatedBy       String
  deletedAt       DateTime?
  deletedBy       String?
  isArchived      Boolean   @default(false)

  @@index([tenantId, status])
  @@map("rueckrufe")
}

// ============================================================
// DOKUMENTE
// ============================================================

model DokumentTyp {
  id          String    @id @default(cuid())
  name        String    @unique
  beschreibung String?
  medizinisch Boolean   @default(false)  // Erfordert ärztliche Kontrolle
  aufbewahrungJahre Int @default(10)

  dokumente   Dokument[]

  @@map("dokument_typen")
}

model Dokument {
  id                  String      @id @default(cuid())
  tenantId            String
  organisation        Organisation @relation(fields: [tenantId], references: [id])
  patientId           String?
  patient             Patient?    @relation(fields: [patientId], references: [id])
  vorgangId           String?
  vorgang             Vorgang?    @relation(fields: [vorgangId], references: [id])
  eingangId           String?
  eingang             Eingang?    @relation(fields: [eingangId], references: [id])
  typId               String?
  typ                 DokumentTyp? @relation(fields: [typId], references: [id])
  titel               String
  dateiname           String
  dateityp            String      // MIME-Typ
  groesse             Int         // Bytes
  pfad                String      // Verschlüsselt
  pruefsumme          String?     // SHA-256
  patientZuordnung    String      @default("offen")
  patientKonfidenz    Float?
  aerztlicheKontrolle Boolean     @default(false)
  aerztlicheKontrolleVon String?
  aerztlicheKontrolleAm  DateTime?
  exportiertAn        String?     // z.B. "rockethealth_mock"
  exportiertAm        DateTime?
  status              String      @default("aktiv")
  version             Int         @default(1)
  createdAt           DateTime    @default(now())
  createdBy           String
  updatedAt           DateTime    @updatedAt
  updatedBy           String
  deletedAt           DateTime?
  deletedBy           String?
  isArchived          Boolean     @default(false)

  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("dokumente")
}

// ============================================================
// FREIGABEN
// ============================================================

model Freigabe {
  id              String    @id @default(cuid())
  tenantId        String
  vorgangId       String?
  vorgang         Vorgang?  @relation(fields: [vorgangId], references: [id])
  benutzerId      String
  benutzer        Benutzer  @relation(fields: [benutzerId], references: [id])
  typ             String    // "aerztlich", "organisatorisch", "stornierung"
  vorschlag       String    // Was soll freigegeben werden
  begruendung     String?   // KI-Begründung
  entscheidung    String?   // "freigegeben", "abgelehnt", "zurueckgewiesen"
  entscheidungAm  DateTime?
  entscheidungNotiz String?
  status          String    @default("ausstehend")
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  createdBy       String
  updatedAt       DateTime  @updatedAt
  updatedBy       String

  @@index([tenantId, status])
  @@index([benutzerId, status])
  @@map("freigaben")
}

// ============================================================
// INTEGRATIONEN (Mock-Adapter)
// ============================================================

model IntegrationsAdapter {
  id              String       @id @default(cuid())
  tenantId        String
  organisation    Organisation @relation(fields: [tenantId], references: [id])
  name            String       // "rockethealth", "onedoc", "espas", etc.
  typ             String       // "kis", "termin", "telefon", "email", "labor", "hin"
  modus           String       @default("mock")  // "mock", "sandbox", "produktion"
  aktiv           Boolean      @default(true)
  konfiguration   Json         // Adapter-spezifische Config (verschlüsselt)
  letzterCheck    DateTime?
  letzterFehler   String?
  fehlerAnzahl    Int          @default(0)
  syncStatus      String       @default("unbekannt")
  status          String       @default("aktiv")
  version         Int          @default(1)
  createdAt       DateTime     @default(now())
  createdBy       String
  updatedAt       DateTime     @updatedAt
  updatedBy       String

  ereignisse      IntegrationsEreignis[]

  @@unique([tenantId, name])
  @@map("integrations_adapter")
}

model IntegrationsEreignis {
  id          String              @id @default(cuid())
  tenantId    String
  adapterId   String
  adapter     IntegrationsAdapter @relation(fields: [adapterId], references: [id])
  typ         String              // "eingang", "ausgang", "fehler", "sync", "health"
  richtung    String              // "eingehend", "ausgehend"
  externeId   String?
  nutzlast    Json?               // Keine PII in Logs!
  fehler      String?
  versuche    Int                 @default(1)
  naechsterVersuch DateTime?
  idempotenzKey String?           @unique
  status      String              // "erfolgreich", "fehlgeschlagen", "wiederholen", "ignoriert"
  createdAt   DateTime            @default(now())

  @@index([adapterId, status])
  @@map("integrations_ereignisse")
}

// ============================================================
// BENACHRICHTIGUNGEN
// ============================================================

model Benachrichtigung {
  id          String    @id @default(cuid())
  tenantId    String
  benutzerId  String
  benutzer    Benutzer  @relation(fields: [benutzerId], references: [id])
  typ         String    // "info", "warnung", "fehler", "aufgabe", "freigabe", "eskalation"
  titel       String
  inhalt      String?
  link        String?   // Relativer Pfad zur betreffenden Ansicht
  gelesenAm   DateTime?
  status      String    @default("ungelesen")
  createdAt   DateTime  @default(now())
  createdBy   String

  @@index([benutzerId, status])
  @@map("benachrichtigungen")
}

// ============================================================
// AUDIT-LOG (revisionsfähig, unveränderlich)
// ============================================================

model AuditEreignis {
  id              String       @id @default(cuid())
  tenantId        String
  organisation    Organisation @relation(fields: [tenantId], references: [id])
  benutzerId      String?
  benutzer        Benutzer?    @relation(fields: [benutzerId], references: [id])
  aktion          String       // "lesen", "erstellen", "aendern", "loeschen", "exportieren", "anmelden", "abmelden", "freigeben"
  ressource       String       // z.B. "patient", "vorgang", "dokument"
  ressourceId     String?      // ID des betroffenen Datensatzes
  vorher          Json?        // Keine PII – nur strukturelle Änderungen
  nachher         Json?
  ipAdresse       String?
  userAgent       String?
  sessionId       String?
  ergebnis        String       // "erfolg", "fehler", "verweigert"
  fehler          String?
  createdAt       DateTime     @default(now())

  // KEIN updatedAt, deletedAt – Audit-Einträge sind unveränderlich
  @@index([tenantId, ressource, ressourceId])
  @@index([tenantId, benutzerId])
  @@index([tenantId, createdAt])
  @@map("audit_ereignisse")
}
```

---

## 4. Indexierungsstrategie

Alle Tabellen mit Mandantenbezug werden primär über `tenantId` gefiltert. Composite-Indizes folgen dem Muster `(tenantId, <häufigstes Filterfeld>)`.

## 5. Datenverschlüsselung

| Feld | Verschlüsselung | Methode |
|---|---|---|
| ahvNummer | Feldverschlüsselung | AES-256-GCM, Key aus KMS |
| kontaktinformation.wert (Telefon) | Feldverschlüsselung | AES-256-GCM |
| rueckruf.telefonnummer | Feldverschlüsselung | AES-256-GCM |
| benutzer.mfaGeheimnis | Feldverschlüsselung | AES-256-GCM |
| adapter.konfiguration | Feldverschlüsselung | AES-256-GCM |
| dokument.pfad | Feldverschlüsselung | AES-256-GCM |
| anhang.pfad | Feldverschlüsselung | AES-256-GCM |

**Pilot-Annahme:** Im Pilot wird Feldverschlüsselung als Kommentar dokumentiert; die eigentliche AES-Implementierung erfolgt vor Echtbetrieb. Kein AHV-Nummer im Piloten-Seeding.
