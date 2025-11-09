# 🧪 Testing del Frontend

Guía completa para ejecutar y escribir tests del frontend con Jest.

## 📋 Configuración

### Instalación

```bash
npm install
```

Esto instalará:
- `jest` - Framework de testing
- `jest-environment-jsdom` - Entorno DOM para tests
- `@testing-library/jest-dom` - Utilidades para testing del DOM
- `@testing-library/dom` - Utilidades adicionales

## 🚀 Ejecutar Tests

### Todos los tests

```bash
npm test
```

### Modo watch (desarrollo)

```bash
npm run test:watch
```

### Con coverage

```bash
npm run test:coverage
```

Esto generará un reporte en `coverage/` con:
- Reporte HTML: `coverage/lcov-report/index.html`
- Reporte LCOV: `coverage/lcov.info`

## 📁 Estructura de Tests

```
frontend/
├── js/
│   ├── __tests__/          # Tests unitarios
│   │   ├── state.test.js
│   │   ├── backend-integration.test.js
│   │   ├── config.test.js
│   │   ├── gold-chat.test.js
│   │   └── setup.js        # Configuración global
│   ├── state.js
│   ├── backend-integration.js
│   └── ...
```

## ✍️ Escribir Tests

### Estructura Básica

```javascript
describe('Nombre del Módulo', () => {
    beforeEach(() => {
        // Setup antes de cada test
    });
    
    test('debería hacer algo específico', () => {
        // Arrange
        const input = 'valor';
        
        // Act
        const result = funcion(input);
        
        // Assert
        expect(result).toBe('esperado');
    });
});
```

### Mocking del DOM

```javascript
beforeEach(() => {
    document.body.innerHTML = `
        <div id="elemento"></div>
    `;
});
```

### Mocking de APIs

```javascript
global.fetch = jest.fn();

test('debería llamar a la API', async () => {
    fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
    });
    
    await miFuncion();
    
    expect(fetch).toHaveBeenCalled();
});
```

### Mocking de MediaRecorder

```javascript
global.MediaRecorder = jest.fn().mockImplementation(() => ({
    state: 'inactive',
    start: jest.fn(),
    stop: jest.fn()
}));
```

## 📊 Cobertura de Tests

### Módulos con Tests

✅ **state.js** - Gestor de estado del sistema
- Alternar estado del sistema
- Actualizar interfaz
- Calcular intensidad

✅ **backend-integration.js** - Integración con backend
- Inicializar captura de audio
- Enviar audio al backend
- Verificar salud del backend
- Manejo de errores

✅ **config.js** - Configuración del canvas
- Inicialización del canvas
- Paleta de colores
- Ajuste de tamaño

✅ **gold-chat.js** - Sistema de chat dorado
- Inicialización del chat
- Agregar mensajes

## 🎯 Buenas Prácticas

### 1. Tests Descriptivos

```javascript
// ❌ Mal
test('test 1', () => { ... });

// ✅ Bien
test('debería actualizar interfaz cuando se activa el sistema', () => { ... });
```

### 2. Un Test, Una Aserción

```javascript
// ❌ Mal
test('múltiples cosas', () => {
    expect(a).toBe(1);
    expect(b).toBe(2);
    expect(c).toBe(3);
});

// ✅ Bien
test('debería establecer a en 1', () => {
    expect(a).toBe(1);
});
```

### 3. Limpiar Después de Cada Test

```javascript
afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
});
```

### 4. Usar Setup Global

El archivo `setup.js` contiene configuración común:
- Mock de `matchMedia`
- Mock de `requestAnimationFrame`
- Mock de `ResizeObserver`
- Limpieza automática

## 🔍 Debugging Tests

### Ver logs en tests

```javascript
test('debug test', () => {
    console.log('Debug info');
    // ...
});
```

### Ejecutar un test específico

```bash
npm test -- state.test.js
```

### Modo verbose

```bash
npm test -- --verbose
```

## 📈 CI/CD

Los tests se ejecutan automáticamente en el pipeline de CI/CD:

1. **Frontend Tests Job** - Ejecuta todos los tests
2. **Coverage Report** - Genera reporte de cobertura
3. **Blocking** - El build falla si los tests fallan

Ver `.github/workflows/ci-cd.yml` para más detalles.

## 🐛 Troubleshooting

### Error: "Cannot find module"

Asegúrate de que el path en `moduleNameMapper` en `package.json` sea correcto.

### Error: "MediaRecorder is not defined"

Agrega el mock en `beforeEach`:

```javascript
global.MediaRecorder = jest.fn();
```

### Tests lentos

Usa `--maxWorkers=2` para limitar workers:

```bash
npm test -- --maxWorkers=2
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

