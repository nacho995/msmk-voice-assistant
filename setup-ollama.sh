#!/bin/bash
# Script para configurar Ollama con el modelo qwen2.5:7b

set -e

echo "=========================================="
echo "🔧 Configurando Ollama para MSMK Voice Assistant"
echo "=========================================="
echo ""

# Verificar que Ollama está corriendo
echo "📡 Verificando que Ollama está corriendo..."
if ! curl -s http://localhost:1234/api/tags > /dev/null 2>&1; then
    echo "❌ Error: Ollama no está respondiendo en el puerto 1234"
    echo "   Asegúrate de que Ollama esté corriendo:"
    echo "   sudo systemctl restart ollama"
    exit 1
fi
echo "✅ Ollama está corriendo en el puerto 1234"
echo ""

# Verificar si el modelo ya está instalado
echo "🔍 Verificando modelos disponibles..."
MODELS=$(curl -s http://localhost:1234/api/tags | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join([m['name'] for m in data.get('models', [])]))" 2>/dev/null || echo "")

if echo "$MODELS" | grep -q "qwen2.5:7b"; then
    echo "✅ El modelo qwen2.5:7b ya está instalado"
    echo ""
    echo "Modelos disponibles:"
    echo "$MODELS" | sed 's/^/   - /'
else
    echo "📥 El modelo qwen2.5:7b no está instalado"
    echo "   Descargando modelo qwen2.5:7b..."
    echo ""
    
    # Intentar descargar el modelo (usando OLLAMA_HOST para el puerto 1234)
    export OLLAMA_HOST=http://localhost:1234
    if ollama pull qwen2.5:7b; then
        echo ""
        echo "✅ Modelo qwen2.5:7b descargado exitosamente"
    else
        echo ""
        echo "⚠️  No se pudo descargar qwen2.5:7b"
        echo "   Intentando con variantes alternativas..."
        echo ""
        
        # Intentar variantes comunes
        for variant in "qwen2.5-7b" "qwen2.5-7b-instruct" "qwen2.5:7b-instruct"; do
            echo "   Intentando: $variant"
            if ollama pull "$variant" 2>/dev/null; then
                echo ""
                echo "✅ Modelo $variant descargado exitosamente"
                echo ""
                echo "⚠️  IMPORTANTE: Actualiza docker-compose.yml con el nombre: $variant"
                exit 0
            fi
        done
        
        echo ""
        echo "❌ No se pudo descargar ninguna variante del modelo"
        echo "   Verifica el nombre del modelo en: https://ollama.com/library"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "✅ Configuración completada"
echo "=========================================="
echo ""
echo "El modelo está listo para usar con:"
echo "  LM_STUDIO_URL: http://host.docker.internal:1234/v1"
echo "  LM_STUDIO_MODEL: qwen2.5:7b"
echo ""

