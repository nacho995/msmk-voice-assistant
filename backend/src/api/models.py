"""
Pydantic models para API.

Request/Response schemas para endpoints de voz.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class VoiceProcessResponse(BaseModel):
    """Response para procesamiento de voz."""
    
    session_id: UUID = Field(description="ID de la sesión conversacional")
    transcribed_text: str = Field(description="Texto transcrito del usuario")
    response_text: str = Field(description="Respuesta del asistente (texto)")
    latency: dict[str, float] = Field(description="Tiempos de cada etapa del pipeline")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "transcribed_text": "Hola, cómo estás? Me llamo Adrian",
                "response_text": "Hola Adrian! Muy bien, gracias. ¿En qué puedo ayudarte hoy?",
                "latency": {
                    "stt": 0.85,
                    "llm": 1.2,
                    "tts": 0.4,
                    "total": 2.45
                }
            }
        }


class TextProcessRequest(BaseModel):
    """Request para procesamiento de texto (sin voz)."""
    
    text: str = Field(description="Texto del usuario", min_length=1)
    session_id: Optional[UUID] = Field(default=None, description="ID de sesión (opcional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Qué día es hoy?",
                "session_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class TextProcessResponse(BaseModel):
    """Response para procesamiento de texto."""
    
    session_id: UUID
    response_text: str
    latency: dict[str, float]


class ConversationHistoryResponse(BaseModel):
    """Response con historial de conversación."""
    
    session_id: UUID
    messages: list[dict[str, str]]
    message_count: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "messages": [
                    {
                        "role": "system",
                        "content": "Eres A.R.C.A...",
                        "timestamp": "2025-01-01T12:00:00Z"
                    },
                    {
                        "role": "user",
                        "content": "Hola, me llamo Adrian",
                        "timestamp": "2025-01-01T12:01:00Z"
                    },
                    {
                        "role": "assistant",
                        "content": "Hola Adrian! Encantado de conocerte.",
                        "timestamp": "2025-01-01T12:01:05Z"
                    }
                ],
                "message_count": 3
            }
        }


class HealthCheckResponse(BaseModel):
    """Response de health check."""
    
    status: str = Field(description="Estado general (healthy/unhealthy)")
    components: dict[str, bool] = Field(description="Estado de cada componente")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "components": {
                    "stt": True,
                    "llm": True,
                    "tts": True,
                    "overall": True
                }
            }
        }


class ErrorResponse(BaseModel):
    """Response de error."""
    
    error: str = Field(description="Mensaje de error")
    detail: Optional[str] = Field(default=None, description="Detalles adicionales")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Processing failed",
                "detail": "LM Studio connection refused"
            }
        }

