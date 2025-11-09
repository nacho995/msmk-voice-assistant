/**
 * Voice Interface - Frontend logic for A.R.C.A LLM
 * 
 * Handles:
 * - Audio recording with MediaRecorder
 * - Sending audio to backend
 * - Displaying conversation messages
 * - Auto-playing audio responses
 */

class VoiceInterface {
    constructor() {
        // DOM Elements
        this.voiceButton = document.getElementById('voiceButton');
        this.buttonText = this.voiceButton.querySelector('.button-text');
        this.statusText = document.querySelector('.status-text');
        this.statusDot = document.querySelector('.status-dot');
        this.conversationMessages = document.getElementById('conversationMessages');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.clearButton = document.getElementById('clearButton');
        this.statsToggle = document.getElementById('statsToggle');
        this.statsContainer = document.getElementById('statsContainer');
        
        // State
        this.isRecording = false;
        this.isProcessing = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.sessionId = this.generateSessionId();
        
        // Initialize
        this.init();
    }
    
    generateSessionId() {
        // Generate a simple UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    async init() {
        console.log('🎙️ Initializing Voice Interface...');
        console.log('Session ID:', this.sessionId);
        
        // Check MediaRecorder support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Tu navegador no soporta grabación de audio');
            return;
        }
        
        // Setup event listeners
        this.voiceButton.addEventListener('click', () => this.handleVoiceButtonClick());
        this.clearButton.addEventListener('click', () => this.clearConversation());
        this.statsToggle.addEventListener('click', () => this.toggleStats());
        
        // Remove welcome message on first interaction
        this.firstInteraction = true;
        
