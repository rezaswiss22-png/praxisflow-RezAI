import type { UserRole } from "@prisma/client";

/**
 * RBAC – Rollen- und Rechtemodell (serverseitig durchgesetzt).
 * Quelle: docs/architecture/ROLES_AND_PERMISSIONS.md
 *
 * Prinzipien:
 * - Least Privilege
 * - Deny by default
 * - Serverseitige Prüfung (nie nur im Frontend)
 */

export const PERMISSIONS = {
  // Patienten
  PATIENT_READ: "patient:lesen",
  PATIENT_WRITE: "patient:schreiben",
  PATIENT_DELETE: "patient:loeschen",
  PATIENT_EXPORT: "patient:exportieren",
  PATIENT_MEDICAL: "patient:medizinisch",

  // Vorgänge
  VORGANG_READ: "vorgang:lesen",
  VORGANG_WRITE: "vorgang:schreiben",
  VORGANG_CLOSE: "vorgang:abschliessen",
  VORGANG_DELETE: "vorgang:loeschen",
  VORGANG_APPROVE: "vorgang:freigeben", // Nur ARZT
  VORGANG_ESCALATE: "vorgang:eskalieren",

  // Eingang
  EINGANG_READ: "eingang:lesen",
  EINGANG_WRITE: "eingang:schreiben",

  // Aufgaben
  AUFGABE_READ: "aufgabe:lesen",
  AUFGABE_READ_OWN: "aufgabe:lesen_eigene",
  AUFGABE_WRITE: "aufgabe:schreiben",
  AUFGABE_COMPLETE_OWN: "aufgabe:erledigen_eigene",
  AUFGABE_DELETE: "aufgabe:loeschen",

  // Dokumente
  DOKUMENT_READ: "dokument:lesen",
  DOKUMENT_WRITE: "dokument:schreiben",
  DOKUMENT_DELETE: "dokument:loeschen",
  DOKUMENT_MEDICAL: "dokument:aerztlich",
  DOKUMENT_EXPORT: "dokument:exportieren",

  // Termine
  TERMIN_READ: "termin:lesen",
  TERMIN_WRITE: "termin:schreiben",
  TERMIN_CANCEL: "termin:stornieren",

  // Rückrufe
  RUECKRUF_READ: "rueckruf:lesen",
  RUECKRUF_WRITE: "rueckruf:schreiben",

  // Auswertungen
  AUSWERTUNG_READ: "auswertung:lesen",
  AUSWERTUNG_EXPORT: "auswertung:exportieren",
  AUDIT_READ: "audit:lesen",

  // Administration
  BENUTZER_MANAGE: "benutzer:verwalten",
  ROLLE_MANAGE: "rolle:verwalten",
  SYSTEM_CONFIG: "system:konfigurieren",
  INTEGRATION_READ: "integration:lesen",
  INTEGRATION_CONFIG: "integration:konfigurieren",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Standard-Rollenzuweisungen (aus ROLES_AND_PERMISSIONS.md).
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ARZT: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_WRITE,
    PERMISSIONS.PATIENT_DELETE,
    PERMISSIONS.PATIENT_MEDICAL,
    PERMISSIONS.VORGANG_READ,
    PERMISSIONS.VORGANG_WRITE,
    PERMISSIONS.VORGANG_CLOSE,
    PERMISSIONS.VORGANG_APPROVE,
    PERMISSIONS.VORGANG_ESCALATE,
    PERMISSIONS.EINGANG_READ,
    PERMISSIONS.EINGANG_WRITE,
    PERMISSIONS.AUFGABE_READ,
    PERMISSIONS.AUFGABE_WRITE,
    PERMISSIONS.DOKUMENT_READ,
    PERMISSIONS.DOKUMENT_WRITE,
    PERMISSIONS.DOKUMENT_MEDICAL,
    PERMISSIONS.TERMIN_READ,
    PERMISSIONS.TERMIN_WRITE,
    PERMISSIONS.TERMIN_CANCEL,
    PERMISSIONS.RUECKRUF_READ,
    PERMISSIONS.RUECKRUF_WRITE,
    PERMISSIONS.AUSWERTUNG_READ,
  ],
  MPA_EMPFANG: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_WRITE,
    PERMISSIONS.VORGANG_READ,
    PERMISSIONS.VORGANG_WRITE,
    PERMISSIONS.VORGANG_ESCALATE,
    PERMISSIONS.EINGANG_READ,
    PERMISSIONS.EINGANG_WRITE,
    PERMISSIONS.AUFGABE_READ,
    PERMISSIONS.AUFGABE_WRITE,
    PERMISSIONS.DOKUMENT_READ,
    PERMISSIONS.DOKUMENT_WRITE,
    PERMISSIONS.TERMIN_READ,
    PERMISSIONS.TERMIN_WRITE,
    PERMISSIONS.TERMIN_CANCEL, // ⚠️ nur mit Freigabe (Business-Logik)
    PERMISSIONS.RUECKRUF_READ,
    PERMISSIONS.RUECKRUF_WRITE,
    PERMISSIONS.AUSWERTUNG_READ,
  ],
  PRAXISLEITUNG: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_WRITE,
    PERMISSIONS.PATIENT_DELETE,
    PERMISSIONS.PATIENT_EXPORT,
    PERMISSIONS.VORGANG_READ,
    PERMISSIONS.VORGANG_WRITE,
    PERMISSIONS.VORGANG_CLOSE,
    PERMISSIONS.VORGANG_DELETE,
    PERMISSIONS.VORGANG_ESCALATE,
    PERMISSIONS.EINGANG_READ,
    PERMISSIONS.EINGANG_WRITE,
    PERMISSIONS.AUFGABE_READ,
    PERMISSIONS.AUFGABE_WRITE,
    PERMISSIONS.AUFGABE_DELETE,
    PERMISSIONS.DOKUMENT_READ,
    PERMISSIONS.DOKUMENT_WRITE,
    PERMISSIONS.DOKUMENT_DELETE,
    PERMISSIONS.DOKUMENT_EXPORT,
    PERMISSIONS.TERMIN_READ,
    PERMISSIONS.TERMIN_WRITE,
    PERMISSIONS.TERMIN_CANCEL,
    PERMISSIONS.RUECKRUF_READ,
    PERMISSIONS.RUECKRUF_WRITE,
    PERMISSIONS.AUSWERTUNG_READ,
    PERMISSIONS.AUSWERTUNG_EXPORT,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.BENUTZER_MANAGE,
    PERMISSIONS.ROLLE_MANAGE,
    PERMISSIONS.INTEGRATION_READ,
  ],
  PERSONAL: [
    // Nur explizit zugewiesene Aufgaben (Filterlogik in den Procedures)
    PERMISSIONS.AUFGABE_READ_OWN,
    PERMISSIONS.AUFGABE_COMPLETE_OWN,
  ],
  SYSADMIN: [
    PERMISSIONS.BENUTZER_MANAGE,
    PERMISSIONS.ROLLE_MANAGE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.INTEGRATION_READ,
    PERMISSIONS.INTEGRATION_CONFIG,
    PERMISSIONS.AUDIT_READ,
    // KEIN Zugriff auf Patientendaten oder medizinische Inhalte
  ],
};

