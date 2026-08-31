import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Context } from "./trpc";

/**
 * Erstellt den tRPC-Context pro Request.
 * Liest die aktuelle (DB-)Session via Auth.js und extrahiert IP/User-Agent
 * für Audit-Zwecke.
 */
export async function createContext(req: Request): Promise<Context> {
  const session = await auth();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unbekannt";
  const userAgent = req.headers.get("user-agent") || "unbekannt";

  return { session, prisma, ip, userAgent };
}
