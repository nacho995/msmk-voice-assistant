"""
Message - Value Object para mensajes en conversación.

Siguiendo principios DDD:
- Inmutable (frozen=True)
- Sin identidad (igualdad por atributos)
- Representa un concepto del dominio
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal


@dataclass(frozen=True)
class Message:
    """
    Value Object que representa un mensaje en la conversación.
    
    Inmutable y sin identidad - dos mensajes con mismo contenido son iguales.
    """
    
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime
    
    def __post_init__(self):
        """Validación de invariantes."""
        if not self.content.strip():
            raise ValueError("Message content cannot be empty")
        
        if self.role not in ("user", "assistant", "system"):
            raise ValueError(f"Invalid role: {self.role}")
    
    @classmethod
    def create_user_message(cls, content: str) -> "Message":
        """Factory method para mensajes de usuario."""
        return cls(
            role="user",
            content=content.strip(),
            timestamp=datetime.now(timezone.utc)
        )
    
    @classmethod
    def create_assistant_message(cls, content: str) -> "Message":
        """Factory method para mensajes del asistente."""
        return cls(
            role="assistant",
            content=content.strip(),
            timestamp=datetime.now(timezone.utc)
        )
    
    @classmethod
    def create_system_message(cls, content: str) -> "Message":
        """Factory method para mensajes del sistema."""
        return cls(
            role="system",
            content=content.strip(),
            timestamp=datetime.now(timezone.utc)
        )
    
    def to_dict(self) -> dict[str, str]:
        """Convertir a formato para LLM (OpenAI compatible)."""
        return {
            "role": self.role,
            "content": self.content
        }
    
    def to_display_dict(self) -> dict[str, str]:
        """Convertir a formato para display en frontend."""
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat()
        }

