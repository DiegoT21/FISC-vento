# Dos targets:
#   dev  — Vite (puerto 5173), lo usa docker-compose.yml. Es el target
#          por defecto de `docker build` para no cambiar el flujo local.
#   prod — build de Vite servido por Nginx. Lo usa docker-compose.prod.yml.
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vacío a propósito: el navegador llama a /api en el mismo origen y Nginx
# hace de proxy hacia Gunicorn. No leer frontend/.env (ahí está localhost).
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM nginx:1.27-alpine AS prod

COPY nginx/app.conf /etc/nginx/conf.d/default.conf
COPY nginx/proxy_params.conf /etc/nginx/proxy_params.conf
COPY nginx/snippets/app-locations.conf /etc/nginx/snippets/app-locations.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
