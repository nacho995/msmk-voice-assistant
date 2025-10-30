/* ===== EVENTOS DE USUARIO ===== */

// Eventos de click y touch en el reactor
orbeCircle.addEventListener('click', alternarSistema);

orbeCircle.addEventListener('touchstart', (e) => {
    alternarSistema();
    e.preventDefault();
});
