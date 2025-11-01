# 🔗 Backend Integration Guide - A.R.C.A LLM

Guía para integrar el backend A.R.C.A-LLM con el frontend MSMK Voice Assistant.

---

## 📦 Repositorios

### Backend
- **Repo**: https://github.com/infantesromeroadrian/A.R.C.A-LLM
- **Local**: `../A.R.C.A-LLM/`
- **Puerto**: 8000
- **Tecnología**: Python + FastAPI

### Frontend
- **Repo**: https://github.com/nacho995/msmk-voice-assistant
- **Local**: `./` (este directorio)
- **Puerto**: Abrir directamente con Live Server o http-server
- **Tecnología**: HTML + CSS + JavaScript puro

---

## 🎯 Puntos de Integración

### 1. API Endpoint Principal

**Backend URL**: `http://localhost:8000/api/voice/process`

**Request**:
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'voice.webm');
formData.append('conversation_id', conversationId); // Optional

const response = await fetch('http://localhost:8000/api/voice/process', {
  method: 'POST',
  body: formData
});
```

**Response**:
- **Body**: Audio WAV (binary)
- **Headers**:
  - `X-Conversation-Id`: UUID (Base64)
  - `X-Transcribed-Text`: Texto transcrito (Base64)
  - `X-Response-Text`: Respuesta del LLM (Base64)

---

## 🔧 Cambios Necesarios en `script.js`

### Paso 1: Configurar URL del Backend

Agregar al inicio del archivo:

```javascript
// Configuración del backend
const BACKEND_URL = 'http://localhost:8000';
const API_VOICE_ENDPOINT = `${BACKEND_URL}/api/voice/process`;

// Variable para mantener conversation_id
let conversationId = null;
```

### Paso 2: Captura de Audio

Agregar MediaRecorder para capturar audio del micrófono:

```javascript
let mediaRecorder;
let audioChunks = [];

