# ========================================
# A.R.C.A LLM - Dockerfile
# ========================================
# Imagen optimizada para asistente de voz
# Python 3.11 (compatible con todas las dependencias)
# ========================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="A.R.C.A LLM Project"
LABEL description="Advanced Reasoning Cognitive Architecture - Voice Assistant"
LABEL version="1.0.0"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    gcc \
    g++ \
    make \
    # Audio processing
    portaudio19-dev \
    libportaudio2 \
    libportaudiocpp0 \
    ffmpeg \
    espeak \
    libespeak-dev \
    # System utilities
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements primero (para aprovechar cache de Docker)
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorios para cache y datos
RUN mkdir -p /app/models/hf_cache \
    /app/models/tts_cache \
    /app/logs \
    && chmod -R 755 /app/models /app/logs

# Exponer puerto
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Usuario no-root (seguridad)
RUN useradd -m -u 1000 arca && \
    chown -R arca:arca /app
USER arca

# Comando de inicio
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

