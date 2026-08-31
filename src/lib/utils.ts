import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

/** Tailwind-Klassen zusammenführen. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ZEITZONE = "Europe/Zurich";

/** Datum im Schweizer Format TT.MM.JJJJ. */
export function formatDatum(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, ZEITZONE, "dd.MM.yyyy", { locale: de });
}

/** Datum + Uhrzeit im Schweizer Format TT.MM.JJJJ HH:mm (24h). */
export function formatDatumZeit(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, ZEITZONE, "dd.MM.yyyy HH:mm", { locale: de });
}

/** Nur Uhrzeit HH:mm (24h). */
export function formatZeit(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, ZEITZONE, "HH:mm", { locale: de });
}

/** Relative Zeitangabe, z. B. "vor 3 Stunden". */
export function formatRelativ(date: Date | string | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: de });
}

/** Konfidenzwert (0..1) als Prozent formatieren. */
export function formatKonfidenz(value: number | null | undefined): string {
  if (value == null) return "–";
  return `${Math.round(value * 100)} %`;
}

/** Prüft, ob ein Datum heute ist (Zeitzone Europe/Zurich). */
export function istHeute(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  const heute = formatInTimeZone(new Date(), ZEITZONE, "yyyy-MM-dd");
  const ziel = formatInTimeZone(d, ZEITZONE, "yyyy-MM-dd");
  return heute === ziel;
}

/** Prüft, ob ein Fälligkeitsdatum überschritten ist. */
export function istUeberfaellig(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/** Initialen aus einem Namen bilden. */
export function initialen(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { format };
