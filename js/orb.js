/* ===== RENDERIZADO DEL ANILLO EXTERIOR - ESTELA SOLAR ===== */

// Dibujar anillo ondulado alrededor del círculo exterior
function dibujarOrbePrincipal(animationTime, intensity) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Radio base del anillo - FUERA Y ALREDEDOR DEL REACTOR CENTRAL (estilo Iron Man)
    const baseRadius = orbRadius * 5.6;
    const ringWidthBase = orbRadius * 5.2;
    const ringWidth = ringWidthBase * (0.28 + intensity * 0.22); // grosor responde a la intensidad
    
    // Dibujar el anillo con ondas
    ctx.beginPath();
    for (let i = 0; i <= totalPoints; i++) {
        const point = orbPoints[i % totalPoints];
        
        const minAmp = 2;
        const maxAmp = point.waveSize * 0.5;
        const currentAmp = minAmp + (maxAmp - minAmp) * intensity;
        
        const wave1 = Math.sin(animationTime * point.speed * 4 + point.offset) * currentAmp;
        const wave2 = Math.sin(animationTime * point.speed * 3 + point.offset * 1.3) * currentAmp * 0.5;
        const audioWave = wave1 + wave2;
        
        const pulse = Math.sin(animationTime * 2.5) * 4 * intensity + 
                     Math.sin(animationTime * 1.5) * 2 * (1 - intensity);

        const radius = baseRadius + audioWave + pulse;
        const x = Math.cos(point.angle) * radius;
        const y = Math.sin(point.angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();

    // Capa 1: borde principal con gradiente radial
    const g1 = ctx.createRadialGradient(0, 0, baseRadius - ringWidth * 0.4, 0, 0, baseRadius + ringWidth * 0.4);
    g1.addColorStop(0, `rgba(0, 90, 170, ${0.28 + intensity * 0.22})`);
    g1.addColorStop(0.45, `rgba(0, 160, 255, ${0.75 + intensity * 0.15})`);
    g1.addColorStop(0.65, `rgba(120, 230, 255, ${0.9})`);
    g1.addColorStop(0.85, `rgba(0, 160, 255, ${0.7})`);
    g1.addColorStop(1, `rgba(0, 90, 170, ${0.22 + intensity * 0.18})`);

    ctx.strokeStyle = g1;
    ctx.lineWidth = ringWidth * 0.36;
    ctx.shadowBlur = 35 + intensity * 45;
    ctx.shadowColor = `rgba(0, 210, 255, ${0.8})`;
    ctx.stroke();

    // Capa 2: halo suave en modo aditivo
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(120, 230, 255, ${0.18 + intensity * 0.24})`;
    ctx.lineWidth = ringWidth * 0.2;
    ctx.shadowBlur = 80 + intensity * 60;
    ctx.shadowColor = `rgba(120, 230, 255, ${0.8})`;
    ctx.stroke();

    // Capa 3: filo interno sutil
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(0, 130, 220, ${0.35 + intensity * 0.25})`;
    ctx.lineWidth = Math.max(1, ringWidth * 0.08);
    ctx.shadowBlur = 10 + intensity * 15;
    ctx.shadowColor = `rgba(0, 160, 255, ${0.6})`;
    ctx.stroke();

    ctx.restore();
}
