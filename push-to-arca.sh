#!/bin/bash

# ========================================
# Script para subir frontend a A.R.C.A-LLM
# ========================================

set -e  # Salir si hay errores

echo "🚀 Preparando para subir frontend a A.R.C.A-LLM..."

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "frontend-mejorado" ]; then
    echo "⚠️  No estás en la rama 'frontend-mejorado'"
    echo "   Cambiando a la rama..."
    git checkout frontend-mejorado
fi

# Añadir remoto si no existe
if ! git remote | grep -q "arca"; then
    echo "📦 Añadiendo remoto 'arca'..."
    git remote add arca https://github.com/infantesromeroadrian/A.R.C.A-LLM.git
else
    echo "✅ Remoto 'arca' ya existe"
fi

# Verificar estado
echo ""
echo "📊 Estado actual:"
git status -sb

# Añadir todos los cambios
echo ""
echo "📝 Añadiendo cambios..."
git add .

# Hacer commit si hay cambios
if ! git diff --cached --quiet; then
    echo ""
    read -p "💬 Mensaje de commit (Enter para usar default): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="feat: frontend mejorado con integración completa a A.R.C.A-LLM"
    fi
    git commit -m "$COMMIT_MSG"
else
    echo "✅ No hay cambios para commitear"
fi

# Subir a la rama frontend-mejorado
echo ""
echo "⬆️  Subiendo a A.R.C.A-LLM (rama: frontend-mejorado)..."
git push arca frontend-mejorado:frontend-mejorado

echo ""
echo "✅ ¡Frontend subido exitosamente!"
echo ""
echo "🔗 Siguiente paso:"
echo "   1. Ve a https://github.com/infantesromeroadrian/A.R.C.A-LLM"
echo "   2. Crea un Pull Request desde 'frontend-mejorado' a 'main'"
echo ""

