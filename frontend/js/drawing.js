/* ===== FUNCIONES DE DIBUJO ===== */

// Dibujar un hexágono
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
    ctx.strokeStyle = `rgba(255, 50, 50, ${opacity})`;
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

// Dibujar partículas orbitales ligeras
let orbitalParticles = [];

function ensureParticlesInitialized() {
    if (orbitalParticles.length > 0) return;
    const baseCount = Math.floor((getResponsiveParticleCount ? getResponsiveParticleCount() : 120) * 0.08);
    const count = Math.max(10, Math.min(60, baseCount));
    for (let i = 0; i < count; i++) {
        orbitalParticles.push({
            angle: (Math.PI * 2 * Math.random()),
            speed: 0.4 + Math.random() * 0.8,
            radiusJitter: (Math.random() - 0.5) * 12,
            size: 1 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function dibujarParticulas(intensity, animationTime) {
    ensureParticlesInitialized();
    const quality = (getQualitySettings ? getQualitySettings() : { shadowBlur: 1, particleDensity: 1 });
    const visibleCount = Math.floor(orbitalParticles.length * (0.6 + intensity * 0.4) * quality.particleDensity);
    const baseRadius = orbRadius * 5.6;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < visibleCount; i++) {
        const p = orbitalParticles[i];
        const wobble = Math.sin(animationTime * 1.5 + p.phase) * 4 * (0.4 + intensity * 0.6);
        const r = baseRadius + p.radiusJitter + wobble;
        const a = p.angle + animationTime * p.speed * (0.6 + intensity * 1.2);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        
        const alpha = 0.15 + intensity * 0.45;
        ctx.fillStyle = `rgba(120, 230, 255, ${alpha})`;
        ctx.shadowBlur = 10 + intensity * 25;
        ctx.shadowColor = 'rgba(120, 230, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Dibujar anillo exterior punteado - DESACTIVADO
function dibujarAnilloExterior(intensity) {
    // Desactivado para no interferir con el anillo principal
    return;
}

// Dibujar rayos solares - DESACTIVADOS para no meterse en los círculos
function dibujarRayosSolares(animationTime, intensity) {
    // Desactivados para mantener el efecto solo en el anillo
    return;
}

// Dibujar hexágonos giratorios de fondo
function dibujarHexagonosFondo(animationTime, intensity) {
    // Desactivados para dar prioridad a los rayos solares
    return;
}

// Resplandores centrales es mejorados
function dibujarResplandores(animationTime, intensity) {
    const enhancedIntensity = Math.pow(intensity, 0.9);
    const pulse1 = Math.sin(animationTime * 1.2);
    const pulse2 = Math.sin(animationTime * 0.8 + 1.2);
    const pulse3 = Math.sin(animationTime * 0.5);
    
    const r1 = orbRadius * (1.3 + 0.15 * pulse1);
    const r2 = orbRadius * (2.6 + 0.2 * pulse2);
    const r3 = orbRadius * (4.2 + 0.25 * pulse3);
    const r4 = orbRadius * (6.0 + 0.3 * pulse1);
    
    const i = Math.max(0.25, enhancedIntensity);
    
    // Múltiples capas de resplandor para profundidad 
    dibujarResplandor(centerX, centerY, r4 * 5.8, [0, 140, 220], 0.04 * i);
    dibujarResplandor(centerX, centerY, r3 * 5.4, [0, 160, 255], 0.06 * i);
    dibujarResplandor(centerX, centerY, r2 * 4.2, [0, 190, 255], 0.08 * i);
    dibujarResplandor(centerX, centerY, r1 * 2.8, [100, 240, 255], 0.12 * i);
    dibujarResplandor(centerX, centerY, r1 * 1.8, [150, 250, 255], 0.15 * i);
}
