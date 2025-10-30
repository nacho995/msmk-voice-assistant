/* ===== INTEGRACIÓN CON IA DE PYTHON ===== */

// ========================================================================
// ███████╗██╗   ██╗███╗   ██╗ ██████╗██╗ ██████╗ ███╗   ██╗    ██╗ █████╗ 
// ██╔════╝██║   ██║████╗  ██║██╔════╝██║██╔═══██╗████╗  ██║    ██║██╔══██╗
// █████╗  ██║   ██║██╔██╗ ██║██║     ██║██║   ██║██╔██╗ ██║    ██║███████║
// ██╔══╝  ██║   ██║██║╚██╗██║██║     ██║██║   ██║██║╚██╗██║    ██║██╔══██║
// ██║     ╚██████╔╝██║ ╚████║╚██████╗██║╚██████╔╝██║ ╚████║    ██║██║  ██║
// ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═╝
// ========================================================================
// ESTA ES LA FUNCIÓN PRINCIPAL PARA INTEGRAR CON LA IA DE PYTHON
// 
// TU COMPAÑERO DEBE LLAMAR A ESTA FUNCIÓN DESDE PYTHON PARA CONTROLAR
// LA ANIMACIÓN DEL ORBE SEGÚN LA VOZ DE LA IA
//
// PARÁMETROS:
//   - level (número entre 0 y 1):
//     * 0 = Silencio total (orbe quieto)
//     * 0.5 = Voz media (orbe con movimiento moderado)
//     * 1 = Voz alta (orbe con máximo movimiento)
//
// EJEMPLO DE USO DESDE PYTHON:
//   pywebview.api.call_js_function('updateAIVoiceLevel', 0.7)
//
// EJEMPLO DE USO DESDE CONSOLA DEL NAVEGADOR:
//   window.updateAIVoiceLevel(0.8)
//
// CÓMO FUNCIONA:
//   - Cuando la IA habla, el nivel de voz aumenta (0 a 1)
//   - El orbe azul se mueve más intensamente cuanto mayor sea el nivel
//   - Las partículas orbitales se animan según la intensidad
//   - El resplandor aumenta con la voz
//   - Todo se suaviza automáticamente para evitar saltos bruscos
// ========================================================================
function updateAIVoiceLevel(level) {
    if (!systemActive) {
        targetVoiceLevel = 0;
        return;
    }
    // Limitar el valor entre 0 y 1
    targetVoiceLevel = Math.max(0, Math.min(1, level));
}

// Exponer la función globalmente para que Python pueda llamarla
window.updateAIVoiceLevel = updateAIVoiceLevel;
