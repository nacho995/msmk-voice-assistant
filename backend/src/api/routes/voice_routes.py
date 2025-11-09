"""
Voice Routes - Endpoints para procesamiento de voz.

Endpoints:
- POST /voice/process - Procesar audio y retornar respuesta
- POST /text/process - Procesar texto (para testing)
- GET /conversation/{session_id} - Obtener historial
- DELETE /conversation/{session_id} - Limpiar conversación
- WebSocket /ws/voice - Streaming (futuro)
"""

import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import Response, JSONResponse
from uuid import UUID, uuid4
from loguru import logger

from ..models import (
    VoiceProcessResponse,
    TextProcessRequest,
    TextProcessResponse,
    ConversationHistoryResponse,
    ErrorResponse
)
from ...application.voice_assistant_service import VoiceAssistantService


router = APIRouter()


def get_voice_service() -> VoiceAssistantService:
    """Obtener instancia del servicio de voz (inyectada en main.py)."""
    from ..main import voice_service
    return voice_service


@router.post(
    "/voice/process",
    response_model=VoiceProcessResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def process_voice(
    audio: UploadFile = File(..., description="Audio file (WAV, MP3, WEBM, etc.)"),
    session_id: str = Form(None, description="Session ID (optional, auto-generated if not provided)"),
    language: str = Form("es", description="Language code (es, en, etc.)")
):
    """
    Procesar audio de voz y retornar respuesta.
    
    Pipeline completo:
    1. Transcribir audio a texto (STT)
    2. Generar respuesta con LLM usando memoria conversacional
    3. Sintetizar respuesta a audio (TTS)
    4. Retornar texto + audio
    
    El audio de respuesta se retorna como base64 en JSON junto con el texto.
    """
    try:
        # Parsear session_id
        if session_id:
            try:
                sid = UUID(session_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid session_id format")
        else:
            sid = uuid4()
        
        # Leer audio bytes
        audio_bytes = await audio.read()
        
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        logger.info(f"📨 Received voice request: session={sid}, audio_size={len(audio_bytes)} bytes")
        
        # Procesar con servicio
        service = get_voice_service()
        transcribed, response_text, response_audio, latency = await service.process_voice_input(
            audio_bytes=audio_bytes,
            session_id=sid,
            language=language
        )
        
        # Retornar respuesta con audio como bytes
        # Texto en base64 para evitar problemas con caracteres Unicode en headers
        transcribed_b64 = base64.b64encode(transcribed.encode('utf-8')).decode('ascii')
        response_text_b64 = base64.b64encode(response_text.encode('utf-8')).decode('ascii')
        
        return Response(
            content=response_audio,
            media_type="audio/wav",
            headers={
                "X-Session-ID": str(sid),
                "X-Transcribed-Text": transcribed_b64,  # Base64 encoded
                "X-Response-Text": response_text_b64,    # Base64 encoded
                "X-Latency-Total": str(latency["total"]),
                "X-Latency-STT": str(latency["stt"]),
                "X-Latency-LLM": str(latency["llm"]),
                "X-Latency-TTS": str(latency["tts"])
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Voice processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/text/process",
    response_model=TextProcessResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def process_text(request: TextProcessRequest):
    """
    Procesar texto sin voz (para testing/debugging).
    
    Útil para probar el LLM sin necesidad de audio.
    """
    try:
        # Usar o generar session_id
        sid = request.session_id or uuid4()
        
        logger.info(f"📨 Received text request: session={sid}")
        
        # Procesar con servicio
        service = get_voice_service()
        response_text, response_audio, latency = await service.process_text_input(
            text=request.text,
            session_id=sid
        )
        
        return TextProcessResponse(
            session_id=sid,
            response_text=response_text,
            latency=latency
        )
        
    except Exception as e:
        logger.error(f"❌ Text processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/conversation/{session_id}",
    response_model=ConversationHistoryResponse,
    responses={404: {"model": ErrorResponse}}
)
async def get_conversation_history(session_id: UUID):
    """
    Obtener historial completo de una conversación.
    
    Útil para sincronizar frontend o debugging.
    """
    try:
        service = get_voice_service()
        messages = await service.get_conversation_history(session_id)
        
        if messages is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            message_count=len(messages)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/conversation/{session_id}",
    responses={
        200: {"description": "Conversation cleared"},
        404: {"model": ErrorResponse}
    }
)
async def clear_conversation(
    session_id: UUID,
    keep_system: bool = True
):
    """
    Limpiar historial de una conversación.
    
    Args:
        session_id: ID de la sesión
        keep_system: Si mantener el mensaje del sistema (default: True)
    """
    try:
        service = get_voice_service()
        cleared = await service.clear_conversation(session_id, keep_system)
        
        if not cleared:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation cleared", "session_id": str(session_id)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error clearing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voice/health")
async def health_check(
    service: VoiceAssistantService = Depends(get_voice_service)
):
    """
    Health check endpoint para Docker y monitoreo.
    
    Returns:
        JSON con estado de salud de todos los componentes
    """
    try:
        health_status = await service.health_check()
        
        return JSONResponse(
            content={
                "status": "healthy" if health_status["overall"] else "degraded",
                "components": {
                    "stt": "up" if health_status["stt"] else "down",
                    "llm": "up" if health_status["llm"] else "down",
                    "tts": "up" if health_status["tts"] else "down"
                },
                "overall": health_status["overall"]
            },
            status_code=200 if health_status["overall"] else 503
        )
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e)
            },
            status_code=503
        )


# === WebSocket para streaming (futuro) ===
# TODO: Implementar WebSocket para streaming bidireccional
# @router.websocket("/ws/voice")
# async def voice_websocket(websocket: WebSocket):
#     await websocket.accept()
#     # Implementar streaming de audio
#     pass

