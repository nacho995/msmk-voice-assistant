// ===== CONFIGURACIÓN DEL BACKEND =====
const BACKEND_URL = 'http://localhost:8000';
const API_VOICE_ENDPOINT = `${BACKEND_URL}/api/voice/process`;

// Variable para mantener conversation_id (memoria conversacional)
let conversationId = null;

// ===== OBTENER ELEMENTOS DEL DOM =====
const canvas = document.getElementById('canvas'); // Elemento canvas 
const ctx = canvas.getContext('2d'); // Contexto del canvas
const statusText = document.getElementById('statusText'); // Texto de estado
const freqBars = document.getElementById('freqBars'); // Barras de frecuencia
const clickHint = document.getElementById('clickHint'); // Indicador de clic
const orbeCircle = document.querySelector('.orbe-circle'); // Circulo exterior del orbe
const orbeCircle2 = document.querySelector('.orbe-circle-2'); // Circulo interior del orbe

// Ajustar canvas al tamaño de la ventana
function ajustarTamañoCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
ajustarTamañoCanvas();

// Configuración del orbe
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
const orbRadius = Math.min(canvas.width, canvas.height) * 0.15;
const totalPoints = 150;
const orbPoints = [];

// Paleta de colores dorados (estilo Iron Man)
const colorPalette = {
    gold: [255, 215, 0],
    darkOrange: [255, 140, 0],
    darkGold: [184, 134, 11],
    lightGold: [255, 185, 15]
};

// Crear puntos del orbe con propiedades aleatorias
for (let i = 0; i < totalPoints; i++) {
    orbPoints.push({
        angle: (Math.PI * 2 * i) / totalPoints,
        speed: Math.random() * 0.8 + 0.5,
        offset: Math.random() * Math.PI * 2,
        waveSize: Math.random() * 8 + 6
    });
}

// Estado de la aplicación
let animationTime = 0;
let systemActive = false;
let currentPulse = 0;

// Control de voz de la IA
let currentVoiceLevel = 0;
let targetVoiceLevel = 0;

// ===== ESTADO DE CAPTURA DE AUDIO =====
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;

// Función pública para el backend: actualizar nivel de voz
// Recibe un valor entre 0 (silencio) y 1 (voz alta)
window.updateAIVoiceLevel = function(level) {
    if (!systemActive) {
        targetVoiceLevel = 0;
        return;
    }
    
    // Limitar el valor entre 0 y 1
    targetVoiceLevel = Math.max(0, Math.min(1, level));
};

// ===== INICIALIZAR CAPTURA DE AUDIO =====
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
        
        console.log('✅ MediaRecorder inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al acceder al micrófono:', error);
        statusText.textContent = 'Error: No se puede acceder al micrófono';
        return false;
    }
}

// ===== ENVIAR AUDIO AL BACKEND =====
async function enviarAudioAlBackend(audioBlob) {
    isProcessing = true;
    statusText.textContent = 'Procesando...';
    
    try {
        // Preparar FormData
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        
        if (conversationId) {
            formData.append('conversation_id', conversationId);
        }
        
        console.log('📤 Enviando audio al backend...');
        
        // Enviar al backend
        const response = await fetch(API_VOICE_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Obtener headers (Base64 encoded)
        try {
            const conversationIdHeader = response.headers.get('X-Conversation-Id');
            const transcribedTextHeader = response.headers.get('X-Transcribed-Text');
            const llmResponseHeader = response.headers.get('X-Response-Text');
            
            if (conversationIdHeader) {
                conversationId = atob(conversationIdHeader);
            }
            
            const transcribedText = transcribedTextHeader ? atob(transcribedTextHeader) : '';
            const llmResponse = llmResponseHeader ? atob(llmResponseHeader) : '';
            
            // Mostrar en consola
            console.log('👤 Usuario:', transcribedText);
            console.log('🤖 A.R.C.A:', llmResponse);
            
            // Actualizar UI con transcripción
            statusText.textContent = transcribedText;
            
        } catch (decodeError) {
            console.warn('⚠️ Error decodificando headers:', decodeError);
        }
        
        // Obtener y reproducir audio
        const audioResponseBlob = await response.blob();
        await reproducirRespuesta(audioResponseBlob);
        
    } catch (error) {
        console.error('❌ Error al comunicarse con backend:', error);
        statusText.textContent = 'Error de conexión con el backend';
        systemActive = false;
        isRecording = false;
        isProcessing = false;
        actualizarInterfaz();
    }
}

// ===== REPRODUCIR RESPUESTA CON SINCRONIZACIÓN DEL ORBE =====
async function reproducirRespuesta(audioBlob) {
    const objectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(objectUrl);
    
    try {
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
        statusText.textContent = 'Reproduciendo respuesta...';
        await audio.play();
        actualizarOrbeConAudio();
        
        console.log('🔊 Reproduciendo respuesta de A.R.C.A...');
        
        // Cuando termine, resetear
        audio.onended = () => {
            window.updateAIVoiceLevel(0);
            systemActive = false;
            isRecording = false;
            isProcessing = false;
            statusText.textContent = 'Click para hablar';
            actualizarInterfaz();
            
            // Cleanup
            URL.revokeObjectURL(objectUrl);
            audioContext.close();
            
            console.log('✅ Reproducción finalizada');
        };
        
    } catch (playError) {
        console.error('❌ Error al reproducir audio:', playError);
        statusText.textContent = 'Error al reproducir respuesta';
        systemActive = false;
        isRecording = false;
        isProcessing = false;
        actualizarInterfaz();
        URL.revokeObjectURL(objectUrl);
    }
}

// ===== EVENTOS DE INTERACCIÓN DEL USUARIO =====
canvas.addEventListener('click', alternarSistema);
canvas.addEventListener('touchstart', (e) => {
    alternarSistema();
    e.preventDefault();
});

async function alternarSistema() {
    // Si está procesando, ignorar clicks
    if (isProcessing) {
        console.log('⏳ Esperando respuesta del backend...');
        return;
    }
    
    if (!systemActive) {
        // ===== ACTIVAR SISTEMA Y EMPEZAR A GRABAR =====
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
        isRecording = true;
        mediaRecorder.start();
        statusText.textContent = 'Escuchando... (click de nuevo para enviar)';
        
        console.log('🎤 Grabando audio...');
        
    } else {
        // ===== DESACTIVAR SISTEMA Y ENVIAR AUDIO =====
        if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
            isRecording = false;
            mediaRecorder.stop();
            statusText.textContent = 'Enviando al backend...';
            
            console.log('⏹️ Grabación detenida, enviando...');
        }
    }
}

