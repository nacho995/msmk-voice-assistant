/* ===== CONFIGURACIÓN GLOBAL ===== */

// Configuración del canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

// Configuración del orbe - EN EL ANILLO EXTERIOR
let orbRadius = Math.min(canvas.width, canvas.height) * 0.18; // Se recalcula dinámicamente
const totalPoints = 150;
const orbPoints = [];

// Paleta de colores - IRON MAN CLÁSICO (Rojo y Dorado)
const colorPalette = {
    electric: [220, 20, 20],       // Rojo Iron Man
    cyan: [200, 30, 30],           // Rojo medio
    darkBlue: [150, 10, 10],       // Rojo oscuro
    lightCyan: [255, 50, 50],      // Rojo brillante
    neon: [230, 25, 25],           // Rojo neón
    glow: [210, 20, 20],           // Resplandor rojo
    gold: [255, 215, 0],           // Oro Iron Man
    goldLight: [255, 223, 100],    // Oro claro
    goldDark: [218, 165, 32]       // Oro oscuro
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

// Ajustar canvas al tamaño de la ventana
function ajustarTamañoCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = (canvas.width / 2) + (canvas.width * 0.02); // Movido a la derecha para coincidir con CSS (left: 52%)
    centerY = (canvas.height / 2) - (canvas.height * 0); // Subido para coincidir con CSS (top: 48%)

    const orbeElemento = document.querySelector('.orbe-circle');
    if (orbeElemento) {
        const anchoOrbeCSS = orbeElemento.getBoundingClientRect().width;
        const radioVisual = anchoOrbeCSS / 2;
        orbRadius = radioVisual / 5.6;
    } else {
        orbRadius = Math.min(canvas.width, canvas.height) * 0.18;
    }
}

ajustarTamañoCanvas();
window.addEventListener('resize', ajustarTamañoCanvas);
