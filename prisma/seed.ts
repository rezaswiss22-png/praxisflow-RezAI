/**
 * ============================================================
 * SEED – SYNTHETISCHE PILOTDATEN
 * ============================================================
 * Erzeugt ausschliesslich FANTASIE-/TESTDATEN (keine echten
 * Personen, keine echten Kontaktdaten). Dient dem Pilotbetrieb
 * und Demonstrationszwecken.
 * ============================================================
 */
import { PrismaClient, type Priority, type EingangStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TENANT_SLUG = "praxisklinik-binningen";
const PASSWORT = "Pilot2026!";

/** Deterministischer Pseudo-Zufall für reproduzierbare Seeds. */
let seedState = 42;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function tageVersetzt(basis: Date, tage: number): Date {
  const d = new Date(basis);
  d.setDate(d.getDate() + tage);
  return d;
}

async function main() {
  console.log("🌱 Seed startet (synthetische Pilotdaten) …");

  // Aufräumen (idempotenter Seed)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.integrationEvent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.kommentar.deleteMany(),
    prisma.freigabe.deleteMany(),
    prisma.task.deleteMany(),
    prisma.callback.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.document.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.vorgang.deleteMany(),
    prisma.eingang.deleteMany(),
    prisma.consent.deleteMany(),
    prisma.retentionPolicy.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.integrationAdapter.deleteMany(),
    prisma.vorgangCategory.deleteMany(),
    prisma.channel.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.standort.deleteMany(),
    prisma.organisation.deleteMany(),
  ]);

  // 1) Organisation + Standort
  const org = await prisma.organisation.create({
    data: {
      name: "Praxisklinik Binningen AG",
      slug: TENANT_SLUG,
      plan: "pilot",
      status: "aktiv",
    },
  });
  const standort = await prisma.standort.create({
    data: {
      tenantId: org.id,
      name: "Hauptstandort Binningen",
      address: "Hauptstrasse 12, 4102 Binningen",
      phone: "+41 61 000 00 00",
      email: "empfang@praxisflow.test",
    },
  });

  // 2) Benutzer (5 Rollen)
  const hash = await bcrypt.hash(PASSWORT, 10);
  const users = await Promise.all(
    [
      { email: "dr.mueller@praxisflow.test", name: "Dr. med. Sandra Müller", vorname: "Sandra", role: "ARZT" as const, kuerzel: "SM" },
      { email: "empfang@praxisflow.test", name: "Nadia Rossi", vorname: "Nadia", role: "MPA_EMPFANG" as const, kuerzel: "NR" },
      { email: "leitung@praxisflow.test", name: "Thomas Berger", vorname: "Thomas", role: "PRAXISLEITUNG" as const, kuerzel: "TB" },
      { email: "personal@praxisflow.test", name: "Petra Frei", vorname: "Petra", role: "PERSONAL" as const, kuerzel: "PF" },
      { email: "admin@praxisflow.test", name: "System Administrator", vorname: "System", role: "SYSADMIN" as const, kuerzel: "SA" },
    ].map((u) =>
      prisma.user.create({
        data: {
          tenantId: org.id,
          standortId: standort.id,
          email: u.email,
          name: u.name,
          vorname: u.vorname,
          kuerzel: u.kuerzel,
          passwordHash: hash,
          role: u.role,
          aktiv: true,
          status: "aktiv",
          emailVerified: new Date(),
        },
      }),
    ),
  );
  const arzt = users.find((u) => u.role === "ARZT")!;
  const mpa = users.find((u) => u.role === "MPA_EMPFANG")!;
  const leitung = users.find((u) => u.role === "PRAXISLEITUNG")!;

  // 3) Kanäle
  const channelDefs = [
    { name: "ESPAS Telefon", type: "ESPAS_PHONE" as const, adapterName: "ESPAS" },
    { name: "OneDoc Termine", type: "ONEDOC_APPOINTMENT" as const, adapterName: "ONEDOC" },
    { name: "HIN Mail", type: "HIN_EMAIL" as const, adapterName: "HIN" },
    { name: "E-Mail", type: "EMAIL" as const, adapterName: "EMAIL" },
    { name: "Labor", type: "LABOR" as const, adapterName: "LABOR" },
    { name: "Manuell", type: "MANUAL" as const, adapterName: null },
  ];
  const channels = await Promise.all(
    channelDefs.map((c) =>
      prisma.channel.create({
        data: { tenantId: org.id, name: c.name, type: c.type, adapterName: c.adapterName, isActive: true },
      }),
    ),
  );
  const channelByType = Object.fromEntries(channels.map((c) => [c.type, c]));

  // 4) Vorgangs-Kategorien
  const kategorieDefs = [
    { name: "Rezeptanfrage", color: "#2563eb", isDefault: true },
    { name: "Terminanfrage", color: "#0891b2" },
    { name: "Laborbefund", color: "#7c3aed" },
    { name: "Überweisung", color: "#16a34a" },
    { name: "Rückrufbitte", color: "#d97706" },
    { name: "Administratives", color: "#64748b" },
  ];
  const kategorien = await Promise.all(
    kategorieDefs.map((k) =>
      prisma.vorgangCategory.create({
        data: { tenantId: org.id, name: k.name, color: k.color, isDefault: k.isDefault ?? false },
      }),
    ),
  );

  // 5) Integrationsadapter (7, alle MOCK)
  const adapterDefs = [
    { key: "ESPAS", name: "ESPAS (Telefon)" },
    { key: "ONEDOC", name: "OneDoc (Termine)" },
    { key: "HIN", name: "HIN (Secure Mail)" },
    { key: "EMAIL", name: "E-Mail" },
    { key: "ROCKETHEALTH", name: "Rockethealth (Praxissoftware, nur-lesend)" },
    { key: "KALENDER", name: "Kalender (ICS Import/Export)" },
    { key: "LABOR", name: "Labor (Befunde/PDF)" },
  ];
  await Promise.all(
    adapterDefs.map((a, i) =>
      prisma.integrationAdapter.create({
        data: {
          tenantId: org.id,
          name: a.name,
          adapterType: a.key,
          isMock: true,
          status: i === 6 ? "FEHLER" : "AKTIV", // ein Adapter mit simuliertem Fehler
          lastHealthCheck: tageVersetzt(new Date(), -1),
        },
      }),
    ),
  );

  // 6) Patienten (30, inkl. 3 Dubletten)
  const vornamen = ["Anna", "Peter", "Laura", "Marco", "Sofia", "Luca", "Elena", "David", "Nina", "Jonas", "Sara", "Michael", "Lea", "Simon", "Maria"];
  const nachnamen = ["Meier", "Schmid", "Weber", "Keller", "Huber", "Baumann", "Frei", "Steiner", "Brunner", "Moser", "Widmer", "Graf"];
  const kantone = ["BS", "BL", "AG", "SO"];
  const consentStatuses = ["ERTEILT", "AUSSTEHEND", "WIDERRUFEN"] as const;

  const patienten: Awaited<ReturnType<typeof prisma.patient.create>>[] = [];
  for (let i = 0; i < 27; i++) {
    const vorname = pick(vornamen);
    const nachname = pick(nachnamen);
    const jahr = 1940 + Math.floor(rnd() * 65);
    const monat = 1 + Math.floor(rnd() * 12);
    const tag = 1 + Math.floor(rnd() * 28);
    const p = await prisma.patient.create({
      data: {
        tenantId: org.id,
        patientenNummer: `P-${(1000 + i).toString()}`,
        firstName: vorname,
        lastName: nachname,
        dateOfBirth: new Date(Date.UTC(jahr, monat - 1, tag)),
        gender: pick(["w", "m", "d"]),
        kanton: pick(kantone),
        sprache: "de",
        status: "aktiv",
        consentStatus: pick([...consentStatuses]),
      },
    });
    patienten.push(p);
  }
  // 3 Dubletten (gleiche Person, leicht abweichend)
  for (let i = 0; i < 3; i++) {
    const orig = patienten[i];
    const dup = await prisma.patient.create({
      data: {
        tenantId: org.id,
        patientenNummer: `P-${(2000 + i).toString()}`,
        firstName: orig.firstName,
        lastName: orig.lastName,
        dateOfBirth: orig.dateOfBirth,
        kanton: orig.kanton,
        sprache: "de",
        status: "aktiv",
        consentStatus: "AUSSTEHEND",
        duplicateOfId: orig.id,
      },
    });
    patienten.push(dup);
  }

  // Consents zu einigen Patienten
  for (const p of patienten.slice(0, 15)) {
    await prisma.consent.create({
      data: {
        tenantId: org.id,
        patientId: p.id,
        type: "datenbearbeitung",
        status: p.consentStatus,
        legalBasis: "Einwilligung (Pilot, synthetisch)",
        grantedAt: p.consentStatus === "ERTEILT" ? tageVersetzt(new Date(), -30) : null,
      },
    });
  }

  // 7) Eingänge (50) über alle Kanäle
  const heute = new Date();
  const eingangStatuses: EingangStatus[] = ["NEU", "IN_BEARBEITUNG", "ZUGEORDNET", "ABGESCHLOSSEN", "FEHLER"];
  const betreffe = [
    "Rezept-Wiederholung Blutdruckmedikament",
    "Terminverschiebung nächste Woche",
    "Laborbefund Blutbild",
    "Überweisung Kardiologie",
    "Rückrufbitte wegen Befund",
    "Frage zur Rechnung",
    "Dringend: starke Schmerzen",
    "Adressänderung",
  ];

  const kanalPlan: { type: string; anzahl: number }[] = [
    { type: "ESPAS_PHONE", anzahl: 12 },
    { type: "ONEDOC_APPOINTMENT", anzahl: 10 },
    { type: "HIN_EMAIL", anzahl: 8 },
    { type: "EMAIL", anzahl: 8 },
    { type: "LABOR", anzahl: 5 },
    { type: "MANUAL", anzahl: 4 },
    { type: "EMAIL", anzahl: 3 }, // 3 Fehler-Events
  ];

  const eingaenge: Awaited<ReturnType<typeof prisma.eingang.create>>[] = [];
  let eingangIdx = 0;
  for (const plan of kanalPlan) {
    const istFehlerBlock = plan === kanalPlan[kanalPlan.length - 1];
    for (let i = 0; i < plan.anzahl; i++) {
      const ch = channelByType[plan.type];
      const zugeordnet = rnd() > 0.5;
      const patient = zugeordnet ? pick(patienten) : null;
      const conf = 0.45 + rnd() * 0.5; // 0.45–0.95
      const status: EingangStatus = istFehlerBlock ? "FEHLER" : pick(eingangStatuses.filter((s) => s !== "FEHLER"));
      const e = await prisma.eingang.create({
        data: {
          tenantId: org.id,
          channelId: ch.id,
          patientId: patient?.id ?? null,
          subject: `[MOCK] ${pick(betreffe)}`,
          body: "Synthetischer Testinhalt aus Mock-Adapter. Keine echten Patientendaten.",
          senderName: patient ? `${patient.firstName} ${patient.lastName}` : pick(["Unbekannt", "Praxis Dr. Weber", "Labor Basel"]),
          senderContact: pick(["+41 61 111 22 33", "info@example.test", "labor@example.test"]),
          status,
          attachmentCount: plan.type === "LABOR" ? 1 : 0,
          createdAt: tageVersetzt(heute, -Math.floor(rnd() * 14)),
          aiSuggestion: {
            kategorie: pick(["Rezeptanfrage", "Terminanfrage", "Laborbefund", "Überweisung", "Rückrufbitte", "Administratives"]),
            confidence: Number(conf.toFixed(2)),
            reasoning: "Regelbasierte Kategorisierung anhand von Schlüsselwörtern.",
            modelVersion: "rule-based-v1",
          },
        } as never,
      });
      eingaenge.push(e);
      eingangIdx++;
    }
  }

  // 8) Vorgänge (>=15)
  const prioritaeten: Priority[] = ["URGENT", "HOCH", "MITTEL", "NIEDRIG"];
  const vorgangStatuses = ["OFFEN", "IN_BEARBEITUNG", "WARTET", "FREIGABE_ERFORDERLICH", "ABGESCHLOSSEN"] as const;
  const vorgaenge: Awaited<ReturnType<typeof prisma.vorgang.create>>[] = [];
  for (let i = 0; i < 18; i++) {
    const patient = rnd() > 0.3 ? pick(patienten) : null;
    const assignee = rnd() > 0.3 ? pick([arzt, mpa, leitung]) : null;
    const v = await prisma.vorgang.create({
      data: {
        tenantId: org.id,
        nummer: `V-2026-${(100 + i).toString()}`,
        title: pick(betreffe),
        description: "Synthetischer Vorgang (Pilot).",
        patientId: patient?.id ?? null,
        categoryId: pick(kategorien).id,
        priority: pick(prioritaeten),
        status: pick([...vorgangStatuses]),
        assignedTo: assignee?.id ?? null,
        dueDate: rnd() > 0.4 ? tageVersetzt(heute, Math.floor(rnd() * 10) - 3) : null,
      },
    });
    vorgaenge.push(v);
  }

  // 9) Aufgaben (>=20)
  const taskStatuses = ["OFFEN", "IN_BEARBEITUNG", "ERLEDIGT", "ABGEBROCHEN"] as const;
  for (let i = 0; i < 24; i++) {
    const assignee = pick([arzt, mpa, leitung]);
    const status = pick([...taskStatuses]);
    await prisma.task.create({
      data: {
        tenantId: org.id,
        vorgangId: rnd() > 0.3 ? pick(vorgaenge).id : null,
        title: pick(["Rezept prüfen", "Patient anrufen", "Befund ablegen", "Termin bestätigen", "Überweisung erstellen"]),
        description: "Synthetische Aufgabe (Pilot).",
        assignedTo: assignee.id,
        assignedBy: leitung.id,
        priority: pick(prioritaeten),
        status,
        dueDate: tageVersetzt(heute, Math.floor(rnd() * 12) - 4),
        completedAt: status === "ERLEDIGT" ? tageVersetzt(heute, -Math.floor(rnd() * 3)) : null,
        completedBy: status === "ERLEDIGT" ? assignee.id : null,
      },
    });
  }

  // 10) Termine (>=10)
  const apptStatuses = ["GEPLANT", "BESTAETIGT", "ABGESAGT", "UMGEPLANT", "ERFOLGT"] as const;
  for (let i = 0; i < 14; i++) {
    const start = tageVersetzt(heute, Math.floor(rnd() * 14) - 3);
    start.setHours(8 + Math.floor(rnd() * 8), rnd() > 0.5 ? 30 : 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    await prisma.appointment.create({
      data: {
        tenantId: org.id,
        standortId: standort.id,
        patientId: pick(patienten).id,
        providerId: arzt.id,
        title: pick(["Konsultation", "Kontrolle", "Impfung", "Besprechung Befund"]),
        startAt: start,
        endAt: end,
        status: pick([...apptStatuses]),
        location: "Hauptstandort Binningen",
        onedocId: rnd() > 0.5 ? `ONEDOC-${1000 + i}` : null,
      },
    });
  }

  // 11) Rückrufe (>=8)
  const callbackStatuses = ["AUSSTEHEND", "GEPLANT", "ERLEDIGT", "ABGEBROCHEN"] as const;
  for (let i = 0; i < 10; i++) {
    const status = pick([...callbackStatuses]);
    await prisma.callback.create({
      data: {
        tenantId: org.id,
        patientId: pick(patienten).id,
        requestedBy: mpa.id,
        phone: "+41 61 111 22 33",
        reason: pick(["Befundbesprechung", "Rezeptfrage", "Terminwunsch"]),
        assignedTo: pick([arzt, mpa]).id,
        status,
        scheduledAt: status !== "AUSSTEHEND" ? tageVersetzt(heute, Math.floor(rnd() * 5)) : null,
        completedAt: status === "ERLEDIGT" ? heute : null,
      },
    });
  }

  // 12) Audit-Logs (>=30)
  const auditActions = ["VIEW", "CREATE", "UPDATE", "LOGIN", "APPROVE", "EXPORT"] as const;
  for (let i = 0; i < 35; i++) {
    await prisma.auditLog.create({
      data: {
        tenantId: org.id,
        userId: pick(users).id,
        action: pick([...auditActions]),
        resource: pick(["patient", "vorgang", "aufgabe", "eingang", "dokument"]),
        resourceId: pick(vorgaenge).id,
        result: "erfolg",
        ipAddress: "127.0.0.1",
        userAgent: "seed-script",
        createdAt: tageVersetzt(heute, -Math.floor(rnd() * 20)),
      },
    });
  }

  console.log("✅ Seed abgeschlossen:");
  console.log(`   Organisation: ${org.name}`);
  console.log(`   Benutzer: ${users.length} (Passwort: ${PASSWORT})`);
  console.log(`   Patienten: ${patienten.length} (inkl. 3 Dubletten)`);
  console.log(`   Eingänge: ${eingaenge.length}`);
  console.log(`   Vorgänge: ${vorgaenge.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
