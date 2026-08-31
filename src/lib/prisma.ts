import { PrismaClient } from "@prisma/client";

/**
 * Prisma-Client-Singleton.
 * Verhindert im Dev-Modus mehrfache Instanzen (Hot Reload).
 *
 * MANDANTENTRENNUNG (Multi-Tenancy):
 * Die Geschäftslogik filtert konsequent über `tenantId`. Alle tRPC-Procedures
 * injizieren die `tenantId` aus der Session in jede Query (siehe src/server/trpc.ts).
 * Zusätzlich erzwingt eine Prisma-Client-Extension untenstehend, dass Schreib-
 * und Leseoperationen ohne tenant-Kontext auffallen (Defense-in-Depth).
 *
 * Hinweis: AuditLog-Writes und User-Auth-Lookups (Login) sind bewusst vom
 * verpflichtenden Tenant-Filter ausgenommen, da sie tenant-übergreifend
 * bzw. vor der Tenant-Auflösung stattfinden.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
