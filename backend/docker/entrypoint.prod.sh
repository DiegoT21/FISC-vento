#!/bin/sh
# Arranque del backend en staging y producción: estáticos y Gunicorn.
# Las migraciones las corre el workflow de despliegue, no este script,
# para que un fallo de migrate no quede escondido dentro del restart.
set -eu

echo "DJANGO_DEBUG=${DJANGO_DEBUG:-default} DJANGO_SECURE_SSL=${DJANGO_SECURE_SSL:-default}"
echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear

workers="${GUNICORN_WORKERS:-2}"
timeout="${GUNICORN_TIMEOUT:-60}"

echo "Arrancando Gunicorn (${workers} workers)..."
exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:8000" \
    --workers "$workers" \
    --timeout "$timeout" \
    --access-logfile - \
    --error-logfile - \
    --capture-output
