# 🔗 Guía de Integración Backend A.R.C.A-LLM

## 📦 Repositorios

### Backend
- **Repo**: https://github.com/infantesromeroadrian/A.R.C.A-LLM
- **Local**: `../backend/` (o `../A.R.C.A-LLM/` si está en ese directorio)
- **Puerto**: 8000
- **Tecnología**: Python + FastAPI

### Frontend
- **Repo**: https://github.com/nacho995/msmk-voice-assistant
- **Local**: `./` (este directorio - frontend/)
- **Puerto**: 3000
- **Tecnología**: HTML + CSS + JavaScript puro

## 🚀 Ejecutar Ambos Servicios

### Terminal 1: Backend (Python)

```bash
# Opción 1: Con Docker
cd ../backend  # o cd ../A.R.C.A-LLM si está ahí
docker-compose up

# Opción 2: Python directo (sin Docker)
cd ../backend  # o cd ../A.R.C.A-LLM si está ahí
python -m venv arca-venv

# Windows
arca-venv\Scripts\activate

# macOS/Linux
source arca-venv/bin/activate

pip install -r requirements.txt
python run_arca.py
```

### Terminal 2: Frontend

```bash
# Desde este directorio (frontend/)
cd frontend

# Opción 1: Con npm (recomendado)
npm install  # Solo la primera vez
npm start

# Opción 2: Con Python (sin npm)
python3 -m http.server 3000

# Opción 3: Con npx (sin instalar)
npx http-server -p 3000
```

## ✅ Verificar que Todo Funciona

### 1. Health Check del Backend

```bash
curl http://localhost:8000/api/health
```

Debe retornar:
```json
{
  "status": "healthy",
  "service": "A.R.C.A LLM Voice Assistant"
}
```

### 2. Abrir Frontend

Abre tu navegador en: **http://localhost:3000**

### 3. Probar Integración

1. Abre DevTools (F12)
2. Click en el orbe
3. Hablar: "Hola, cómo estás?"
4. Click de nuevo para enviar
5. Ver en Console:
   - Usuario: "Hola, cómo estás?"
   - A.R.C.A: "[respuesta del LLM]"

## 📊 Flujo Completo

```
[Usuario click orbe]
    ↓
[Captura audio con MediaRecorder]
    ↓
[Usuario click de nuevo]
    ↓
[POST audio → http://localhost:8000/api/voice/process]
    ↓
[Backend: STT → LLM → TTS]
    ↓
[Response: audio WAV + headers con texto]
    ↓
[Frontend: Reproduce audio + Anima orbe]
    ↓
[Audio termina → Orbe se desactiva]
```

## 🔧 Variables de Configuración

### Frontend
El backend está configurado en `js/backend-integration.js`:

```javascript
const CONFIG = {
    BACKEND_URL: 'http://localhost:8000',
    AUDIO_FORMAT: 'audio/webm',
    MIN_RECORDING_TIME: 500, // ms
    MAX_RECORDING_TIME: 30000, // ms
    RETRY_ATTEMPTS: 3
};
```

### Backend
Ver archivo `.env` en `../backend/` (o `../A.R.C.A-LLM/`):

```env
LM_STUDIO_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=qwen/qwen3-4b-2507
WHISPER_MODEL=tiny
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

## 🐛 Troubleshooting

### Backend no inicia
- Verifica que Python 3.8+ esté instalado
- Revisa que LM Studio esté corriendo (puerto 1234)
- Revisa logs en `../backend/logs/` (o `../A.R.C.A-LLM/logs/`)

### Frontend no conecta con backend
- Verifica que backend esté en puerto 8000: `curl http://localhost:8000/api/health`
- Revisa CORS en configuración del backend
- Revisa consola del navegador (F12) para errores

### Micrófono no funciona
- Permite acceso en configuración del navegador
- Usa `localhost` (no `127.0.0.1` o IP)
- Verifica permisos del sistema operativo

## 📚 Más Información

- **Backend API Docs**: http://localhost:8000/docs (cuando backend esté corriendo)
- **Backend Repo**: https://github.com/infantesromeroadrian/A.R.C.A-LLM

