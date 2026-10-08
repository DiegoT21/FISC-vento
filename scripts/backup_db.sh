#!/usr/bin/env bash
# Backup diario de la base de datos Postgres (vía el contenedor `db`).
# Pensado para correr por cron en cada servidor (staging y producción
# tienen cada uno su propia base, cada uno corre esto de forma
# independiente). Si el stack de producción está arriba, usa
# docker-compose.prod.yml; si no, el compose de desarrollo.
#
# Uso: ./scripts/backup_db.sh
# Variables de entorno opcionales:
#   BACKUP_DIR     carpeta donde guardar los dumps (default: ~/FISC-vento/backups)
#   RETENCION_DIAS cuántos días de backups conservar (default: 7)

set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-$HOME/FISC-vento/backups}"
RETENCION_DIAS="${RETENCION_DIAS:-7}"
FECHA="$(date +%Y%m%d_%H%M%S)"
ARCHIVO="$BACKUP_DIR/fiscvento_${FECHA}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Lee las credenciales del backend/.env del propio servidor (nunca están
# en git) para no tener que repetirlas acá.
POSTGRES_DB=$(grep -E '^POSTGRES_DB=' backend/.env | cut -d= -f2-)
POSTGRES_USER=$(grep -E '^POSTGRES_USER=' backend/.env | cut -d= -f2-)

if sudo docker ps --filter status=running --filter label=com.docker.compose.service=db \
  --format '{{.Label "com.docker.compose.project.config_files"}}' 2>/dev/null \
  | grep -q 'docker-compose.prod.yml'; then
  COMPOSE=(sudo docker compose -f docker-compose.prod.yml)
else
  COMPOSE=(sudo docker compose)
fi
"${COMPOSE[@]}" exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$ARCHIVO"

echo "Backup creado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

# Rotación: borrar backups más viejos que RETENCION_DIAS.
find "$BACKUP_DIR" -name 'fiscvento_*.sql.gz' -mtime "+${RETENCION_DIAS}" -delete

echo "Backups actuales en $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"
