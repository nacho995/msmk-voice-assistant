/* ===== CHAT DORADO DE CONVERSACIÓN TIPO SCREEN ===== */

// Elementos del DOM
let contenedorChatDorado = null;
let contenedorScreen = null;
let estaExpandido = false;

// Configuración
const CONFIG_CHAT = {
    VELOCIDAD_ESCRITURA: 30, // ms entre cada letra
    TIEMPO_DESVANECIMIENTO: 2000, // ms para desaparecer hacia arriba
    TIEMPO_DESPUES_MENSAJE: 2000, // ms antes de mostrar siguiente mensaje
};

// Historial de mensajes
let historialMensajes = [];
let mensajeEscribiendoActual = null;
let mensajeActual = null;
let colaMensajes = [];

// Inicializar el chat dorado
function inicializarChatDorado() {
    contenedorChatDorado = document.getElementById('goldChat');
    
    if (!contenedorChatDorado) {
        console.warn('Contenedor del chat dorado no encontrado');
        return;
    }
    
    // Crear contenedor principal para screen
    contenedorScreen = document.createElement('div');
    contenedorScreen.className = 'gold-screen-container';
    contenedorScreen.id = 'goldScreenContainer';
    
    // Contenedor para mensaje actual (centrado)
    const contenedorActual = document.createElement('div');
    contenedorActual.className = 'gold-message-actual-container';
    contenedorActual.id = 'goldMessageActual';
    
    // Contenedor para historial (scrollable) - siempre visible
    const historialContainer = document.createElement('div');
    historialContainer.className = 'gold-historial-container';
    historialContainer.id = 'goldHistorial';
    historialContainer.style.display = 'flex';
    
    // Evento de click deshabilitado - solo permite scroll
    // No hacer nada al hacer click, solo permitir scroll
    
    // Limpiar contenido antiguo y añadir nueva estructura
    const mensajesAntiguos = contenedorChatDorado.querySelector('#goldChatMessages');
    if (mensajesAntiguos) {
        mensajesAntiguos.remove();
    }
    
    contenedorChatDorado.appendChild(contenedorScreen);
    // Orden: historial primero (arriba), mensaje actual después (abajo)
    contenedorScreen.appendChild(historialContainer);
    contenedorScreen.appendChild(contenedorActual);
    
    // Auto-scroll al final cuando se añade un nuevo mensaje
    const observer = new MutationObserver(() => {
        if (contenedorScreen) {
            contenedorScreen.scrollTop = contenedorScreen.scrollHeight;
        }
    });
    observer.observe(contenedorScreen, { childList: true, subtree: true });
    
    console.log('Chat dorado SCREEN inicializado');
}

// Alternar entre vista compacta y expandida
function alternarExpansion() {
    estaExpandido = !estaExpandido;
    const contenedorActual = document.getElementById('goldMessageActual');
    const historialContainer = document.getElementById('goldHistorial');
    
    if (estaExpandido) {
        // Mostrar historial y ocultar mensaje actual
        if (historialContainer) historialContainer.style.display = 'flex';
        if (contenedorActual) contenedorActual.style.display = 'none';
        // Scroll al final para ver el más reciente
        setTimeout(() => {
            if (contenedorScreen) {
                contenedorScreen.scrollTop = contenedorScreen.scrollHeight;
            }
        }, 100);
    } else {
        // Ocultar historial y mostrar mensaje actual
        if (historialContainer) historialContainer.style.display = 'none';
        if (contenedorActual) contenedorActual.style.display = 'block';
        // Resetear scroll
        if (contenedorScreen) contenedorScreen.scrollTop = 0;
    }
}

// Añadir mensaje al chat con comportamiento tipo SCREEN
function agregarMensajeAChatDorado(texto, emisor = 'ai') {
    if (!contenedorScreen) {
        inicializarChatDorado();
        if (!contenedorScreen) return;
    }
    
    // Añadir a la cola
    colaMensajes.push({ texto, emisor });
    
    // Si no hay mensaje actual, procesar inmediatamente
    if (!mensajeActual) {
        procesarSiguienteMensaje();
    }
}