// Inicializar captura de audio
async function iniciarCaptura() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];
            await enviarAudioAlBackend(audioBlob);
        };
        
        return true;
    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
        return false;
    }
}
```

### Paso 3: Enviar Audio al Backend

```javascript
async function enviarAudioAlBackend(audioBlob) {
    try {
        // Preparar FormData
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        
        if (conversationId) {
            formData.append('conversation_id', conversationId);
        }
        
        // Enviar al backend
        const response = await fetch(API_VOICE_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Obtener headers (Base64 encoded)
        conversationId = atob(response.headers.get('X-Conversation-Id') || '');
        const transcribedText = atob(response.headers.get('X-Transcribed-Text') || '');
        const llmResponse = atob(response.headers.get('X-Response-Text') || '');
        
        // Mostrar transcripción en UI
        console.log('Usuario:', transcribedText);
        console.log('A.R.C.A:', llmResponse);
        
        // Obtener y reproducir audio
        const audioResponseBlob = await response.blob();
        await reproducirRespuesta(audioResponseBlob);
        
    } catch (error) {
        console.error('Error al comunicarse con backend:', error);
        statusText.textContent = 'Error de conexión';
        systemActive = false;
        actualizarInterfaz();
    }
}
```

### Paso 4: Reproducir Respuesta con Sincronización Visual

```javascript
async function reproducirRespuesta(audioBlob) {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    
    // Analizar audio para animar el orbe
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Función para actualizar animación del orbe con el audio
    function actualizarOrbeConAudio() {
        if (audio.paused || audio.ended) {
            window.updateAIVoiceLevel(0);
            return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calcular nivel promedio
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = average / 255; // Normalizar 0-1
        
        window.updateAIVoiceLevel(level);
        
        requestAnimationFrame(actualizarOrbeConAudio);
    }
    
    // Reproducir audio
    audio.play();
    actualizarOrbeConAudio();
    
    // Cuando termine, resetear
    audio.onended = () => {
        window.updateAIVoiceLevel(0);
        systemActive = false;
        actualizarInterfaz();
    };
}
```

### Paso 5: Integrar con Sistema Existente

Modificar la función `alternarSistema()`:

```javascript
async function alternarSistema() {
    if (!systemActive) {
        // Activar sistema
        systemActive = true;
        actualizarInterfaz();
        
        // Inicializar captura si es la primera vez
        if (!mediaRecorder) {
            const success = await iniciarCaptura();
            if (!success) {
                systemActive = false;
                actualizarInterfaz();
                return;
            }
        }
        
        // Iniciar grabación
        audioChunks = [];
        mediaRecorder.start();
        statusText.textContent = 'Escuchando...';
        
    } else {
        // Desactivar sistema
        systemActive = false;
        actualizarInterfaz();
        
        // Detener grabación y enviar
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            statusText.textContent = 'Procesando...';
        }
    }
}
```

---

## 🐳 Docker Compose para Full Stack

Crear `docker-compose.yml` en el directorio padre:

```yaml
version: '3.8'

services:
  # Backend - A.R.C.A LLM
  backend:
    build: ./A.R.C.A-LLM
    ports:
      - "8000:8000"
    environment:
      - LM_STUDIO_URL=http://host.docker.internal:1234/v1
      - LM_STUDIO_MODEL=qwen/qwen3-4b-2507
      - WHISPER_MODEL=tiny
    volumes:
      - ./A.R.C.A-LLM/models:/app/models
      - ./A.R.C.A-LLM/logs:/app/logs
  
  # Frontend - MSMK Voice Assistant
  frontend:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./msmk-voice-assistant:/usr/share/nginx/html
    depends_on:
      - backend
```

---

## 🚀 Setup Local para Desarrollo

### Terminal 1: Backend

```bash
cd A.R.C.A-LLM
docker-compose up
```

O sin Docker:
```bash
cd A.R.C.A-LLM
python -m venv arca-venv
arca-venv\Scripts\activate
pip install -r requirements.txt
python run_arca.py
```

### Terminal 2: Frontend

```bash
cd msmk-voice-assistant

# Opción 1: Python simple HTTP server
python -m http.server 8080

# Opción 2: Node.js http-server
npx http-server -p 8080

# Opción 3: VS Code Live Server extension
# Click derecho -> "Open with Live Server"
```

### Acceso

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Backend Docs**: http://localhost:8000/docs

---

## 🔒 CORS Configuration

El backend ya está configurado para aceptar requests desde:
- `http://localhost:8080`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:8080`

Si usas otro puerto, agregar en `A.R.C.A-LLM/docker-compose.yml`:

```yaml
environment:
  - CORS_ORIGINS=["http://localhost:TU_PUERTO"]
```

---

## 🧪 Testing de Integración

### Test 1: Health Check

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

### Test 2: Voice Processing

1. Abrir DevTools (F12) en el navegador
2. Click en el orbe
3. Hablar: "Hola, cómo estás?"
4. Click de nuevo para enviar
5. Ver en Console:
   - Usuario: "Hola, cómo estás?"
   - A.R.C.A: "[respuesta del LLM]"

---

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

---

## 🔧 Variables de Configuración

### Frontend (`script.js`)

```javascript
const CONFIG = {
    BACKEND_URL: 'http://localhost:8000',
    AUDIO_FORMAT: 'audio/webm',
    MIN_RECORDING_TIME: 500, // ms
    MAX_RECORDING_TIME: 30000, // ms
    RETRY_ATTEMPTS: 3
};
```

### Backend (`.env`)

```env
# LM Studio
LM_STUDIO_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=qwen/qwen3-4b-2507

# Whisper STT
WHISPER_MODEL=tiny
WHISPER_DEVICE=cpu

# API
API_PORT=8000
CORS_ORIGINS=["http://localhost:8080"]
```

---

## 📝 Checklist de Integración

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 8080
- [ ] LM Studio activo con modelo cargado
- [ ] Permisos de micrófono otorgados
- [ ] CORS configurado correctamente
- [ ] `script.js` modificado con integración
- [ ] Test de health check exitoso
- [ ] Test de conversación exitoso
- [ ] Animación del orbe sincronizada con audio

---

## 🐛 Troubleshooting

### "Failed to fetch"
- Verificar que backend esté corriendo: `curl http://localhost:8000/api/health`
- Verificar CORS en DevTools Console
- Verificar firewall no esté bloqueando puerto 8000

### "Microphone access denied"
- Permitir acceso al micrófono en el navegador
- HTTPS o localhost son requeridos para getUserMedia

### "Audio no se reproduce"
- Verificar formato de respuesta es audio/wav
- Ver Console para errores JavaScript
- Verificar Blob se crea correctamente

### "Orbe no se anima con la voz"
- Verificar `window.updateAIVoiceLevel` existe
- Verificar AudioContext se crea correctamente
- Revisar permisos de autoplay en navegador

---

## 📚 Documentación Adicional

- **Backend API**: `../A.R.C.A-LLM/docs/API_DOCUMENTATION.md`
- **Backend Setup**: `../A.R.C.A-LLM/START_HERE.md`
- **Docker Setup**: `../A.R.C.A-LLM/docs/docker/DOCKER_SETUP.md`

---

**Siguiente paso**: Implementar los cambios en `script.js` y probar la integración 🚀

