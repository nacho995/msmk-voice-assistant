/* ===== AJUSTES RESPONSIVE DINÁMICOS ===== */
/* Los estilos CSS ya usan clamp() para ser automáticamente responsive */
/* Este archivo solo maneja optimizaciones de rendimiento */

// Configuración responsive simplificada
let responsiveConfig = {
    particleCount: totalPoints,
    glowIntensity: 1,
    performanceMode: 'high'
};

// Función para detectar el tamaño de pantalla y ajustar rendimiento
function actualizarConfigResponsive() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    
    // Ajustar conteo de partículas según el dispositivo
    if (isMobile) {
        responsiveConfig.particleCount = Math.floor(totalPoints * 0.7);
        responsiveConfig.glowIntensity = 0.8;
        responsiveConfig.performanceMode = 'medium';
    } else if (isTablet) {
        responsiveConfig.particleCount = Math.floor(totalPoints * 0.85);
        responsiveConfig.glowIntensity = 0.9;
        responsiveConfig.performanceMode = 'medium-high';
    } else {
        responsiveConfig.particleCount = totalPoints;
        responsiveConfig.glowIntensity = 1;
        responsiveConfig.performanceMode = 'high';
    }
    
    // Ajuste especial para landscape en móviles
    if (height < 500 && isLandscape && isMobile) {
        responsiveConfig.particleCount = Math.floor(responsiveConfig.particleCount * 0.8);
        responsiveConfig.glowIntensity *= 0.8;
    }
}

// Función para obtener la intensidad del brillo escalada
function getScaledGlowIntensity(baseIntensity) {
    return baseIntensity * responsiveConfig.glowIntensity;
}

// Función para obtener el número de partículas responsive
function getResponsiveParticleCount() {
    return responsiveConfig.particleCount;
}

// Detectar si el dispositivo es táctil
function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

// Ajustar la calidad de las animaciones según el rendimiento
let performanceMode = 'high';

function detectarRendimiento() {
    const width = window.innerWidth;
    
    // Dispositivos móviles: modo medio
    if (isTouchDevice() && width < 768) {
        performanceMode = 'medium';
    }
    // Tablets: modo medio-alto
    else if (isTouchDevice() && width < 1024) {
        performanceMode = 'medium-high';
    }
    // Desktops: modo alto
    else {
        performanceMode = 'high';
    }
    
    return performanceMode;
}

// Obtener configuración de calidad según el modo de rendimiento
function getQualitySettings() {
    const mode = detectarRendimiento();
    
    const settings = {
        'medium': {
            shadowBlur: 0.6,
            particleDensity: 0.7,
            animationSmoothing: 0.8
        },
        'medium-high': {
            shadowBlur: 0.8,
            particleDensity: 0.85,
            animationSmoothing: 0.9
        },
        'high': {
            shadowBlur: 1,
            particleDensity: 1,
            animationSmoothing: 1
        }
    };
    
    return settings[mode] || settings['high'];
}

// Función para ajustar el viewport meta tag dinámicamente
function ajustarViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    
    // Configuración optimizada para diferentes dispositivos
    if (window.innerWidth < 768) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    } else {
        viewport.content = 'width=device-width, initial-scale=1.0';
    }
}


// Debounce para optimizar el resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función principal de actualización responsive
function actualizarResponsive() {
    actualizarConfigResponsive();
    ajustarViewport();
    ajustarTamañoCanvas();
}

// Inicializar configuración responsive
actualizarResponsive();

// Escuchar cambios de tamaño con debounce
const debouncedResize = debounce(actualizarResponsive, 250);
window.addEventListener('resize', debouncedResize);

// Escuchar cambios de orientación
window.addEventListener('orientationchange', () => {
    setTimeout(actualizarResponsive, 100);
});

// Detectar cambios en el modo de pantalla completa
document.addEventListener('fullscreenchange', actualizarResponsive);
document.addEventListener('webkitfullscreenchange', actualizarResponsive);
document.addEventListener('mozfullscreenchange', actualizarResponsive);
document.addEventListener('MSFullscreenChange', actualizarResponsive);

// Log de información responsive (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🎨 Configuración Responsive Inicializada');
    console.log('📱 Ancho de pantalla:', window.innerWidth);
    console.log('⚡ Modo de rendimiento:', performanceMode);
    console.log('🎯 Dispositivo táctil:', isTouchDevice());
}
