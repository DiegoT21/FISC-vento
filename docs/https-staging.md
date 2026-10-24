# HTTPS en staging (para poder instalar la PWA)

Staging hoy responde en `http://3.149.4.52/` y en el puerto `5173`. Una PWA solo se instala en un contexto seguro: `localhost` o HTTPS. En esa IP por HTTP el sitio sigue funcionando, el lector de barras también, pero Chrome no registra el service worker y no ofrece «Instalar app».

No actives nada de esto hasta cerrar las decisiones de abajo. Este archivo no despliega ni toca el servidor.

## Qué ya está en el repositorio

- `docker-compose.prod.yml` publica el 80 (y el 5173 hacia el mismo Nginx), monta el reto de Let's Encrypt y deja Certbot en el perfil `certbot`.
- `docker-compose.https.yml` publica el 443, monta el volumen de certificados (solo lectura) y sustituye la config HTTP por una redirección a HTTPS. El reto `/.well-known/acme-challenge/` sigue por el puerto 80.
- `frontend/nginx/ssl.conf.example` es el server TLS (1.2 y 1.3). Hay que copiarlo en el servidor a `frontend/nginx/ssl.conf` (está en `.gitignore`).
- Los `.pem` viven en el volumen Docker `letsencrypt`. No van al repositorio.
- `scripts/preparar_env_produccion.sh` deja `DJANGO_SECURE_SSL=0` si nadie lo definió, para que el sitio no redirija a HTTPS antes de tener certificado.

Si levantas `docker-compose.https.yml` sin `ssl.conf`, Docker crea una carpeta con ese nombre y Nginx no arranca.

## Qué falta decidir

1. **Dominio de staging.** Let's Encrypt no emite un certificado de confianza para una IP pelada. Hace falta un nombre (por ejemplo `staging.algo.utp.ac.pa`) y un registro DNS `A` hacia `3.149.4.52`. Producción debería llevar otro nombre, no el mismo certificado.
2. **Correo** del aviso de vencimiento de Let's Encrypt (no se commitea).
3. **Quién abre TCP 443** en el grupo de seguridad de staging. El 80 tiene que seguir abierto: por ahí entra el reto y la redirección.
4. **Puerto 5173.** Hoy el equipo entra por `http://3.149.4.52:5173/`. Ese puerto llega al mismo Nginx que el 80. Con la redirección, esa URL pasa a `https://<el host>/` (el 443: `$host` no incluye el puerto). Cuando HTTPS esté activo, la dirección de trabajo pasa a ser el dominio. Hasta entonces no sumes el compose de HTTPS: el smoke de GitHub pide `http://<host>:5173/` y sigue la redirección; si el 443 no responde, el pipeline falla.
5. **`DJANGO_SECURE_SSL`.** Tiene que seguir en `0` hasta que el certificado ya responda. En `1` sin TLS el sitio redirige y queda inaccesible. El script de despliegue no pisa el valor si ya lo cambiaste.

## Pasos (en el servidor, cuando lo anterior esté decidido)

1. DNS `A` del dominio de staging hacia `3.149.4.52`. Comprobar que resuelve antes de pedir el certificado.
2. Abrir TCP 443.
3. Con el stack de producción ya arriba (`docker-compose.prod.yml`, sin el override de HTTPS):

   ```bash
   sudo docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot \
     certonly --webroot -w /var/www/certbot \
     --email correo@ejemplo.com --agree-tos --no-eff-email \
     -d staging.ejemplo.utp.ac.pa
   ```

4. En el servidor, copiar `frontend/nginx/ssl.conf.example` a `frontend/nginx/ssl.conf` y cambiar `app.fisc.example` por el dominio, en `server_name` y en las dos rutas `ssl_certificate`.
5. En `backend/.env` de ese servidor (no en git): `DJANGO_SECURE_SSL=1`, `DJANGO_ALLOWED_HOSTS=<dominio>`, `DJANGO_CSRF_TRUSTED_ORIGINS=https://<dominio>` y `DJANGO_CORS_ALLOWED_ORIGINS=https://<dominio>`.
6. Levantar el override:

   ```bash
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.https.yml up -d
   ```

7. Comprobar en el celular o en el Zebra, por `https://<dominio>/`: el navegador ofrece instalar, o aparece el aviso «Instalar app». El campo de escaneo sigue recibiendo el lector como teclado.
8. Renovar (no hay cron en el repo; hay que dejarlo en el servidor, una vez al día basta):

   ```bash
   sudo docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot renew
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.https.yml exec frontend nginx -s reload
   ```

Let's Encrypt avisa cuando falta menos de un mes. Los `.pem` no se copian al repositorio.

El detalle de cookies, HSTS y el smoke que sigue a la redirección está en `docs/arquitectura.md` (sección HTTPS) y en `docs/seguridad.md`.
