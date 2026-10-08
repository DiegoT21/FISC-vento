# FISC-vento

Sistema centralizado de gestión y control de activos con captura
automatizada de datos (código de barras y RFID) para la Facultad de
Ingeniería de Sistemas Computacionales (FISC), Universidad Tecnológica de
Panamá.

Trabajo de graduación — Laura Saucedo y Diego Torres, Licenciatura en
Desarrollo y Gestión de Software, 2026.

## Estructura del repositorio

```
FISC-vento/
├── backend/    # Django + Django REST Framework, PostgreSQL
├── frontend/   # React + Vite, Tailwind CSS
├── docker-compose.yml        # desarrollo: Vite y runserver
├── docker-compose.prod.yml   # servidores: Nginx y Gunicorn
├── docker-compose.https.yml  # se suma al de producción cuando hay certificado
└── docs/                     # arquitectura, decisiones (ADRs)
```

Ver [`docs/arquitectura.md`](docs/arquitectura.md) para el detalle de cómo
se corresponden las apps del backend con las features del frontend, y
[`docs/decisiones/`](docs/decisiones/) para las decisiones de alcance ya
tomadas (RFID, Préstamos/Traslados como stretch goals).

## Desarrollo local

1. Copiar los `.env.example` (raíz, `backend/`, `frontend/`) a `.env` y
   ajustar valores si hace falta.
2. `docker compose up` levanta `db` (PostgreSQL), `backend` (Django en
   `:8000`) y `frontend` (Vite en `:5173`). Los servidores no usan este
   archivo: usan `docker compose -f docker-compose.prod.yml` (Nginx en
   el puerto 80, Gunicorn adentro). El detalle está en
   [`docs/arquitectura.md`](docs/arquitectura.md).
3. Backend: `cd backend && python manage.py migrate && python manage.py createsuperuser`.
4. Frontend: `cd frontend && npm install && npm run dev`.

## Pruebas de carga

```
locust -f backend/loadtests/locustfile.py --host http://localhost:8000
```

## Stack

Django · Django REST Framework · PostgreSQL · React · Vite · Tailwind CSS ·
Docker · Locust.
