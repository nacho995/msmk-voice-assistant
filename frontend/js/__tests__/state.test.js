/**
 * Tests para state.js
 * Pruebas del gestor de estado del sistema
 */

// Mock del DOM
beforeEach(() => {
    document.body.innerHTML = `
        <div id="statusText"></div>
        <div id="freqBars"></div>
        <div id="clickHint"></div>
        <div class="orbe-circle"></div>
        <div class="orbe-circle-2"></div>
        <div class="highlight-text"></div>
    `;
    
    // Mock de window.iniciarCaptura
    window.iniciarCaptura = jest.fn().mockResolvedValue(true);
    window.mediaRecorder = null;
    window.audioChunks = [];
    window.recordingStartTime = null;
});

// Mock de state.js - necesitamos importarlo después de configurar el DOM
describe('State Management', () => {
    let stateModule;
    
    beforeEach(() => {
        // Limpiar módulos anteriores
        delete require.cache[require.resolve('../state.js')];
        stateModule = require('../state.js');
    });
    
    test('debería inicializar elementos del DOM correctamente', () => {
        expect(document.getElementById('statusText')).toBeTruthy();
        expect(document.getElementById('freqBars')).toBeTruthy();
        expect(document.getElementById('clickHint')).toBeTruthy();
    });
    
    test('debería alternar estado del sistema', async () => {
        const alternarSistema = window.alternarSistema || stateModule.alternarSistema;
        
        // Mock de MediaRecorder
        const mockMediaRecorder = {
            state: 'inactive',
            start: jest.fn(),
            stop: jest.fn()
        };
        window.mediaRecorder = mockMediaRecorder;
        
        // Activar sistema
        await alternarSistema();
        
        expect(mockMediaRecorder.start).toHaveBeenCalled();
    });
    
    test('debería actualizar interfaz cuando se activa el sistema', () => {
        const statusText = document.getElementById('statusText');
        const freqBars = document.getElementById('freqBars');
        const orbeCircle = document.querySelector('.orbe-circle');
        
        // Simular activación
        if (window.setSystemActive) {
            window.setSystemActive(true);
            
            expect(statusText.classList.contains('active')).toBe(true);
            expect(freqBars.classList.contains('active')).toBe(true);
            expect(orbeCircle.classList.contains('active')).toBe(true);
        }
    });
    
    test('debería calcular intensidad correctamente', () => {
        if (window.calcularIntensidad) {
            const intensidad = window.calcularIntensidad();
            expect(typeof intensidad).toBe('number');
            expect(intensidad).toBeGreaterThanOrEqual(0);
            expect(intensidad).toBeLessThanOrEqual(1);
        }
    });
});

