import type { UserRole } from "@prisma/client";

/** Menschlich lesbare Rollennamen (Deutsch). */
export const ROLLEN_LABEL: Record<UserRole, string> = {
  ARZT: "Arzt / Ärztin",
  MPA_EMPFANG: "MPA / Empfang",
  PRAXISLEITUNG: "Praxisleitung",
  PERSONAL: "Personal",
  SYSADMIN: "Systemadministration",
};
