# 🎨 Frontend MSMK Voice Assistant

Interfaz web moderna para el asistente de voz A.R.C.A-LLM.

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
# O con auto-reload
npm run dev
```

Acceso: http://localhost:3000

### Testing

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Con coverage
npm run test:coverage
```

## 📁 Estructura

```
frontend/
├── css/                    # Estilos
│   ├── base.css           # Estilos base
│   ├── main.css           # Estilos principales
│   ├── arc-reactor.css    # Efectos del orbe
│   └── ...
├── js/                     # JavaScript
│   ├── __tests__/         # Tests unitarios
│   ├── state.js           # Gestor de estado
│   ├── backend-integration.js  # Integración con backend
│   ├── config.js          # Configuración
│   ├── gold-chat.js       # Sistema de chat
│   └── ...
├── index.html             # Página principal
├── Dockerfile             # Imagen Docker
├── TESTING.md             # Guía de testing
└── README.md             # Este archivo
```

## 🧪 Testing

El frontend incluye tests completos con Jest. Ver [TESTING.md](./TESTING.md) para más detalles.

### Ejecutar Tests

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

Abre `coverage/lcov-report/index.html` para ver el reporte visual.

## 🔧 Configuración

### Variables de Entorno

El frontend detecta automáticamente si está en Docker o desarrollo local:

- **Docker**: Usa `/api` como proxy
- **Local**: Usa `http://localhost:8000`

Configuración en `js/backend-integration.js`:

```javascript
const isDocker = window.location.hostname !== 'localhost';
const CONFIG = {
    BACKEND_URL: isDocker ? '' : 'http://localhost:8000',
    // ...
};
```

## 📦 Build para Producción

### Con Docker

```bash
docker-compose build frontend
```

### Manual

Los archivos estáticos se sirven directamente. No requiere build.

## 🎯 Características

✅ **Interfaz Moderna** - Diseño tipo Iron Man  
✅ **Animaciones Fluidas** - Canvas y CSS animations  
✅ **Chat Dorado** - Sistema de conversación tipo SCREEN  
✅ **Integración Backend** - Comunicación con A.R.C.A-LLM  
✅ **Responsive** - Adaptable a diferentes tamaños  
✅ **Tests Completos** - Cobertura con Jest  

## 🔄 CI/CD

El frontend está integrado en el pipeline de CI/CD:

1. **Tests** - Se ejecutan automáticamente en cada push
2. **Lint** - Validación de código (opcional)
3. **Build Docker** - Construcción de imagen
4. **Deploy** - Publicación automática en main/master

Ver `.github/workflows/ci-cd.yml` para más detalles.

## 📚 Documentación

- [Guía de Testing](./TESTING.md) - Cómo escribir y ejecutar tests
- [Backend Integration](../BACKEND_INTEGRATION.md) - Integración con backend

## 🐛 Troubleshooting

### Tests no encuentran módulos

Verifica que `jest.config` en `package.json` tenga los paths correctos.

### Backend no conecta

1. Verifica que el backend esté corriendo: `curl http://localhost:8000/api/health`
2. Revisa la consola del navegador (F12)
3. Verifica CORS en el backend

### Micrófono no funciona

1. Permite acceso en configuración del navegador
2. Usa `localhost` (no `127.0.0.1`)
3. Verifica permisos del sistema

## 📄 Licencia

MIT License

