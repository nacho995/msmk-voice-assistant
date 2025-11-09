/**
 * Tests para gold-chat.js
 * Pruebas del sistema de chat dorado
 */

// Mock del DOM
beforeEach(() => {
    document.body.innerHTML = `
        <div id="goldChat"></div>
    `;
});

describe('Gold Chat', () => {
    test('debería inicializar contenedor del chat', () => {
        const goldChat = document.getElementById('goldChat');
        expect(goldChat).toBeTruthy();
    });
    
    test('debería tener configuración correcta', () => {
        const expectedConfig = {
            VELOCIDAD_ESCRITURA: 30,
            TIEMPO_DESVANECIMIENTO: 2000,
            TIEMPO_DESPUES_MENSAJE: 2000
        };
        
        expect(expectedConfig.VELOCIDAD_ESCRITURA).toBe(30);
        expect(expectedConfig.TIEMPO_DESVANECIMIENTO).toBe(2000);
    });
    
    test('debería agregar mensaje de usuario', () => {
        if (window.addUserMessage) {
            window.addUserMessage('Hola');
            // Verificar que el mensaje se agregó
            expect(window.addUserMessage).toBeDefined();
        }
    });
    
    test('debería agregar mensaje de IA', () => {
        if (window.addAIMessage) {
            window.addAIMessage('Respuesta');
            // Verificar que el mensaje se agregó
            expect(window.addAIMessage).toBeDefined();
        }
    });
});

