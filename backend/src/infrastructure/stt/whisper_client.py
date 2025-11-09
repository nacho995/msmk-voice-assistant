"""
WhisperSTTClient - Cliente para Speech-to-Text usando faster-whisper.

Implementación optimizada para baja latencia con modelo Whisper local.
"""

import asyncio
import os
import tempfile
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

# IMPORTANTE: Configurar cache ANTES de importar faster-whisper
# Esto evita problemas de permisos en Windows
cache_dir = Path("./models/hf_cache").resolve()
cache_dir.mkdir(parents=True, exist_ok=True)

# Configurar TODAS las variables de HuggingFace para evitar D:\AI\hf_cache
os.environ["HF_HOME"] = str(cache_dir)
os.environ["TRANSFORMERS_CACHE"] = str(cache_dir)
os.environ["HF_HUB_CACHE"] = str(cache_dir)
os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache_dir)
os.environ["XDG_CACHE_HOME"] = str(cache_dir.parent)  # Unix-style cache

# ruff: noqa: E402 - Imports after cache config (required)
from faster_whisper import WhisperModel
from loguru import logger


class WhisperSTTClient:
    """
    Cliente para transcripción de audio usando faster-whisper.
    
    Optimizado para:
    - Baja latencia (modelo base/tiny)
    - Procesamiento async
    - Español como idioma principal
    """
    
    # Constantes de configuración de transcripción
    DEFAULT_BEAM_SIZE = 5  # Tamaño del beam para búsqueda (balance entre velocidad y precisión)
    VAD_MIN_SILENCE_MS = 500  # Silencio mínimo en ms para Voice Activity Detection
    
    def __init__(
        self,
        model_size: str,
        device: str,
        compute_type: str
    ):
        """
        Inicializar cliente Whisper.
        
        Args:
            model_size: Tamaño del modelo (tiny, base, small, medium, large)
            device: Device de computación (cpu o cuda)
            compute_type: Tipo de computación (int8, float16, float32)
        
        Note: Valores vienen de config.py (única fuente de verdad)
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        
        # El modelo se carga lazy para no bloquear startup
        self._model: Optional[WhisperModel] = None
        self._executor = ThreadPoolExecutor(max_workers=2)
        
        logger.info(
            f"🔊 WhisperSTT initialized: model={model_size}, "
            f"device={device}, compute={compute_type}"
        )
    
    def _ensure_model_loaded(self) -> WhisperModel:
        """
        Lazy loading del modelo Whisper.
        
        Carga el modelo solo cuando se necesita por primera vez.
        """
        if self._model is None:
            logger.info(f"📥 Loading Whisper model '{self.model_size}'...")
            
            # Usar cache local explícitamente
            cache_dir = Path("./models/hf_cache").resolve()
            
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(cache_dir)  # Forzar download en directorio local
            )
            
            logger.info(f"✅ Whisper model '{self.model_size}' loaded successfully")
        
        return self._model
    
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language: str = "es"
    ) -> str:
        """
        Transcribir audio a texto de forma asíncrona.
        
        Args:
            audio_bytes: Audio en bytes (WAV, MP3, etc.)
            language: Código de idioma ISO (es, en, etc.)
            
        Returns:
            Texto transcrito
            
        Raises:
            ValueError: Si audio está vacío o corrupto
            RuntimeError: Si transcripción falla
        """
        if not audio_bytes:
            raise ValueError("Audio bytes cannot be empty")
        
        logger.info(f"🎤 Transcribing audio: {len(audio_bytes)} bytes, language={language}")
        
        try:
            # Ejecutar transcripción en thread pool (Whisper es CPU-bound)
            loop = asyncio.get_event_loop()
            transcribed_text = await loop.run_in_executor(
                self._executor,
                self._transcribe_sync,
                audio_bytes,
                language
            )
            
            logger.info(f"✅ Transcription successful: '{transcribed_text[:50]}...'")
            return transcribed_text
            
        except Exception as e:
            logger.error(f"❌ Transcription failed: {e}")
            raise RuntimeError(f"Whisper transcription error: {e}") from e
    
    def _transcribe_sync(self, audio_bytes: bytes, language: str) -> str:
        """
        Transcripción síncrona (ejecutada en thread pool).
        
        Guarda audio temporalmente porque faster-whisper requiere archivo.
        """
        model = self._ensure_model_loaded()
        
        # Crear archivo temporal para el audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = Path(temp_file.name)
        
        try:
            # Transcribir audio
            segments, info = model.transcribe(
                str(temp_path),
                language=language,
                beam_size=self.DEFAULT_BEAM_SIZE,
                vad_filter=True,  # Voice Activity Detection para mejor precisión
                vad_parameters=dict(min_silence_duration_ms=self.VAD_MIN_SILENCE_MS)
            )
            
            # Combinar todos los segmentos
            transcribed_text = " ".join(segment.text.strip() for segment in segments)
            
            logger.debug(
                f"Detected language: {info.language} "
                f"(probability: {info.language_probability:.2f})"
            )
            
            return transcribed_text.strip()
            
        finally:
            # Limpiar archivo temporal
            temp_path.unlink(missing_ok=True)
    
    async def transcribe_file(self, file_path: Path, language: str = "es") -> str:
        """
        Transcribir archivo de audio existente.
        
        Args:
            file_path: Ruta al archivo de audio
            language: Código de idioma
            
        Returns:
            Texto transcrito
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        # Leer archivo y transcribir
        audio_bytes = file_path.read_bytes()
        return await self.transcribe_audio(audio_bytes, language)
    
    def cleanup(self) -> None:
        """Limpiar recursos."""
        logger.info("🧹 Cleaning up WhisperSTT resources")
        self._executor.shutdown(wait=True)
        self._model = None

