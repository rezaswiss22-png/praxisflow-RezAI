-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ARZT', 'MPA_EMPFANG', 'PRAXISLEITUNG', 'PERSONAL', 'SYSADMIN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('ESPAS_PHONE', 'ONEDOC_APPOINTMENT', 'HIN_EMAIL', 'EMAIL', 'LABOR', 'MANUAL');

-- CreateEnum
CREATE TYPE "EingangStatus" AS ENUM ('NEU', 'IN_BEARBEITUNG', 'ZUGEORDNET', 'ABGESCHLOSSEN', 'FEHLER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HOCH', 'MITTEL', 'NIEDRIG');

-- CreateEnum
CREATE TYPE "VorgangStatus" AS ENUM ('OFFEN', 'IN_BEARBEITUNG', 'WARTET', 'FREIGABE_ERFORDERLICH', 'ABGESCHLOSSEN', 'ARCHIVIERT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT', 'ABGEBROCHEN');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('LABORBERICHT', 'REZEPT', 'UEBERWEISUNG', 'BEFUND', 'BRIEF', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "FreigabeDecision" AS ENUM ('GENEHMIGT', 'ABGELEHNT', 'ZURUECKGEWIESEN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('GEPLANT', 'BESTAETIGT', 'ABGESAGT', 'UMGEPLANT', 'ERFOLGT');

-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('AUSSTEHEND', 'GEPLANT', 'ERLEDIGT', 'ABGEBROCHEN');

-- CreateEnum
CREATE TYPE "AdapterStatus" AS ENUM ('AKTIV', 'INAKTIV', 'FEHLER');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('AUSSTEHEND', 'VERARBEITET', 'FEHLGESCHLAGEN', 'WIEDERHOLT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNUNG', 'DRINGEND', 'AUFGABE', 'FREIGABE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('ERTEILT', 'WIDERRUFEN', 'AUSSTEHEND');

-- CreateTable
CREATE TABLE "organisationen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pilot',
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisationen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standorte" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standorte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benutzer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "standortId" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "vorname" TEXT,
    "titel" TEXT,
    "kuerzel" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PERSONAL',
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "benutzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "audit_ereignisse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "result" TEXT NOT NULL DEFAULT 'erfolg',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_ereignisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patienten" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientenNummer" TEXT,
    "ahvNr" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "sprache" TEXT DEFAULT 'de',
    "kanton" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "rockethealthId" TEXT,
    "duplicateOfId" TEXT,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patienten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "einwilligungen" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "legalBasis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "einwilligungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aufbewahrungsregeln" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 3650,
    "deleteStrategy" TEXT NOT NULL DEFAULT 'soft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aufbewahrungsregeln_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanaele" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adapterName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanaele_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eingaenge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "patientId" TEXT,
    "rawPayload" JSONB,
    "parsedContent" JSONB,
    "subject" TEXT,
    "body" TEXT,
    "senderName" TEXT,
    "senderContact" TEXT,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EingangStatus" NOT NULL DEFAULT 'NEU',
    "aiSuggestion" JSONB,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eingaenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anhaenge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eingangId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anhaenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT,
    "vorgangId" TEXT,
    "eingangId" TEXT,
    "docType" "DocType" NOT NULL DEFAULT 'SONSTIGES',
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "size" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "aiSuggestion" JSONB,
    "patientZuordnung" TEXT NOT NULL DEFAULT 'offen',
    "aerztlicheKontrolle" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dokumente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vorgang_kategorien" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vorgang_kategorien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vorgaenge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nummer" TEXT NOT NULL,
    "patientId" TEXT,
    "eingangId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MITTEL',
    "status" "VorgangStatus" NOT NULL DEFAULT 'OFFEN',
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "freigabeErforderlich" BOOLEAN NOT NULL DEFAULT false,
    "aiSuggestion" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vorgaenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aufgaben" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vorgangId" TEXT,
    "patientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "assignedBy" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MITTEL',
    "status" "TaskStatus" NOT NULL DEFAULT 'OFFEN',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aufgaben_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kommentare" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vorgangId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "kommentare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freigaben" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vorgangId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "typ" TEXT NOT NULL DEFAULT 'aerztlich',
    "reason" TEXT,
    "decision" "FreigabeDecision",
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freigaben_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "termine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT,
    "providerId" TEXT,
    "standortId" TEXT,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'GEPLANT',
    "onedocId" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "termine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rueckrufe" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" TEXT,
    "assignedTo" TEXT,
    "status" "CallbackStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rueckrufe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations_adapter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adapterType" TEXT NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "credentials" JSONB,
    "status" "AdapterStatus" NOT NULL DEFAULT 'AKTIV',
    "lastHealthCheck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_adapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations_ereignisse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adapterId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_ereignisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benachrichtigungen" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benachrichtigungen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisationen_slug_key" ON "organisationen"("slug");

-- CreateIndex
CREATE INDEX "standorte_tenantId_idx" ON "standorte"("tenantId");

-- CreateIndex
CREATE INDEX "benutzer_tenantId_idx" ON "benutzer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "benutzer_tenantId_email_key" ON "benutzer"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "audit_ereignisse_tenantId_resource_resourceId_idx" ON "audit_ereignisse"("tenantId", "resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_ereignisse_tenantId_userId_idx" ON "audit_ereignisse"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "audit_ereignisse_tenantId_createdAt_idx" ON "audit_ereignisse"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "patienten_tenantId_lastName_idx" ON "patienten"("tenantId", "lastName");

-- CreateIndex
CREATE INDEX "patienten_tenantId_patientenNummer_idx" ON "patienten"("tenantId", "patientenNummer");

-- CreateIndex
CREATE INDEX "einwilligungen_tenantId_patientId_idx" ON "einwilligungen"("tenantId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "kanaele_tenantId_name_key" ON "kanaele"("tenantId", "name");

-- CreateIndex
CREATE INDEX "eingaenge_tenantId_status_idx" ON "eingaenge"("tenantId", "status");

-- CreateIndex
CREATE INDEX "anhaenge_eingangId_idx" ON "anhaenge"("eingangId");

-- CreateIndex
CREATE INDEX "dokumente_tenantId_patientId_idx" ON "dokumente"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "dokumente_tenantId_status_idx" ON "dokumente"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vorgang_kategorien_tenantId_name_key" ON "vorgang_kategorien"("tenantId", "name");

-- CreateIndex
CREATE INDEX "vorgaenge_tenantId_status_idx" ON "vorgaenge"("tenantId", "status");

-- CreateIndex
CREATE INDEX "vorgaenge_tenantId_patientId_idx" ON "vorgaenge"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "vorgaenge_tenantId_dueDate_idx" ON "vorgaenge"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "aufgaben_tenantId_status_idx" ON "aufgaben"("tenantId", "status");

-- CreateIndex
CREATE INDEX "aufgaben_tenantId_assignedTo_idx" ON "aufgaben"("tenantId", "assignedTo");

-- CreateIndex
CREATE INDEX "kommentare_vorgangId_idx" ON "kommentare"("vorgangId");

-- CreateIndex
CREATE INDEX "freigaben_tenantId_decision_idx" ON "freigaben"("tenantId", "decision");

-- CreateIndex
CREATE INDEX "termine_tenantId_startAt_idx" ON "termine"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "rueckrufe_tenantId_status_idx" ON "rueckrufe"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_adapter_tenantId_name_key" ON "integrations_adapter"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_ereignisse_idempotencyKey_key" ON "integrations_ereignisse"("idempotencyKey");

-- CreateIndex
CREATE INDEX "integrations_ereignisse_adapterId_status_idx" ON "integrations_ereignisse"("adapterId", "status");

-- CreateIndex
CREATE INDEX "benachrichtigungen_userId_isRead_idx" ON "benachrichtigungen"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "standorte" ADD CONSTRAINT "standorte_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benutzer" ADD CONSTRAINT "benutzer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benutzer" ADD CONSTRAINT "benutzer_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "standorte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_ereignisse" ADD CONSTRAINT "audit_ereignisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_ereignisse" ADD CONSTRAINT "audit_ereignisse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patienten" ADD CONSTRAINT "patienten_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einwilligungen" ADD CONSTRAINT "einwilligungen_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einwilligungen" ADD CONSTRAINT "einwilligungen_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufbewahrungsregeln" ADD CONSTRAINT "aufbewahrungsregeln_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanaele" ADD CONSTRAINT "kanaele_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eingaenge" ADD CONSTRAINT "eingaenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eingaenge" ADD CONSTRAINT "eingaenge_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "kanaele"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eingaenge" ADD CONSTRAINT "eingaenge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anhaenge" ADD CONSTRAINT "anhaenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anhaenge" ADD CONSTRAINT "anhaenge_eingangId_fkey" FOREIGN KEY ("eingangId") REFERENCES "eingaenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumente" ADD CONSTRAINT "dokumente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumente" ADD CONSTRAINT "dokumente_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumente" ADD CONSTRAINT "dokumente_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "vorgaenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumente" ADD CONSTRAINT "dokumente_eingangId_fkey" FOREIGN KEY ("eingangId") REFERENCES "eingaenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgang_kategorien" ADD CONSTRAINT "vorgang_kategorien_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgaenge" ADD CONSTRAINT "vorgaenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgaenge" ADD CONSTRAINT "vorgaenge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgaenge" ADD CONSTRAINT "vorgaenge_eingangId_fkey" FOREIGN KEY ("eingangId") REFERENCES "eingaenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgaenge" ADD CONSTRAINT "vorgaenge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vorgang_kategorien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vorgaenge" ADD CONSTRAINT "vorgaenge_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "vorgaenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentare" ADD CONSTRAINT "kommentare_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentare" ADD CONSTRAINT "kommentare_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "vorgaenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kommentare" ADD CONSTRAINT "kommentare_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freigaben" ADD CONSTRAINT "freigaben_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freigaben" ADD CONSTRAINT "freigaben_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "vorgaenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freigaben" ADD CONSTRAINT "freigaben_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freigaben" ADD CONSTRAINT "freigaben_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termine" ADD CONSTRAINT "termine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termine" ADD CONSTRAINT "termine_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termine" ADD CONSTRAINT "termine_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termine" ADD CONSTRAINT "termine_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "standorte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rueckrufe" ADD CONSTRAINT "rueckrufe_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rueckrufe" ADD CONSTRAINT "rueckrufe_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patienten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rueckrufe" ADD CONSTRAINT "rueckrufe_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations_adapter" ADD CONSTRAINT "integrations_adapter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations_ereignisse" ADD CONSTRAINT "integrations_ereignisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations_ereignisse" ADD CONSTRAINT "integrations_ereignisse_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "integrations_adapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benachrichtigungen" ADD CONSTRAINT "benachrichtigungen_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organisationen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benachrichtigungen" ADD CONSTRAINT "benachrichtigungen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "benutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
