/* ===== RENDERIZADO DEL ANILLO EXTERIOR - ESTELA SOLAR  ===== */

// Dibujar anillo ondulado ultra mejorado con múltiples capas es
function dibujarOrbePrincipal(animationTime, intensity) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Detectar si la IA está hablando (comportamiento más característico)
    const isAISpeaking = window.isAISpeaking ? window.isAISpeaking() : false;
    
    // Radio base del anillo - optimizado y más preciso
    const baseRadius = orbRadius * 5.6;
    const ringWidthBase = orbRadius * 5.2;
    const ringWidth = ringWidthBase * (0.3 + intensity * 0.25);
    const enhancedIntensity = Math.pow(intensity, 0.85); // Curva de respuesta más suave
    
    // Crear múltiples rutas para diferentes capas de profundidad
    const paths = {
        outer: [],
        middle: [],
        inner: []
    };
    
    // Generar ondas complejas con múltiples frecuencias
    for (let i = 0; i <= totalPoints; i++) {
        const point = orbPoints[i % totalPoints];
        
        // Sistema de ondas mejorado con múltiples armónicos
        const minAmp = 2.5;
        const maxAmp = point.waveSize * 0.6;
        const currentAmp = minAmp + (maxAmp - minAmp) * enhancedIntensity;
        
        // Comportamiento diferenciado: IA habla = ondas más rápidas e intensas
        let waveSpeedMultiplier = 1.0;
        let waveIntensityMultiplier = 1.0;
        let pulseMultiplier = 1.0;
        
        if (isAISpeaking) {
            // Cuando la IA habla: ondas más rápidas (1.8x), más intensas (1.5x) y pulsos más dinámicos
            waveSpeedMultiplier = 1.8;
            waveIntensityMultiplier = 1.5;
            pulseMultiplier = 1.6;
        }
        
        // Ondas primarias (rápidas) - más rápidas cuando la IA habla
        const wave1 = Math.sin(animationTime * point.speed * 4.2 * waveSpeedMultiplier + point.offset) * currentAmp * waveIntensityMultiplier;
        // Ondas secundarias (medias) - más dinámicas cuando la IA habla
        const wave2 = Math.sin(animationTime * point.speed * 3.1 * waveSpeedMultiplier + point.offset * 1.3) * currentAmp * 0.6 * waveIntensityMultiplier;
        // Ondas terciarias (lentas) para suavidad - más rápidas cuando la IA habla
        const wave3 = Math.sin(animationTime * point.speed * 1.8 * waveSpeedMultiplier + point.offset * 0.7) * currentAmp * 0.3 * waveIntensityMultiplier;
        const audioWave = wave1 + wave2 + wave3;
        
        // Pulso orgánico con múltiples frecuencias - más intenso cuando la IA habla
        const pulse1 = Math.sin(animationTime * 2.6 * pulseMultiplier) * 5 * enhancedIntensity * pulseMultiplier;
        const pulse2 = Math.sin(animationTime * 1.4 * pulseMultiplier) * 2.5 * (1 - enhancedIntensity * 0.5) * pulseMultiplier;
        const pulse3 = Math.sin(animationTime * 0.8 * pulseMultiplier) * 1.5 * enhancedIntensity * pulseMultiplier;
        const pulse = pulse1 + pulse2 + pulse3;

        const radius = baseRadius + audioWave + pulse;
        
        // Generar puntos para tres capas (anillo más grueso visualmente)
        paths.outer.push({
            x: Math.cos(point.angle) * (radius + ringWidth * 0.15),
            y: Math.sin(point.angle) * (radius + ringWidth * 0.15)
        });
        paths.middle.push({
            x: Math.cos(point.angle) * radius,
            y: Math.sin(point.angle) * radius
        });
        paths.inner.push({
            x: Math.cos(point.angle) * (radius - ringWidth * 0.15),
            y: Math.sin(point.angle) * (radius - ringWidth * 0.15)
        });
    }
    
    // === CAPA 1: HALO EXTERIOR ULTRA SUAVE ===
    ctx.beginPath();
    paths.outer.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    const haloGradient = ctx.createRadialGradient(0, 0, baseRadius * 0.3, 0, 0, baseRadius * 1.5);
    haloGradient.addColorStop(0, `rgba(100, 220, 255, ${0.08 + enhancedIntensity * 0.12})`);
    haloGradient.addColorStop(0.5, `rgba(80, 200, 255, ${0.12 + enhancedIntensity * 0.18})`);
    haloGradient.addColorStop(1, `rgba(0, 150, 255, ${0.04 + enhancedIntensity * 0.08})`);
    
    ctx.fillStyle = haloGradient;
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 120 + enhancedIntensity * 80;
    ctx.shadowColor = `rgba(100, 230, 255, ${0.6 + enhancedIntensity * 0.3})`;
    ctx.fill();
    
    // === CAPA 2: BORDE PRINCIPAL CON GRADIENTE PERFECTO ===
    ctx.beginPath();
    paths.middle.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    const mainGradient = ctx.createRadialGradient(0, 0, baseRadius - ringWidth * 0.5, 0, 0, baseRadius + ringWidth * 0.5);
    mainGradient.addColorStop(0, `rgba(0, 80, 160, ${0.32 + enhancedIntensity * 0.28})`);
    mainGradient.addColorStop(0.3, `rgba(0, 120, 220, ${0.65 + enhancedIntensity * 0.2})`);
    mainGradient.addColorStop(0.5, `rgba(0, 170, 255, ${0.85 + enhancedIntensity * 0.1})`);
    mainGradient.addColorStop(0.7, `rgba(100, 240, 255, ${0.95 + enhancedIntensity * 0.05})`);
    mainGradient.addColorStop(0.85, `rgba(0, 170, 255, ${0.75 + enhancedIntensity * 0.15})`);
    mainGradient.addColorStop(1, `rgba(0, 100, 180, ${0.25 + enhancedIntensity * 0.2})`);
    
    ctx.strokeStyle = mainGradient;
    ctx.lineWidth = ringWidth * 0.4;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 45 + enhancedIntensity * 55;
    ctx.shadowColor = `rgba(0, 220, 255, ${0.85 + enhancedIntensity * 0.15})`;
    ctx.stroke();
    
    // === CAPA 3: BRILLO INTERNO ADITIVO ===
    ctx.beginPath();
    paths.middle.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    ctx.strokeStyle = `rgba(150, 240, 255, ${0.22 + enhancedIntensity * 0.28})`;
    ctx.lineWidth = ringWidth * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 90 + enhancedIntensity * 70;
    ctx.shadowColor = `rgba(150, 240, 255, ${0.85 + enhancedIntensity * 0.15})`;
    ctx.stroke();
    
    // === CAPA 4: FILO INTERNO PRECISO ===
    ctx.beginPath();
    paths.inner.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    const innerGradient = ctx.createLinearGradient(-baseRadius, 0, baseRadius, 0);
    innerGradient.addColorStop(0, `rgba(0, 140, 230, ${0.4 + enhancedIntensity * 0.3})`);
    innerGradient.addColorStop(0.5, `rgba(0, 180, 255, ${0.5 + enhancedIntensity * 0.35})`);
    innerGradient.addColorStop(1, `rgba(0, 140, 230, ${0.4 + enhancedIntensity * 0.3})`);
    
    ctx.strokeStyle = innerGradient;
    ctx.lineWidth = Math.max(1.5, ringWidth * 0.12);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 15 + enhancedIntensity * 20;
    ctx.shadowColor = `rgba(0, 180, 255, ${0.65 + enhancedIntensity * 0.25})`;
    ctx.stroke();
    
    // === CAPA 5: PUNTOS DE ENERGÍA BRILLANTES (adicional) ===
    // Más puntos y más brillantes cuando la IA habla
    const sparkleThreshold = isAISpeaking ? 0.2 : 0.3;
    const sparkleCount = isAISpeaking ? 18 : 12;
    
    if (enhancedIntensity > sparkleThreshold) {
        ctx.globalCompositeOperation = 'lighter';
        const speedMultiplier = isAISpeaking ? 1.8 : 1.0;
        for (let i = 0; i < totalPoints; i += Math.floor(totalPoints / sparkleCount)) {
            const point = orbPoints[i];
            const radius = baseRadius + Math.sin(animationTime * point.speed * 4 * speedMultiplier + point.offset) * (point.waveSize * 0.4 * enhancedIntensity * (isAISpeaking ? 1.3 : 1.0));
            const x = Math.cos(point.angle) * radius;
            const y = Math.sin(point.angle) * radius;
            
            const sparkleIntensity = isAISpeaking 
                ? 0.4 + enhancedIntensity * 0.8 
                : 0.3 + enhancedIntensity * 0.7;
            ctx.fillStyle = `rgba(200, 250, 255, ${sparkleIntensity})`;
            ctx.shadowBlur = (isAISpeaking ? 35 : 25) + enhancedIntensity * (isAISpeaking ? 45 : 35);
            ctx.shadowColor = `rgba(200, 250, 255, 0.9)`;
            ctx.beginPath();
            ctx.arc(x, y, (isAISpeaking ? 2.5 : 2) + enhancedIntensity * (isAISpeaking ? 2.5 : 2), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}