// Procesar siguiente mensaje de la cola
async function procesarSiguienteMensaje() {
    if (colaMensajes.length === 0) {
        mensajeActual = null;
        return;
    }
    
    const { texto, emisor } = colaMensajes.shift();
    const contenedorActual = document.getElementById('goldMessageActual');
    
    if (!contenedorActual) return;
    
    // Si hay un mensaje anterior, hacerlo desaparecer hacia arriba y moverlo al historial
    if (mensajeActual) {
        // Mover mensaje anterior al historial ANTES de hacerlo desaparecer
        moverMensajeAHistorial(mensajeActual);
        await hacerDesaparecerMensaje(mensajeActual);
    }
    
    // Crear y mostrar nuevo mensaje
    const nuevoMensaje = crearMensajeScreen(texto, emisor);
    nuevoMensaje.elemento.classList.add('message-actual');
    
    contenedorActual.innerHTML = '';
    contenedorActual.appendChild(nuevoMensaje.elemento);
    mensajeActual = nuevoMensaje;
    
    // Guardar en historial
    historialMensajes.push({
        texto,
        emisor,
        timestamp: Date.now()
    });
    
    // Escribir texto letra por letra
    const elementoContenido = nuevoMensaje.elemento.querySelector('.gold-screen-text');
    escribirTextoLetraPorLetra(elementoContenido, texto, async () => {
        // Auto-scroll al final cuando termine de escribir
        if (contenedorScreen) {
            setTimeout(() => {
                contenedorScreen.scrollTop = contenedorScreen.scrollHeight;
            }, 100);
        }
        // Cuando termine de escribir, esperar un poco y luego procesar siguiente
        await esperar(CONFIG_CHAT.TIEMPO_DESPUES_MENSAJE);
        procesarSiguienteMensaje();
    });
}

// Mover mensaje al historial
function moverMensajeAHistorial(mensaje) {
    const historialContainer = document.getElementById('goldHistorial');
    if (!historialContainer || !mensaje) return;
    
    // Obtener el mensaje anterior del historial (el que se está moviendo)
    const mensajeAnterior = historialMensajes[historialMensajes.length - 1];
    if (!mensajeAnterior) return;
    
    // Crear nuevo elemento para el historial
    const elementoHistorial = document.createElement('div');
    elementoHistorial.className = `gold-screen-message message-historial ${mensajeAnterior.emisor}`;
    
    const textoElemento = document.createElement('div');
    textoElemento.className = 'gold-screen-text';
    textoElemento.textContent = mensajeAnterior.texto;
    
    elementoHistorial.appendChild(textoElemento);
    
    // Insertar al principio para que los más antiguos estén arriba
    historialContainer.insertBefore(elementoHistorial, historialContainer.firstChild);
}

// Hacer desaparecer mensaje hacia arriba
async function hacerDesaparecerMensaje(mensaje) {
    return new Promise((resolve) => {
        if (!mensaje || !mensaje.elemento) {
            resolve();
            return;
        }
        
        mensaje.elemento.classList.add('fading-up-screen');
        
        setTimeout(() => {
            if (mensaje.elemento && mensaje.elemento.parentNode) {
                mensaje.elemento.style.display = 'none';
            }
            resolve();
        }, CONFIG_CHAT.TIEMPO_DESVANECIMIENTO);
    });
}

// Crear mensaje screen
function crearMensajeScreen(texto, emisor) {
    const elementoMensaje = document.createElement('div');
    elementoMensaje.className = `gold-screen-message ${emisor}`;
    
    // Crear texto del mensaje
    const elementoContenido = document.createElement('div');
    elementoContenido.className = 'gold-screen-text typing';
    
    elementoMensaje.appendChild(elementoContenido);
    
    return { elemento: elementoMensaje, contenido: elementoContenido };
}

// Escribir texto letra por letra con efecto de aparición
function escribirTextoLetraPorLetra(elemento, texto, retrollamada) {
    // Limpiar si hay otro mensaje escribiéndose
    if (mensajeEscribiendoActual) {
        clearTimeout(mensajeEscribiendoActual.idTiempoEspera);
    }
    
    elemento.innerHTML = '';
    let indice = 0;
    
    const escribirCaracter = () => {
        if (indice < texto.length) {
            const caracter = texto[indice];
            const spanCaracter = document.createElement('span');
            spanCaracter.className = 'char';
            // Manejar caracteres especiales correctamente
            spanCaracter.textContent = caracter === ' ' ? '\u00A0' : caracter;
            spanCaracter.style.animationDelay = `${indice * 0.015}s`;
            elemento.appendChild(spanCaracter);
            
            indice++;
            const idTiempoEspera = setTimeout(escribirCaracter, CONFIG_CHAT.VELOCIDAD_ESCRITURA);
            mensajeEscribiendoActual = { idTiempoEspera, elemento };
        } else {
            mensajeEscribiendoActual = null;
            if (retrollamada) retrollamada();
        }
    };
    
    escribirCaracter();
}

// Función auxiliar para esperar
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para añadir mensaje del usuario
function agregarMensajeUsuario(texto) {
    agregarMensajeAChatDorado(texto, 'user');
}

// Función para añadir mensaje de la IA
function agregarMensajeIA(texto) {
    agregarMensajeAChatDorado(texto, 'ai');
}

// Exponer funciones globalmente (mantener nombres en inglés para compatibilidad)
window.initGoldChat = inicializarChatDorado;
window.addUserMessage = agregarMensajeUsuario;
window.addAIMessage = agregarMensajeIA;
window.addMessageToGoldChat = agregarMensajeAChatDorado;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarChatDorado);
} else {
    inicializarChatDorado();
}
