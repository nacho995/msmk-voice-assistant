"""
Pyttsx3TTSClient - Cliente para Text-to-Speech usando pyttsx3.

Implementación async wrapper para pyttsx3 (que es síncrono).
"""

import asyncio
import tempfile
from pathlib import Path
from typing import Optional, Any
from concurrent.futures import ThreadPoolExecutor

import pyttsx3
from loguru import logger


class Pyttsx3TTSClient:
    """
    Cliente para síntesis de voz usando pyttsx3.
    
    pyttsx3 es síncrono, por lo que usamos ThreadPoolExecutor
    para wrapping async sin bloquear el event loop.
    
    Optimizado para:
    - Baja latencia
    - Calidad de voz aceptable
    - Sistema completamente offline
    """
    
    def __init__(
        self,
        rate: int,
        volume: float,
        voice_index: int
    ):
        """
        Inicializar cliente TTS.
        
        Args:
            rate: Velocidad de habla (palabras por minuto)
            volume: Volumen de la voz (0.0 a 1.0)
            voice_index: Índice de voz del sistema (0=primera disponible)
        
        Note: Valores vienen de config.py (única fuente de verdad)
        """
        self.rate = rate
        self.volume = volume
        self.voice_index = voice_index
        
        # ThreadPool para operaciones síncronas
        self._executor = ThreadPoolExecutor(max_workers=2)
        
        # El engine se inicializa lazy
        self._engine: Optional[pyttsx3.Engine] = None
        self._voices: list[Any] = []  # pyttsx3.Voice no exporta tipos
        
        logger.info(
            f"🔈 Pyttsx3TTS initialized: rate={rate}, "
            f"volume={volume}, voice_index={voice_index}"
        )
    
    def _ensure_engine_initialized(self) -> pyttsx3.Engine:
        """
        Lazy initialization del engine pyttsx3.
        
        IMPORTANTE: pyttsx3 debe inicializarse en el mismo thread
        donde se usa, por eso creamos un nuevo engine cada vez.
        """
        import platform
        
        # En Linux/Docker, usar espeak explícitamente
        try:
            if platform.system() == 'Linux':
                engine = pyttsx3.init(driverName='espeak')
                logger.debug("Using espeak driver for Linux/Docker")
            else:
                engine = pyttsx3.init()
        except Exception as e:
            logger.warning(f"Failed to init specific driver, using default: {e}")
            engine = pyttsx3.init()
        
        # Configurar propiedades
        engine.setProperty('rate', self.rate)
        engine.setProperty('volume', self.volume)
        
        # Seleccionar voz (con manejo robusto de errores)
        try:
            voices = engine.getProperty('voices')
            if voices and len(voices) > 0:
                # Intentar usar el índice especificado
                if 0 <= self.voice_index < len(voices):
                    voice_id = voices[self.voice_index].id
                else:
                    # Usar primera voz disponible
                    voice_id = voices[0].id
                
                # Establecer voz (puede fallar en algunos sistemas)
                try:
                    engine.setProperty('voice', voice_id)
                    logger.debug(f"Using voice: {voices[self.voice_index if self.voice_index < len(voices) else 0].name}")
                except Exception as voice_error:
                    logger.warning(f"Could not set voice, using system default: {voice_error}")
            else:
                logger.warning("No voices available, using system default")
        except Exception as e:
            logger.warning(f"Voice configuration failed, using system default: {e}")
        
        return engine
    
    async def synthesize_speech(
        self,
        text: str,
        output_format: str = "wav"
    ) -> bytes:
        """
        Sintetizar texto a audio de forma asíncrona.
        
        Args:
            text: Texto para convertir a voz
            output_format: Formato de audio (wav o mp3)
            
        Returns:
            Audio sintetizado en bytes
            
        Raises:
            ValueError: Si texto está vacío
            RuntimeError: Si síntesis falla
        """
        if not text.strip():
            raise ValueError("Text cannot be empty")
        
        logger.info(f"🎙️ Synthesizing speech: '{text[:50]}...'")
        
        try:
            # Ejecutar síntesis en thread pool
            loop = asyncio.get_event_loop()
            audio_bytes = await loop.run_in_executor(
                self._executor,
                self._synthesize_sync,
                text,
                output_format
            )
            
            logger.info(f"✅ Speech synthesized: {len(audio_bytes)} bytes")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"❌ Speech synthesis failed: {e}")
            raise RuntimeError(f"TTS synthesis error: {e}") from e
    
    def _synthesize_sync(self, text: str, output_format: str) -> bytes:
        """
        Síntesis síncrona (ejecutada en thread pool).
        
        pyttsx3 guarda en archivo, luego leemos los bytes.
        """
        # Workaround para Docker: usar espeak directamente si pyttsx3 falla
        import platform
        import subprocess
        
        if platform.system() == 'Linux':
            # En Docker/Linux, usar espeak directamente
            try:
                # Crear archivo temporal
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_path = Path(temp_file.name)
                
                try:
                    # Usar espeak directamente (más confiable en Docker)
                    subprocess.run(
                        ['espeak', '-v', 'es', '-w', str(temp_path), text],
                        check=True,
                        capture_output=True
                    )
                    
                    # Leer bytes del archivo
                    audio_bytes = temp_path.read_bytes()
                    return audio_bytes
                    
                finally:
                    # Limpiar archivo temporal
                    temp_path.unlink(missing_ok=True)
                    
            except Exception as e:
                logger.warning(f"espeak direct call failed: {e}, falling back to pyttsx3")
                # Fallback a pyttsx3
        
        # Windows/Mac o fallback: usar pyttsx3
        engine = self._ensure_engine_initialized()
        
        # Crear archivo temporal para guardar audio
        suffix = f".{output_format}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_path = Path(temp_file.name)
        
        try:
            # Sintetizar y guardar
            engine.save_to_file(text, str(temp_path))
            engine.runAndWait()
            
            # Leer bytes del archivo
            audio_bytes = temp_path.read_bytes()
            
            return audio_bytes
            
        finally:
            # Limpiar archivo temporal
            temp_path.unlink(missing_ok=True)
            
            # Limpiar engine (importante para pyttsx3)
            try:
                engine.stop()
            except Exception as e:
                logger.debug(f"Engine stop warning (safe to ignore): {e}")
    
    async def synthesize_to_file(
        self,
        text: str,
        output_path: Path,
        output_format: str = "wav"
    ) -> None:
        """
        Sintetizar texto y guardar directamente a archivo.
        
        Args:
            text: Texto para sintetizar
            output_path: Ruta donde guardar el audio
            output_format: Formato de audio
        """
        audio_bytes = await self.synthesize_speech(text, output_format)
        output_path.write_bytes(audio_bytes)
        logger.info(f"💾 Audio saved to: {output_path}")
    
    def get_available_voices(self) -> list[dict[str, str]]:
        """
        Obtener lista de voces disponibles en el sistema.
        
        Returns:
            Lista de voces con id, name, languages
        """
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        
        voice_list = []
        for i, voice in enumerate(voices):
            voice_list.append({
                "index": i,
                "id": voice.id,
                "name": voice.name,
                "languages": voice.languages if hasattr(voice, 'languages') else []
            })
        
        engine.stop()
        return voice_list
    
    async def health_check(self) -> bool:
        """
        Verificar que TTS está funcional.
        
        Returns:
            True si puede sintetizar audio
        """
        try:
            # Intentar sintetizar texto simple
            await asyncio.wait_for(
                self.synthesize_speech("Test", "wav"),
                timeout=5.0
            )
            
            logger.info("✅ TTS health check passed")
            return True
            
        except asyncio.TimeoutError:
            logger.warning("⏱️ TTS health check timeout")
            return False
        except Exception as e:
            logger.warning(f"⚠️ TTS health check failed: {e}")
            return False
    
    def cleanup(self) -> None:
        """Limpiar recursos."""
        logger.info("🧹 Cleaning up Pyttsx3TTS resources")
        self._executor.shutdown(wait=True)

