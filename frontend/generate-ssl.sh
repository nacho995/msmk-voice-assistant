#!/bin/bash
# ========================================
# Generar certificado SSL autofirmado
# ========================================

echo "🔐 Generando certificado SSL autofirmado..."

# Crear directorio para certificados (en frontend/ssl)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/ssl"
mkdir -p "$SSL_DIR"

# Detectar IP del servidor (puede ser pasado como argumento o detectado automáticamente)
SERVER_IP=${1:-"192.168.1.25"}

echo "📍 Usando IP del servidor: $SERVER_IP"

# Generar clave privada
openssl genrsa -out "$SSL_DIR/server.key" 2048

# Generar certificado autofirmado válido por 365 días
# Incluir tanto la IP como localhost para que funcione en ambos casos
openssl req -new -x509 -key "$SSL_DIR/server.key" -out "$SSL_DIR/server.crt" -days 365 \
    -subj "/CN=$SERVER_IP/O=MSMK Voice Assistant/C=ES" \
    -addext "subjectAltName=IP:$SERVER_IP,IP:127.0.0.1,DNS:localhost"

echo ""
echo "✅ Certificado SSL generado en $SSL_DIR/server.crt y $SSL_DIR/server.key"
echo "⚠️  Este es un certificado autofirmado. Tu navegador mostrará una advertencia de seguridad."
echo "   Haz clic en 'Avanzado' y luego 'Continuar' para aceptar el certificado."
echo ""
echo "📝 Para usar el certificado:"
echo "   1. Reconstruye la imagen: docker compose build frontend"
echo "   2. Reinicia los contenedores: docker compose up -d"
echo "   3. Accede a: https://$SERVER_IP:3443"

