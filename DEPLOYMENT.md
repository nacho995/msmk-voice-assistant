# 🚀 Guía de Despliegue

Guía completa para desplegar MSMK Voice Assistant.

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- LM Studio corriendo en `http://127.0.0.1:1234`
- Modelo LLM cargado en LM Studio
- Mínimo 8GB de RAM disponible

## 🐳 Despliegue con Docker

### Opción 1: Script Automático

```bash
./start.sh
```

### Opción 2: Manual

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
LM_STUDIO_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=qwen/qwen3-4b-2507
WHISPER_MODEL=tiny
API_PORT=8000
```

### Puertos

- Frontend: `3000`
- Backend API: `8000`

## 📊 Verificación

1. **Health Check del Backend:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Abrir Frontend:**
   - Navegador: http://localhost:3000

3. **API Documentation:**
   - Swagger UI: http://localhost:8000/docs

## 🐛 Troubleshooting

### Error: "Cannot connect to LM Studio"
- Verifica que LM Studio esté corriendo
- Verifica que el modelo esté cargado
- En Docker, usa `host.docker.internal` en lugar de `127.0.0.1`

### Error: "Port already in use"
- Cambia los puertos en `docker-compose.yml`
- O detén otros servicios que usen esos puertos

### Error: "Out of memory"
- Reduce límites de recursos en `docker-compose.yml`
- Cierra otras aplicaciones

## 🔄 Actualización

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull

# Reconstruir e iniciar
docker-compose up --build -d
```

## 📦 Producción

Para producción, considera:

1. Usar un reverse proxy (nginx/traefik)
2. Configurar SSL/TLS
3. Usar variables de entorno seguras
4. Configurar backups de modelos
5. Monitoreo y logging