/**
 * Mapping von (aktion, ressource) auf konkrete Permissions.
 * Ermöglicht die im Subtask geforderte Signatur `can(role, action, resource)`.
 */
const ACTION_RESOURCE_MAP: Record<string, Permission | undefined> = {
  "view:patient": PERMISSIONS.PATIENT_READ,
  "create:patient": PERMISSIONS.PATIENT_WRITE,
  "update:patient": PERMISSIONS.PATIENT_WRITE,
  "delete:patient": PERMISSIONS.PATIENT_DELETE,
  "export:patient": PERMISSIONS.PATIENT_EXPORT,
  "medical:patient": PERMISSIONS.PATIENT_MEDICAL,

  "view:eingang": PERMISSIONS.EINGANG_READ,
  "create:eingang": PERMISSIONS.EINGANG_WRITE,
  "update:eingang": PERMISSIONS.EINGANG_WRITE,

  "view:vorgang": PERMISSIONS.VORGANG_READ,
  "create:vorgang": PERMISSIONS.VORGANG_WRITE,
  "update:vorgang": PERMISSIONS.VORGANG_WRITE,
  "close:vorgang": PERMISSIONS.VORGANG_CLOSE,
  "delete:vorgang": PERMISSIONS.VORGANG_DELETE,
  "escalate:vorgang": PERMISSIONS.VORGANG_ESCALATE,
  "approve:vorgang": PERMISSIONS.VORGANG_APPROVE,
  "approve:freigabe": PERMISSIONS.VORGANG_APPROVE,
  "reject:freigabe": PERMISSIONS.VORGANG_APPROVE,

  "view:aufgabe": PERMISSIONS.AUFGABE_READ,
  "create:aufgabe": PERMISSIONS.AUFGABE_WRITE,
  "update:aufgabe": PERMISSIONS.AUFGABE_WRITE,
  "delete:aufgabe": PERMISSIONS.AUFGABE_DELETE,

  "view:dokument": PERMISSIONS.DOKUMENT_READ,
  "create:dokument": PERMISSIONS.DOKUMENT_WRITE,
  "update:dokument": PERMISSIONS.DOKUMENT_WRITE,
  "delete:dokument": PERMISSIONS.DOKUMENT_DELETE,
  "medical:dokument": PERMISSIONS.DOKUMENT_MEDICAL,
  "export:dokument": PERMISSIONS.DOKUMENT_EXPORT,

  "view:termin": PERMISSIONS.TERMIN_READ,
  "create:termin": PERMISSIONS.TERMIN_WRITE,
  "cancel:termin": PERMISSIONS.TERMIN_CANCEL,

  "view:rueckruf": PERMISSIONS.RUECKRUF_READ,
  "create:rueckruf": PERMISSIONS.RUECKRUF_WRITE,

  "view:auswertungen": PERMISSIONS.AUSWERTUNG_READ,
  "export:auswertungen": PERMISSIONS.AUSWERTUNG_EXPORT,
  "view:audit": PERMISSIONS.AUDIT_READ,

  "manage:user": PERMISSIONS.BENUTZER_MANAGE,
  "manage:rolle": PERMISSIONS.ROLLE_MANAGE,
  "config:system": PERMISSIONS.SYSTEM_CONFIG,
  "view:integration": PERMISSIONS.INTEGRATION_READ,
  "config:integration": PERMISSIONS.INTEGRATION_CONFIG,
};

/** Prüft, ob eine Rolle eine konkrete Permission besitzt. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Zentrale Berechtigungsprüfung: can(role, action, resource).
 * Beispiel: can("ARZT", "approve", "freigabe") === true
 */
export function can(role: UserRole, action: string, resource: string): boolean {
  const key = `${action}:${resource}`;
  const permission = ACTION_RESOURCE_MAP[key];
  if (!permission) return false;
  return hasPermission(role, permission);
}

/** Liefert alle Permissions einer Rolle (z. B. für UI-Ausblendung). */
export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
