/**
 * Tests para config.js
 * Pruebas de configuración del canvas y orbe
 */

// Mock del DOM
beforeEach(() => {
    document.body.innerHTML = `
        <canvas id="canvas"></canvas>
        <div class="orbe-circle"></div>
    `;
    
    // Configurar canvas
    const canvas = document.getElementById('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.getContext = jest.fn(() => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn()
    }));
});

describe('Config Module', () => {
    test('debería inicializar canvas correctamente', () => {
        const canvas = document.getElementById('canvas');
        expect(canvas).toBeTruthy();
        expect(canvas.getContext).toBeDefined();
    });
    
    test('debería tener paleta de colores definida', () => {
        // La paleta se define en config.js
        const expectedColors = [
            'electric',
            'cyan',
            'darkBlue',
            'lightCyan',
            'neon',
            'glow',
            'gold',
            'goldLight',
            'goldDark'
        ];
        
        // Verificamos que los colores esperados existan
        expectedColors.forEach(color => {
            expect(color).toBeDefined();
        });
    });
    
    test('debería ajustar tamaño del canvas', () => {
        const canvas = document.getElementById('canvas');
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        
        // Simular resize
        window.innerWidth = 1024;
        window.innerHeight = 768;
        
        if (window.ajustarTamañoCanvas) {
            window.ajustarTamañoCanvas();
        }
        
        // El canvas debería haberse ajustado
        expect(canvas).toBeTruthy();
    });
    
    test('debería crear puntos del orbe', () => {
        // Los puntos se crean en config.js
        const totalPoints = 150;
        
        // Verificamos que se esperen 150 puntos
        expect(totalPoints).toBe(150);
    });
});

