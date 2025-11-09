#!/bin/bash
# ========================================
# Script de inicio rápido
# ========================================

echo "🚀 Iniciando MSMK Voice Assistant..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar docker-compose (priorizar plugin v2 sobre comando antiguo)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Usando docker compose (plugin v2)"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "⚠️  Usando docker-compose (v1 - considera actualizar a Docker Desktop)"
else
    echo "❌ docker-compose no está instalado. Por favor instala Docker Desktop."
    exit 1
fi

# Verificar que LM Studio esté corriendo (opcional)
echo "ℹ️  Asegúrate de tener LM Studio corriendo en http://127.0.0.1:1234"
echo ""

# Limpiar contenedores antiguos si existen
echo "🧹 Limpiando contenedores antiguos..."
$DOCKER_COMPOSE down 2>/dev/null || true

# Limpiar contenedores huérfanos por nombre
echo "🧹 Limpiando contenedores huérfanos..."
docker rm -f msmk-backend msmk-frontend 2>/dev/null || true

# Verificar y liberar puerto 8000 si está en uso
echo "🔍 Verificando puerto 8000..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti :8000 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "⚠️  Puerto 8000 en uso por PID $PID. Deteniendo..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
elif command -v netstat &> /dev/null; then
    PID=$(netstat -tulpn 2>/dev/null | grep :8000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PID" ]; then
        echo "⚠️  Puerto 8000 en uso por PID $PID. Deteniendo..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
fi

# Limpiar archivos ._* de macOS (pueden causar problemas en volúmenes externos)
echo "🧹 Limpiando archivos de metadatos de macOS..."
find . -name "._*" -type f -delete 2>/dev/null || true

# Construir e iniciar (desactivar BuildKit para evitar problemas con xattr en volúmenes externos)
echo "📦 Construyendo imágenes Docker..."
export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0
$DOCKER_COMPOSE build

echo ""
echo "🚀 Iniciando servicios..."
$DOCKER_COMPOSE up -d

echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📱 Acceso:"
echo "   Frontend: http://localhost:3000 (HTTP) o https://localhost:3443 (HTTPS)"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Ver logs: $DOCKER_COMPOSE logs -f"
echo "🛑 Detener: $DOCKER_COMPOSE down"

