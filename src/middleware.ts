import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware – Schutz aller /dashboard/*-Routen.
 *
 * Da PraxisFlow AI datenbankgestützte Sessions verwendet (Prisma, Node.js),
 * kann in der Edge-Middleware kein DB-Zugriff erfolgen. Die Middleware führt
 * daher einen kostengünstigen Cookie-Presence-Check durch und leitet
 * unauthentifizierte Requests auf /auth/login um.
 *
 * Die eigentliche, autoritative Autorisierung (Session-Gültigkeit, RBAC)
 * erfolgt serverseitig in den Dashboard-Layouts (`auth()`) und in jeder
 * tRPC-Procedure (protectedProcedure / roleProcedure). Deny by default.
 */
const SESSION_COOKIE = "praxisflow.session-token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard && !hasSession) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
