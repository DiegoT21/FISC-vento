#!/usr/bin/env bash
# Restaura un backup generado por backup_db.sh. ÚSALO CON CUIDADO: borra
# todo lo que haya en la base de datos actual antes de restaurar.
#
# Uso: ./scripts/restore_db.sh backups/fiscvento_20261001_120000.sql.gz

set -euo pipefail

cd "$(dirname "$0")/.."

ARCHIVO="${1:?Uso: ./scripts/restore_db.sh <archivo .sql.gz>}"

if [ ! -f "$ARCHIVO" ]; then
  echo "No existe el archivo: $ARCHIVO" >&2
  exit 1
fi

POSTGRES_DB=$(grep -E '^POSTGRES_DB=' backend/.env | cut -d= -f2-)
POSTGRES_USER=$(grep -E '^POSTGRES_USER=' backend/.env | cut -d= -f2-)

echo "Esto va a BORRAR y reemplazar la base '$POSTGRES_DB' con el contenido de $ARCHIVO"
read -r -p "¿Continuar? (escribí 'si' para confirmar) " confirmacion
if [ "$confirmacion" != "si" ]; then
  echo "Cancelado."
  exit 1
fi

if sudo docker ps --filter status=running --filter label=com.docker.compose.service=db \
  --format '{{.Label "com.docker.compose.project.config_files"}}' 2>/dev/null \
  | grep -q 'docker-compose.prod.yml'; then
  COMPOSE=(sudo docker compose -f docker-compose.prod.yml)
else
  COMPOSE=(sudo docker compose)
fi
gunzip -c "$ARCHIVO" | "${COMPOSE[@]}" exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restauración completa."