function actualizarInterfaz() {
    if (systemActive) {
        statusText.classList.add('active', 'listening');
        freqBars.classList.add('active');
        orbeCircle.classList.add('active');
        orbeCircle2.classList.add('active');
        clickHint.style.display = 'none';
    } else {
        statusText.classList.remove('active', 'listening');
        freqBars.classList.remove('active');
        orbeCircle.classList.remove('active');
        orbeCircle2.classList.remove('active');
        clickHint.style.display = 'block';
    }
}

// Dibujar un hexágono en el canvas
function dibujarHexagono(x, y, size, opacity) {
    ctx.beginPath();
    
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const pointX = x + Math.cos(angle) * size;
        const pointY = y + Math.sin(angle) * size;
        
        if (i === 0) {
            ctx.moveTo(pointX, pointY);
        } else {
            ctx.lineTo(pointX, pointY);
        }
    }
    
    ctx.closePath();
    ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
}

// Dibujar un resplandor (glow effect)
function dibujarResplandor(x, y, radius, color, opacity) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    
    gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`);
    gradient.addColorStop(0.3, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Loop principal de animación
function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animationTime += 0.016;
    
    // Suavizar transiciones del pulso
    if (systemActive) {
        currentPulse = Math.min(1, currentPulse + 0.03);
    } else {
        currentPulse = Math.max(0, currentPulse - 0.02);
    }
    
    // Suavizar cambios en el nivel de voz
    const smoothFactor = 0.15;
    currentVoiceLevel += (targetVoiceLevel - currentVoiceLevel) * smoothFactor;
    
    // Calcular intensidad final combinando pulso y voz
    const intensity = systemActive ? Math.max(currentPulse * 0.3, currentVoiceLevel) : currentPulse;
    
    // Dibujar hexágonos giratorios de fondo
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(animationTime * 0.05 * (i % 2 ? 1 : -1) + i);
        const hexSize = orbRadius * (1.8 + i * 0.4);
        dibujarHexagono(0, 0, hexSize, 0.08 + intensity * 0.1);
        ctx.restore();
    }
    
    ctx.restore();

    // Dibujar resplandores (glows)
    const baseGlow = 0.15 + intensity * 0.2;
    const pulseGlow = intensity * Math.sin(animationTime * 3) * 0.15;
    
    dibujarResplandor(centerX, centerY, orbRadius * 5, colorPalette.gold, baseGlow + pulseGlow);
    dibujarResplandor(centerX, centerY, orbRadius * 3.5, colorPalette.darkOrange, (baseGlow + pulseGlow) * 0.8);
    dibujarResplandor(centerX, centerY, orbRadius * 2.5, colorPalette.lightGold, (baseGlow + pulseGlow) * 0.6);

    // Dibujar el orbe principal
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.beginPath();
    
    for (let i = 0; i <= totalPoints; i++) {
        const point = orbPoints[i % totalPoints];
        
        // Calcular amplitud del movimiento
        const minAmp = 3;
        const maxAmp = point.waveSize * 0.8;
        const currentAmp = minAmp + (maxAmp - minAmp) * intensity;
        
        // Crear ondas de audio
        const wave1 = Math.sin(animationTime * point.speed * 4 + point.offset) * currentAmp;
        const wave2 = Math.sin(animationTime * point.speed * 3 + point.offset * 1.3) * currentAmp * 0.5;
        const audioWave = wave1 + wave2;
        
        // Pulsación global
        const pulse = Math.sin(animationTime * 2.5) * 5 * intensity + 
                     Math.sin(animationTime * 1.5) * 2 * (1 - intensity);

        // Calcular radio final
        const radius = orbRadius + audioWave + pulse;
        const x = Math.cos(point.angle) * radius;
        const y = Math.sin(point.angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            // Calcular punto anterior para curvas suaves
            const prevIdx = (i - 1) % totalPoints;
            const prevPoint = orbPoints[prevIdx];
            
            const prevAmp = minAmp + (prevPoint.waveSize * 0.8 - minAmp) * intensity;
            const prevWave1 = Math.sin(animationTime * prevPoint.speed * 4 + prevPoint.offset) * prevAmp;
            const prevWave2 = Math.sin(animationTime * prevPoint.speed * 3 + prevPoint.offset * 1.3) * prevAmp * 0.5;
            const prevWave = prevWave1 + prevWave2;
            const prevRadius = orbRadius + prevWave + pulse;
            
            const prevX = Math.cos(prevPoint.angle) * prevRadius;
            const prevY = Math.sin(prevPoint.angle) * prevRadius;
            
            // Puntos de control para curva Bézier
            const cp1x = prevX + Math.cos(prevPoint.angle + Math.PI / 2) * 8;
            const cp1y = prevY + Math.sin(prevPoint.angle + Math.PI / 2) * 8;
            const cp2x = x - Math.cos(point.angle + Math.PI / 2) * 8;
            const cp2y = y - Math.sin(point.angle + Math.PI / 2) * 8;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        }
    }
    
    ctx.closePath();

    // Aplicar gradiente al orbe
    const orbGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius * 1.8);
    orbGradient.addColorStop(0, `rgba(${colorPalette.lightGold[0]}, ${colorPalette.lightGold[1]}, ${colorPalette.lightGold[2]}, ${0.95 + intensity * 0.05})`);
    orbGradient.addColorStop(0.3, `rgba(${colorPalette.gold[0]}, ${colorPalette.gold[1]}, ${colorPalette.gold[2]}, 0.9)`);
    orbGradient.addColorStop(0.7, `rgba(${colorPalette.darkOrange[0]}, ${colorPalette.darkOrange[1]}, ${colorPalette.darkOrange[2]}, 0.85)`);
    orbGradient.addColorStop(1, `rgba(${colorPalette.darkGold[0]}, ${colorPalette.darkGold[1]}, ${colorPalette.darkGold[2]}, 0.8)`);
    
    ctx.fillStyle = orbGradient;
    ctx.shadowBlur = 30 + intensity * 20;
    ctx.shadowColor = `rgba(255, 215, 0, ${0.4 + intensity * 0.3})`;
    ctx.fill();

    // Dibujar borde del orbe
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + intensity * 0.3})`;
    ctx.lineWidth = 1.5 + intensity * 1;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.stroke();

    // Líneas radiales internas (solo si hay suficiente intensidad)
    if (intensity > 0.2) {
        for (let i = 0; i < 8; i++) {
            const lineAngle = (Math.PI * 2 * i / 8) + animationTime * 0.3;
            const innerRadius = orbRadius * 0.4;
            const outerRadius = orbRadius * 0.75;
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(lineAngle) * innerRadius, Math.sin(lineAngle) * innerRadius);
            ctx.lineTo(Math.cos(lineAngle) * outerRadius, Math.sin(lineAngle) * outerRadius);
            ctx.strokeStyle = `rgba(255, 215, 0, ${intensity * 0.2})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    ctx.restore();

    // Dibujar partículas orbitales
    const numParticles = 18 + Math.floor(intensity * 8);
    
    for (let i = 0; i < numParticles; i++) {
        const rotationSpeed = 0.25 + intensity * 0.4;
        const particleAngle = (Math.PI * 2 * i / numParticles) + animationTime * rotationSpeed;
        const particleDistance = orbRadius * (2 + Math.sin(animationTime * 1.5 + i) * 0.3);
        const particleWave = Math.sin(animationTime * 2.5 + i) * (15 + intensity * 20);
        
        const particleX = centerX + Math.cos(particleAngle) * (particleDistance + particleWave);
        const particleY = centerY + Math.sin(particleAngle) * (particleDistance + particleWave);
        const particleSize = 1.5 + intensity * 1.5;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + intensity * 0.3})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.fill();
    }

    // Anillo exterior punteado
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbRadius * 2.2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 + intensity * 0.2})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([8, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(animar);
}

// Ajustar canvas al redimensionar ventana
window.addEventListener('resize', () => {
    ajustarTamañoCanvas();
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
});

// Iniciar animación
animar();