        console.log('✅ Voice Interface ready');
    }
    
    async handleVoiceButtonClick() {
        if (this.isProcessing) {
            console.log('⏳ Already processing, ignoring click');
            return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    async startRecording() {
        try {
            console.log('🎤 Requesting microphone access...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                } 
            });
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            // Event: data available
            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });
            
            // Event: stop
            this.mediaRecorder.addEventListener('stop', () => {
                this.processAudio();
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            });
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            this.voiceButton.classList.add('recording');
            this.buttonText.textContent = 'Grabando... (click para enviar)';
            this.updateStatus('Escuchando...', 'recording');
            
            console.log('🔴 Recording started');
            
        } catch (error) {
            console.error('❌ Microphone error:', error);
            this.showError('No se pudo acceder al micrófono');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('⏹️ Stopping recording...');
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Update UI
            this.voiceButton.classList.remove('recording');
            this.updateStatus('Procesando...', 'processing');
        }
    }
    
    async processAudio() {
        console.log('📦 Processing audio chunks...');
        
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('Audio size:', audioBlob.size, 'bytes');
        
        if (audioBlob.size < 1000) {
            this.showError('Audio demasiado corto. Intenta de nuevo.');
            this.resetUI();
            return;
        }
        
        // Send to backend
        await this.sendAudioToBackend(audioBlob);
    }
    
    async sendAudioToBackend(audioBlob) {
        this.isProcessing = true;
        this.voiceButton.classList.add('processing');
        this.voiceButton.disabled = true;
        this.buttonText.textContent = 'Procesando...';
        
        try {
            console.log('📤 Sending audio to backend...');
            const startTime = performance.now();
            
            // Create FormData
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');
            formData.append('session_id', this.sessionId);
            formData.append('language', 'es');
            
            // Send request
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Get headers (text is base64 encoded to handle Unicode)
            const transcribedTextB64 = response.headers.get('X-Transcribed-Text');
            const responseTextB64 = response.headers.get('X-Response-Text');
            
            // Decode base64 to UTF-8
            const transcribedText = decodeURIComponent(escape(atob(transcribedTextB64)));
            const responseText = decodeURIComponent(escape(atob(responseTextB64)));
            
            const latencyTotal = parseFloat(response.headers.get('X-Latency-Total'));
            const latencySTT = parseFloat(response.headers.get('X-Latency-STT'));
            const latencyLLM = parseFloat(response.headers.get('X-Latency-LLM'));
            const latencyTTS = parseFloat(response.headers.get('X-Latency-TTS'));
            
            // Get audio
            const audioArrayBuffer = await response.arrayBuffer();
            
            const totalTime = (performance.now() - startTime) / 1000;
            console.log(`✅ Response received in ${totalTime.toFixed(2)}s`);
            
            // Remove welcome message on first interaction
            if (this.firstInteraction) {
                this.conversationMessages.innerHTML = '';
                this.firstInteraction = false;
            }
            
            // Display messages
            this.addMessage('user', transcribedText);
            this.addMessage('assistant', responseText);
            
            // Update stats
            this.updateStats({
                stt: latencySTT,
                llm: latencyLLM,
                tts: latencyTTS,
                total: latencyTotal
            });
            
            // Play audio response
            await this.playAudio(audioArrayBuffer);
            
            console.log('🎉 Processing complete');
            
        } catch (error) {
            console.error('❌ Error sending audio:', error);
            this.showError('Error al procesar audio: ' + error.message);
        } finally {
            this.resetUI();
        }
    }
    
    async playAudio(audioArrayBuffer) {
        console.log('🔊 Playing audio response...');
        
        try {
            // Create blob from array buffer
            const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Set audio player source and play
            this.audioPlayer.src = audioUrl;
            
            await this.audioPlayer.play();
            
            // Clean up URL after playing
            this.audioPlayer.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                console.log('✅ Audio playback finished');
            }, { once: true });
            
        } catch (error) {
            console.error('❌ Audio playback error:', error);
            // Don't show error to user, text is already displayed
        }
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.conversationMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.conversationMessages.scrollTop = this.conversationMessages.scrollHeight;
    }
    
    updateStats(latency) {
        document.getElementById('sttLatency').textContent = `${latency.stt.toFixed(2)}s`;
        document.getElementById('llmLatency').textContent = `${latency.llm.toFixed(2)}s`;
        document.getElementById('ttsLatency').textContent = `${latency.tts.toFixed(2)}s`;
        document.getElementById('totalLatency').textContent = `${latency.total.toFixed(2)}s`;
    }
    
    toggleStats() {
        const isVisible = this.statsContainer.style.display !== 'none';
        this.statsContainer.style.display = isVisible ? 'none' : 'flex';
        this.statsToggle.textContent = isVisible ? '📊 Métricas' : '❌ Ocultar';
    }
    
    async clearConversation() {
        if (!confirm('¿Limpiar toda la conversación?')) {
            return;
        }
        
        try {
            console.log('🧹 Clearing conversation...');
            
            const response = await fetch(`/api/conversation/${this.sessionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear conversation');
            }
            
            // Clear UI
            this.conversationMessages.innerHTML = `
                <div class="welcome-message">
                    <p>✨ Conversación limpiada</p>
                    <p>Presiona el botón del micrófono para empezar de nuevo.</p>
                </div>
            `;
            this.firstInteraction = true;
            
            console.log('✅ Conversation cleared');
            
        } catch (error) {
            console.error('❌ Error clearing conversation:', error);
            this.showError('Error al limpiar conversación');
        }
    }
    
    updateStatus(text, state = 'ready') {
        this.statusText.textContent = text;
        
        // Update dot color
        const colors = {
            ready: '#10b981',
            recording: '#ef4444',
            processing: '#f59e0b',
            error: '#ef4444'
        };
        
        this.statusDot.style.background = colors[state] || colors.ready;
    }
    
    showError(message) {
        console.error('❌', message);
        alert('❌ ' + message);
        this.updateStatus('Error', 'error');
        setTimeout(() => {
            this.updateStatus('Listo', 'ready');
        }, 3000);
    }
    
    resetUI() {
        this.isProcessing = false;
        this.voiceButton.classList.remove('recording', 'processing');
        this.voiceButton.disabled = false;
        this.buttonText.textContent = 'Presiona para hablar';
        this.updateStatus('Listo', 'ready');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing A.R.C.A Voice Interface...');
    window.voiceInterface = new VoiceInterface();
});

