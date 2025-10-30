/* ===== INICIALIZACIÓN ===== */

// Iniciar la animación
animar();

// ===== API PÚBLICA FRONTEND (sin backend) =====
// Permite controlar el sistema
window.updateAIVoiceLevel = function(level) {
    // Clamp 0..1
    const v = Math.max(0, Math.min(1, Number(level)));
    targetVoiceLevel = v;
};

window.setSystemActive = function(isActive) {
    const next = Boolean(isActive);
    if (systemActive !== next) {
        systemActive = next;
        actualizarInterfaz();
    }
};
