# ADR-001: Next.js mit App Router als Full-Stack-Framework

**Status:** Akzeptiert  
**Datum:** 31.08.2026  
**Entscheider:** Architektur-Team PraxisFlow AI

---

## Kontext

PraxisFlow AI benötigt ein Full-Stack-Framework, das:
- Server-seitiges Rendering für SEO und schnelles Laden unterstützt
- API-Routen ohne separaten Backend-Server bereitstellt
- Mit TypeScript vollständig typsicher ist
- Ausserhalb der Abacus-Plattform selbst hostbar ist
- Eine aktive Community und langfristige Unterstützung bietet

## Entscheidung

Next.js (aktuell stabile Version) mit App Router wird als Full-Stack-Framework verwendet.

## Begründung

- **Portabilität:** Läuft auf jedem Node.js-Host (Vercel, Hetzner, AWS, selbst gehostet)
- **App Router:** Serverseitige Komponenten reduzieren Bundle-Grösse und verbessern Performance
- **TypeScript:** Vollständige Typsicherheit vom Frontend bis zur Datenbank (via Prisma)
- **API Routes:** Kein separater Backend-Service erforderlich (vereinfacht Deployment)
- **Marktreife:** Weit verbreitet, gut dokumentiert, grosse Community
- **Server Actions:** Ermöglichen sichere, serverseitige Formulare ohne API-Boilerplate

## Nachteile (akzeptiert)

- App Router ist neuer als Pages Router; manche Libraries sind noch nicht kompatibel
- Vendor-Nähe zu Vercel (mitigiert durch Selbst-Hosting-Möglichkeit)

## Alternativen verworfen

- **Remix:** Gute Alternative, aber kleinere Community
- **SvelteKit:** Zu wenig TypeScript-Ökosystem für Gesundheitswesen-Anforderungen
- **Separate Frontend + Backend:** Erhöht Komplexität ohne klaren Mehrwert im Pilot
