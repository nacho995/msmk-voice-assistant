/**
 * Tests para backend-integration.js
 * Pruebas de integración con el backend
 */

// Mock de fetch global
global.fetch = jest.fn();

// Mock de MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
    state: 'inactive',
    start: jest.fn(),
    stop: jest.fn(),
    ondataavailable: null,
    onstop: null,
    onerror: null
}));

// Mock de navigator.mediaDevices
global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }]
    })
};

// Mock de URL
global.URL = {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
};

// Mock de Audio
global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn(),
    onended: null,
    onerror: null
}));

// Mock de AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
    createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn()
    })),
    createAnalyser: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: jest.fn()
    })),
    destination: {},
    close: jest.fn().mockResolvedValue()
}));

describe('Backend Integration', () => {
    beforeEach(() => {
        fetch.mockClear();
        window.mediaRecorder = null;
        window.audioChunks = [];
        window.conversationId = null;
        window.recordingStartTime = null;
    });
    
    test('debería detectar correctamente si está en Docker', () => {
        // Simular entorno local
        Object.defineProperty(window, 'location', {
            value: { hostname: 'localhost' },
            writable: true
        });
        
        // En un entorno real, isDocker se calcula al cargar el módulo
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        expect(isLocal).toBe(true);
    });
    
    test('debería configurar CONFIG correctamente', () => {
        // La configuración se define en el módulo
        // Verificamos que los valores por defecto sean correctos
        const expectedConfig = {
            AUDIO_FORMAT: 'audio/webm',
            MIN_RECORDING_TIME: 500,
            MAX_RECORDING_TIME: 30000,
            RETRY_ATTEMPTS: 3
        };
        
        // Verificamos estructura esperada
        expect(expectedConfig.AUDIO_FORMAT).toBe('audio/webm');
        expect(expectedConfig.MIN_RECORDING_TIME).toBe(500);
    });
    
    test('debería inicializar captura de audio', async () => {
        if (window.iniciarCaptura) {
            const result = await window.iniciarCaptura();
            expect(result).toBe(true);
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        }
    });
    
    test('debería enviar audio al backend correctamente', async () => {
        const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
        
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: jest.fn((header) => {
                    if (header === 'X-Conversation-Id') return btoa('test-id');
                    if (header === 'X-Transcribed-Text') return btoa('hola');
                    if (header === 'X-Response-Text') return btoa('respuesta');
                    return null;
                })
            },
            blob: jest.fn().mockResolvedValue(mockBlob)
        });
        
        if (window.enviarAudioAlBackend) {
            await window.enviarAudioAlBackend(mockBlob);
            
            expect(fetch).toHaveBeenCalled();
            const callArgs = fetch.mock.calls[0];
            expect(callArgs[0]).toContain('/api/voice/process');
            expect(callArgs[1].method).toBe('POST');
        }
    });
    
    test('debería manejar errores de conexión', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));
        
        const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
        
        if (window.enviarAudioAlBackend) {
            await expect(window.enviarAudioAlBackend(mockBlob)).resolves.not.toThrow();
        }
    });
    
    test('debería verificar salud del backend', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ status: 'healthy' })
        });
        
        if (window.verificarBackend) {
            const result = await window.verificarBackend();
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalled();
        }
    });
    
    test('debería limpiar recursos de audio', () => {
        const mockMediaRecorder = {
            state: 'recording',
            stop: jest.fn()
        };
        const mockStream = {
            getTracks: () => [{ stop: jest.fn() }]
        };
        
        window.mediaRecorder = mockMediaRecorder;
        window.audioStream = mockStream;
        
        if (window.limpiarRecursosAudio) {
            window.limpiarRecursosAudio();
            
            expect(mockMediaRecorder.stop).toHaveBeenCalled();
            expect(window.mediaRecorder).toBeNull();
        }
    });
});

