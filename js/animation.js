/* ===== LOOP DE ANIMACIÓN ===== */

let animationTime = 0;

function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animationTime += 0.016;
    
    actualizarPulso();
    actualizarVoiceLevel();
    const intensity = calcularIntensidad();
    
    dibujarResplandores(animationTime, intensity);
    dibujarRayosSolares(animationTime, intensity);
    dibujarOrbePrincipal(animationTime, intensity);
    dibujarParticulas(intensity, animationTime);
    dibujarAnilloExterior(intensity);
    
    // Actualizar barras de frecuencia según nivel de voz
    if (freqBars) {
        const bars = freqBars.children;
        for (let i = 0; i < bars.length; i++) {
            const randomJitter = 0.3 + Math.abs(Math.sin(animationTime * (1.2 + i * 0.13))) * 0.7;
            const scale = 0.3 + currentVoiceLevel * 0.9 * randomJitter;
            bars[i].style.transform = `scaleY(${scale.toFixed(3)})`;
            bars[i].style.opacity = (0.4 + currentVoiceLevel * 0.6).toFixed(2);
        }
    }
    
    requestAnimationFrame(animar);
}
