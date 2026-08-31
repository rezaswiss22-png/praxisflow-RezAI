import { prisma } from "./prisma";
import type { AuditAction, Prisma } from "@prisma/client";
import { logger } from "./logger";

/**
 * Audit-Log-Helper.
 *
 * UNVERÄNDERLICHKEIT: Es gibt bewusst nur `createAudit` (schreiben) und
 * `listAudit` (lesen). Kein Update, kein Delete – Audit-Einträge sind
 * revisionssicher (siehe SECURITY_CONCEPT.md).
 *
 * DATENSCHUTZ: In before/after keine PII speichern – nur strukturelle
 * Änderungen (Status, IDs, Feldnamen).
 */

export interface CreateAuditInput {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  result?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAudit(input: CreateAuditInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        before: input.before,
        after: input.after,
        result: input.result ?? "erfolg",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit-Fehler dürfen den Hauptvorgang nicht abbrechen, werden aber geloggt.
    logger.error({ err, action: input.action, resource: input.resource }, "Audit-Eintrag fehlgeschlagen");
    return null;
  }
}

export interface ListAuditInput {
  tenantId: string;
  resource?: string;
  userId?: string;
  action?: AuditAction;
  limit?: number;
}

export async function listAudit(input: ListAuditInput) {
  return prisma.auditLog.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.resource ? { resource: input.resource } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.action ? { action: input.action } : {}),
    },
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 100,
  });
}
