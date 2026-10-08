# Dos targets:
#   dev  — runserver, lo usa docker-compose.yml (es el target por defecto)
#   prod — Gunicorn, lo usa docker-compose.prod.yml
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/

FROM base AS prod

RUN pip install --no-cache-dir -r requirements/prod.txt

COPY . .
RUN chmod +x docker/entrypoint.prod.sh

ENV DJANGO_SETTINGS_MODULE=config.settings.prod

EXPOSE 8000

CMD ["docker/entrypoint.prod.sh"]

FROM base AS dev

ARG REQUIREMENTS_FILE=requirements/dev.txt
RUN pip install --no-cache-dir -r ${REQUIREMENTS_FILE}

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
