#!/bin/sh
# ============================================================
# PRAXISFLOW AI – Docker Entrypoint
# PILOT: Ausschliesslich synthetische Testdaten
# ------------------------------------------------------------
# Ablauf:
#   1. Auf Datenbank warten
#   2. Prisma-Migrationen anwenden (migrate deploy)
#   3. Optional: synthetische Seed-Daten laden (RUN_SEED=true)
#   4. Anwendung starten (CMD)
# ============================================================
set -e

echo "==> PraxisFlow AI Container-Start (PILOTUMGEBUNG – nur synthetische Daten)"

# ------------------------------------------------------------
# 1. Auf die Datenbank warten
# ------------------------------------------------------------
if [ -n "$DATABASE_URL" ]; then
  echo "==> Warte auf Datenbank ..."
  # Host/Port aus DATABASE_URL extrahieren (postgresql://user:pass@host:port/db)
  DB_HOSTPORT=$(echo "$DATABASE_URL" | sed -E 's#.*@([^/]+)/.*#\1#')
  DB_HOST=$(echo "$DB_HOSTPORT" | cut -d: -f1)
  DB_PORT=$(echo "$DB_HOSTPORT" | cut -d: -f2)
  [ -z "$DB_PORT" ] && DB_PORT=5432

  i=0
  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -gt 60 ]; then
      echo "!! Datenbank ($DB_HOST:$DB_PORT) nicht erreichbar – Abbruch."
      exit 1
    fi
    echo "   ... Datenbank noch nicht bereit ($DB_HOST:$DB_PORT), warte 2s (Versuch $i/60)"
    sleep 2
  done
  echo "==> Datenbank erreichbar ($DB_HOST:$DB_PORT)."
fi

# ------------------------------------------------------------
# 2. Migrationen anwenden
# ------------------------------------------------------------
echo "==> Wende Prisma-Migrationen an (prisma migrate deploy) ..."
npx prisma migrate deploy

# ------------------------------------------------------------
# 3. Optionaler Seed
# ------------------------------------------------------------
if [ "$RUN_SEED" = "true" ]; then
  echo "==> Lade synthetische Seed-Daten (RUN_SEED=true) ..."
  npx tsx prisma/seed.ts || echo "!! Seed übersprungen/fehlgeschlagen (nicht kritisch)."
fi

echo "==> Starte Anwendung: $*"
exec "$@"
