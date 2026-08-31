/**
 * In-Memory Rate-Limiting (Pilot-Implementierung).
 *
 * ⚠️ PILOT-HINWEIS: Diese Implementierung hält Zähler im Prozessspeicher.
 * Für Mehrinstanz-Betrieb (Produktion) auf einen geteilten Store migrieren
 * (z. B. Redis mit `INCR`/`EXPIRE` oder ein Sliding-Window-Algorithmus).
 * Die Schnittstelle bleibt dabei identisch.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Generisches Fenster-basiertes Rate-Limit.
 * @param key    Eindeutiger Schlüssel (z. B. `login:<ip>` oder `api:<userId>`)
 * @param limit  Maximale Anzahl Anfragen im Fenster
 * @param windowMs Fensterlänge in Millisekunden
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSec: 0,
  };
}

const LOGIN_LIMIT = Number(process.env.RATE_LIMIT_LOGIN || 5);
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 Minuten
const API_LIMIT = Number(process.env.RATE_LIMIT_API || 200);
const API_WINDOW_MS = 60 * 1000; // 1 Minute

/** Login-Rate-Limit: 5 Versuche / 15 min / IP. */
export function checkLoginRateLimit(ip: string): RateLimitResult {
  return rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
}

/** API-Rate-Limit: 200 Requests / min / Benutzer. */
export function checkApiRateLimit(userId: string): RateLimitResult {
  return rateLimit(`api:${userId}`, API_LIMIT, API_WINDOW_MS);
}

/** Login-Zähler nach erfolgreichem Login zurücksetzen. */
export function resetLoginRateLimit(ip: string): void {
  store.delete(`login:${ip}`);
}
