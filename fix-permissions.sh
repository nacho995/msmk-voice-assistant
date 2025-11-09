#!/bin/bash
# ========================================
# Script para arreglar permisos de directorios
# ========================================

echo "🔧 Arreglando permisos de directorios..."

# Crear directorios si no existen
mkdir -p models/hf_cache models/tts_cache logs

# Dar permisos amplios (para desarrollo)
chmod -R 777 models logs 2>/dev/null || {
    echo "⚠️  No se pudieron cambiar permisos. Intenta con sudo:"
    echo "   sudo chmod -R 777 models logs"
    exit 1
}

echo "✅ Permisos arreglados"
echo ""
echo "Ahora puedes ejecutar:"
echo "   docker-compose up --build"

