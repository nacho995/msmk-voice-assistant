"""
Conversation - Aggregate Root para gestión de conversación.

Siguiendo principios DDD:
- Aggregate Root con identidad (session_id)
- Encapsula lógica de negocio
- Mantiene invariantes del dominio
- Único punto de acceso a los mensajes
"""

from typing import Optional
from uuid import UUID, uuid4
from .message import Message


class Conversation:
    """
    Aggregate Root - Gestiona el ciclo de vida completo de una conversación.
    
    Responsibilities:
    - Mantener historial completo de mensajes
    - Enforcer invariantes de negocio
    - Proveer contexto para LLM
    - Gestionar límites de memoria (opcional)
    """
    
    def __init__(
        self, 
        session_id: Optional[UUID] = None,
        max_messages: Optional[int] = None,
        system_prompt: str = "Eres A.R.C.A, un asistente conversacional inteligente y amigable."
    ):
        """
        Inicializar conversación.
        
        Args:
            session_id: Identificador único de sesión (auto-generado si None)
            max_messages: Límite de mensajes en memoria (None=ilimitado)
            system_prompt: Prompt del sistema
        """
        # Identidad inmutable
        self._session_id = session_id or uuid4()
        
        # Estado interno encapsulado
        self._messages: list[Message] = []
        self._max_messages = max_messages
        self._is_active = True
        
        # Agregar mensaje del sistema si se proporciona
        if system_prompt:
            self._messages.append(Message.create_system_message(system_prompt))
    
    @property
    def session_id(self) -> UUID:
        """Identificador único e inmutable de la conversación."""
        return self._session_id
    
    @property
    def message_count(self) -> int:
        """Número total de mensajes en la conversación."""
        return len(self._messages)
    
    @property
    def is_active(self) -> bool:
        """Estado de la conversación."""
        return self._is_active
    
    def add_user_message(self, content: str) -> None:
        """
        Agregar mensaje del usuario a la conversación.
        
        Business rules:
        - Conversación debe estar activa
        - Contenido no puede estar vacío
        - Respeta límite de mensajes si está configurado
        """
        if not self._is_active:
            raise ValueError("Cannot add message to inactive conversation")
        
        message = Message.create_user_message(content)
        self._add_message(message)
    
    def add_assistant_message(self, content: str) -> None:
        """
        Agregar mensaje del asistente a la conversación.
        
        Business rules:
        - Conversación debe estar activa
        - Contenido no puede estar vacío
        """
        if not self._is_active:
            raise ValueError("Cannot add message to inactive conversation")
        
        message = Message.create_assistant_message(content)
        self._add_message(message)
    
    def _add_message(self, message: Message) -> None:
        """
        Método privado para agregar mensaje y enforcer límite de memoria.
        
        Si max_messages está configurado, elimina mensajes antiguos (excepto system).
        """
        self._messages.append(message)
        
        # Enforcer límite de memoria (mantener siempre el system message)
        if self._max_messages and len(self._messages) > self._max_messages:
            # Obtener mensajes del sistema
            system_messages = [m for m in self._messages if m.role == "system"]
            # Obtener mensajes user/assistant más recientes
            other_messages = [m for m in self._messages if m.role != "system"]
            
            # Mantener solo los últimos N-1 (dejar espacio para system)
            keep_count = self._max_messages - len(system_messages)
            recent_messages = other_messages[-keep_count:] if keep_count > 0 else []
            
            # Reconstruir lista
            self._messages = system_messages + recent_messages
    
    def get_messages_for_llm(self) -> list[dict[str, str]]:
        """
        Obtener mensajes en formato compatible con LLM (OpenAI format).
        
        Returns:
            Lista de dicts con formato {"role": "...", "content": "..."}
        """
        return [message.to_dict() for message in self._messages]
    
    def get_messages_for_display(self) -> list[dict[str, str]]:
        """
        Obtener mensajes para display en frontend.
        
        Incluye timestamps y metadata adicional.
        """
        return [message.to_display_dict() for message in self._messages]
    
    def get_last_user_message(self) -> Optional[Message]:
        """Obtener el último mensaje del usuario."""
        for message in reversed(self._messages):
            if message.role == "user":
                return message
        return None
    
    def get_last_assistant_message(self) -> Optional[Message]:
        """Obtener el último mensaje del asistente."""
        for message in reversed(self._messages):
            if message.role == "assistant":
                return message
        return None
    
    def clear_history(self, keep_system: bool = True) -> None:
        """
        Limpiar historial de conversación.
        
        Args:
            keep_system: Si True, mantiene el mensaje del sistema
        """
        if keep_system:
            system_messages = [m for m in self._messages if m.role == "system"]
            self._messages = system_messages
        else:
            self._messages = []
    
    def deactivate(self) -> None:
        """Desactivar conversación (no se pueden agregar más mensajes)."""
        self._is_active = False
    
    def reactivate(self) -> None:
        """Reactivar conversación."""
        self._is_active = True
    
    def __eq__(self, other) -> bool:
        """Igualdad basada en session_id (Entity behavior)."""
        if not isinstance(other, Conversation):
            return False
        return self._session_id == other._session_id
    
    def __hash__(self) -> int:
        """Hash basado en session_id."""
        return hash(self._session_id)
    
    def __repr__(self) -> str:
        """Representación para debugging."""
        return (
            f"Conversation(session_id={self._session_id}, "
            f"messages={len(self._messages)}, "
            f"active={self._is_active})"
        )

