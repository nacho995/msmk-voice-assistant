"""
VoiceAssistantService - Orquestador del pipeline completo STT→LLM→TTS.

Application layer service que coordina toda la conversación por voz.
"""

from uuid import UUID
from typing import Optional, Tuple
from time import time

from loguru import logger

from ..infrastructure.stt.whisper_client import WhisperSTTClient
from ..infrastructure.llm.lm_studio_client import LMStudioClient
from ..infrastructure.tts.pyttsx3_client import Pyttsx3TTSClient
from .conversation_service import ConversationService


class VoiceAssistantService:
    """
    Servicio principal que orquesta el pipeline completo de voz conversacional.
    
    Pipeline:
    1. Audio bytes → STT (Whisper) → Texto transcrito
    2. Texto + Memoria → LLM (LM Studio) → Respuesta
    3. Respuesta → TTS (pyttsx3) → Audio bytes
    
    Responsibilities:
    - Coordinar STT, LLM, TTS
    - Gestionar memoria conversacional
    - Medir latencia end-to-end
    - Error handling robusto
    """
    
    def __init__(
        self,
        stt_client: WhisperSTTClient,
        llm_client: LMStudioClient,
        tts_client: Pyttsx3TTSClient,
        conversation_service: ConversationService
    ):
        """
        Inicializar servicio de asistente de voz.
        
        Args:
            stt_client: Cliente para Speech-to-Text (Whisper)
            llm_client: Cliente para LLM (LM Studio)
            tts_client: Cliente para Text-to-Speech (pyttsx3)
            conversation_service: Servicio de conversaciones
        """
        self.stt = stt_client
        self.llm = llm_client
        self.tts = tts_client
        self.conversations = conversation_service
        
        logger.info("🎙️ VoiceAssistantService initialized")
    
    async def process_voice_input(
        self,
        audio_bytes: bytes,
        session_id: UUID,
        language: str = "es"
    ) -> Tuple[str, str, bytes, dict[str, float]]:
        """
        Procesar input de voz completo: Audio → Texto → Respuesta → Audio.
        
        Args:
            audio_bytes: Audio del usuario en bytes
            session_id: ID de la sesión conversacional
            language: Idioma del audio (default: español)
            
        Returns:
            Tupla con:
            - transcribed_text: Texto transcrito del usuario
            - response_text: Respuesta del asistente (texto)
            - response_audio: Respuesta del asistente (audio bytes)
            - latency: Dict con tiempos de cada etapa
            
        Raises:
            ValueError: Si audio_bytes está vacío o session_id inválido
            RuntimeError: Si STT (Whisper) falla durante transcripción
            RuntimeError: Si LLM (LM Studio) falla o no está disponible
            RuntimeError: Si TTS (pyttsx3) falla durante síntesis
            Exception: Cualquier error inesperado en el pipeline
        """
        total_start = time()
        latencies = {}
        
        logger.info(f"🎤 Processing voice input for session: {session_id}")
        
        try:
            # === STEP 1: Speech-to-Text ===
            stt_start = time()
            transcribed_text = await self.stt.transcribe_audio(audio_bytes, language)
            latencies['stt'] = time() - stt_start
            
            logger.info(f"📝 Transcribed: '{transcribed_text}'")
            
            # === STEP 2: Obtener/Crear Conversación ===
            conversation = self.conversations.get_or_create_conversation(session_id)
            
            # === STEP 3: Agregar mensaje del usuario ===
            conversation.add_user_message(transcribed_text)
            
            # === STEP 4: Generar respuesta con LLM ===
            llm_start = time()
            messages = conversation.get_messages_for_llm()
            response_text = await self.llm.generate_response(messages)
            latencies['llm'] = time() - llm_start
            
            logger.info(f"🤖 LLM Response: '{response_text}'")
            
            # === STEP 5: Agregar respuesta a conversación ===
            conversation.add_assistant_message(response_text)
            
            # === STEP 6: Text-to-Speech ===
            tts_start = time()
            response_audio = await self.tts.synthesize_speech(response_text)
            latencies['tts'] = time() - tts_start
            
            # === STEP 7: Métricas ===
            latencies['total'] = time() - total_start
            
            logger.info(
                f"✅ Pipeline completed in {latencies['total']:.2f}s "
                f"(STT: {latencies['stt']:.2f}s, "
                f"LLM: {latencies['llm']:.2f}s, "
                f"TTS: {latencies['tts']:.2f}s)"
            )
            
            return transcribed_text, response_text, response_audio, latencies
            
        except Exception as e:
            logger.error(f"❌ Voice pipeline failed: {e}")
            raise RuntimeError(f"Voice processing error: {e}") from e
    
    async def process_text_input(
        self,
        text: str,
        session_id: UUID
    ) -> Tuple[str, bytes, dict[str, float]]:
        """
        Procesar input de texto (sin STT, para testing/debugging).
        
        Args:
            text: Texto del usuario
            session_id: ID de la sesión
            
        Returns:
            Tupla con:
            - response_text: Respuesta del asistente (texto)
            - response_audio: Respuesta del asistente (audio bytes)
            - latency: Dict con tiempos
            
        Raises:
            ValueError: Si text está vacío
            RuntimeError: Si LLM (LM Studio) falla o no está disponible
            RuntimeError: Si TTS (pyttsx3) falla durante síntesis
            Exception: Cualquier error inesperado en el pipeline
        """
        total_start = time()
        latencies = {}
        
        logger.info(f"💬 Processing text input for session: {session_id}")
        
        try:
            # Obtener/Crear conversación
            conversation = self.conversations.get_or_create_conversation(session_id)
            
            # Agregar mensaje del usuario
            conversation.add_user_message(text)
            
            # Generar respuesta con LLM
            llm_start = time()
            messages = conversation.get_messages_for_llm()
            response_text = await self.llm.generate_response(messages)
            latencies['llm'] = time() - llm_start
            
            # Agregar respuesta a conversación
            conversation.add_assistant_message(response_text)
            
            # Text-to-Speech
            tts_start = time()
            response_audio = await self.tts.synthesize_speech(response_text)
            latencies['tts'] = time() - tts_start
            
            latencies['total'] = time() - total_start
            
            logger.info(f"✅ Text pipeline completed in {latencies['total']:.2f}s")
            
            return response_text, response_audio, latencies
            
        except Exception as e:
            logger.error(f"❌ Text pipeline failed: {e}")
            raise RuntimeError(f"Text processing error: {e}") from e
    
    async def get_conversation_history(
        self,
        session_id: UUID
    ) -> Optional[list[dict[str, str]]]:
        """
        Obtener historial de conversación para display.
        
        Args:
            session_id: ID de la sesión
            
        Returns:
            Lista de mensajes o None si conversación no existe
        """
        conversation = self.conversations.get_conversation(session_id)
        
        if conversation is None:
            return None
        
        return conversation.get_messages_for_display()
    
    async def clear_conversation(
        self,
        session_id: UUID,
        keep_system: bool = True
    ) -> bool:
        """
        Limpiar historial de una conversación.
        
        Args:
            session_id: ID de la sesión
            keep_system: Si mantener mensaje del sistema
            
        Returns:
            True si se limpió, False si conversación no existe
        """
        conversation = self.conversations.get_conversation(session_id)
        
        if conversation is None:
            return False
        
        self.conversations.clear_conversation(session_id, keep_system)
        logger.info(f"🧹 Conversation cleared: {session_id}")
        return True
    
    async def health_check(self) -> dict[str, bool]:
        """
        Verificar salud de todos los componentes.
        
        Returns:
            Dict con estado de cada componente
        """
        logger.info("🏥 Running health check...")
        
        # Verificar LLM (crítico)
        llm_healthy = await self.llm.health_check()
        
        # Verificar TTS (puede fallar sin romper todo)
        tts_healthy = await self.tts.health_check()
        
        # STT no tiene health check async simple, asumimos OK
        stt_healthy = True
        
        health = {
            "stt": stt_healthy,
            "llm": llm_healthy,
            "tts": tts_healthy,
            "overall": llm_healthy and stt_healthy  # TTS no es crítico
        }
        
        if health["overall"]:
            logger.info("✅ All critical systems healthy")
        else:
            logger.warning("⚠️ Some systems unhealthy")
        
        return health
    
    def cleanup(self) -> None:
        """Limpiar recursos de todos los clientes."""
        logger.info("🧹 Cleaning up VoiceAssistantService")
        self.stt.cleanup()
        self.llm.cleanup()
        self.tts.cleanup()

