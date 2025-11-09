#
# Dockerfile de despliegue para el frontend de MSMK Voice Assistant.
#
# Etapa base con dependencias necesarias para ejecutar pruebas.
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Etapa de pruebas: ejecuta la suite de Jest para asegurar calidad.
FROM base AS test
COPY frontend ./frontend
ENV CI=true
RUN npm test -- --runInBand

# Imagen final mínima usando Nginx para servir contenido estático.
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.source="https://github.com/infantesromeroadrian/A.R.C.A-LLM"
COPY --from=test /app/frontend /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

