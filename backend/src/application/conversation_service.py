"""
ConversationService - Servicio para gestionar conversaciones.

Application layer service que orquesta Conversation aggregates.
"""

from typing import Optional
from uuid import UUID, uuid4

from loguru import logger
from ..domain.conversation import Conversation


class ConversationService:
    """
    Servicio de aplicación para gestión de conversaciones.
    
    Responsibilities:
    - Crear y gestionar múltiples conversaciones (por session_id)
    - Proveer acceso a conversaciones activas
    - Limpiar conversaciones antiguas
    """
    
    def __init__(self, max_messages_per_conversation: Optional[int] = None):
        """
        Inicializar servicio de conversaciones.
        
        Args:
            max_messages_per_conversation: Límite de mensajes por conversación
                                          (None = ilimitado)
        """
        # Almacenamiento en memoria: session_id -> Conversation
        self._conversations: dict[UUID, Conversation] = {}
        self._max_messages = max_messages_per_conversation
        
        logger.info(
            f"💬 ConversationService initialized: "
            f"max_messages={max_messages_per_conversation or 'unlimited'}"
        )
    
    def create_conversation(
        self,
        session_id: Optional[UUID] = None,
        system_prompt: Optional[str] = None
    ) -> Conversation:
        """
        Crear nueva conversación.
        
        Args:
            session_id: ID de sesión (auto-generado si None)
            system_prompt: Prompt personalizado del sistema
            
        Returns:
            Conversación creada
        """
        # Generar session_id si no se proporciona
        if session_id is None:
            session_id = uuid4()
        
        # Usar prompt default si no se proporciona
        if system_prompt is None:
            system_prompt = (
                "Eres A.R.C.A, un asistente conversacional inteligente y amigable. "
                "Respondes de manera natural y concisa. "
                "Recuerdas todo el contexto de la conversación."
            )
        
        # Crear conversación
        conversation = Conversation(
            session_id=session_id,
            max_messages=self._max_messages,
            system_prompt=system_prompt
        )
        
        # Almacenar
        self._conversations[session_id] = conversation
        
        logger.info(f"✨ New conversation created: {session_id}")
        return conversation
    
    def get_conversation(self, session_id: UUID) -> Optional[Conversation]:
        """
        Obtener conversación por session_id.
        
        Args:
            session_id: ID de la sesión
            
        Returns:
            Conversation si existe, None si no
        """
        return self._conversations.get(session_id)
    
    def get_or_create_conversation(
        self,
        session_id: UUID,
        system_prompt: Optional[str] = None
    ) -> Conversation:
        """
        Obtener conversación existente o crear nueva.
        
        Args:
            session_id: ID de la sesión
            system_prompt: Prompt del sistema (solo para nuevas conversaciones)
            
        Returns:
            Conversación existente o recién creada
        """
        conversation = self.get_conversation(session_id)
        
        if conversation is None:
            logger.info(f"🆕 Creating new conversation for session: {session_id}")
            conversation = self.create_conversation(session_id, system_prompt)
        else:
            logger.debug(f"📖 Using existing conversation: {session_id}")
        
        return conversation
    
    def add_user_message(self, session_id: UUID, content: str) -> Conversation:
        """
        Agregar mensaje de usuario a conversación.
        
        Args:
            session_id: ID de la sesión
            content: Contenido del mensaje
            
        Returns:
            Conversación actualizada
            
        Raises:
            ValueError: Si conversación no existe
        """
        conversation = self.get_conversation(session_id)
        
        if conversation is None:
            raise ValueError(f"Conversation not found: {session_id}")
        
        conversation.add_user_message(content)
        logger.debug(f"👤 User message added to {session_id}")
        
        return conversation
    
    def add_assistant_message(self, session_id: UUID, content: str) -> Conversation:
        """
        Agregar mensaje del asistente a conversación.
        
        Args:
            session_id: ID de la sesión
            content: Contenido del mensaje
            
        Returns:
            Conversación actualizada
            
        Raises:
            ValueError: Si conversación no existe
        """
        conversation = self.get_conversation(session_id)
        
        if conversation is None:
            raise ValueError(f"Conversation not found: {session_id}")
        
        conversation.add_assistant_message(content)
        logger.debug(f"🤖 Assistant message added to {session_id}")
        
        return conversation
    
    def clear_conversation(self, session_id: UUID, keep_system: bool = True) -> None:
        """
        Limpiar historial de una conversación.
        
        Args:
            session_id: ID de la sesión
            keep_system: Si mantener mensaje del sistema
        """
        conversation = self.get_conversation(session_id)
        
        if conversation:
            conversation.clear_history(keep_system)
            logger.info(f"🧹 Conversation cleared: {session_id}")
    
    def delete_conversation(self, session_id: UUID) -> bool:
        """
        Eliminar conversación completamente.
        
        Args:
            session_id: ID de la sesión
            
        Returns:
            True si se eliminó, False si no existía
        """
        if session_id in self._conversations:
            del self._conversations[session_id]
            logger.info(f"🗑️ Conversation deleted: {session_id}")
            return True
        return False
    
    def get_active_conversations_count(self) -> int:
        """Obtener número de conversaciones activas."""
        return len(self._conversations)
    
    def cleanup_inactive_conversations(self) -> int:
        """
        Limpiar conversaciones inactivas.
        
        Returns:
            Número de conversaciones eliminadas
        """
        inactive_ids = [
            sid for sid, conv in self._conversations.items()
            if not conv.is_active
        ]
        
        for sid in inactive_ids:
            del self._conversations[sid]
        
        if inactive_ids:
            logger.info(f"🧹 Cleaned up {len(inactive_ids)} inactive conversations")
        
        return len(inactive_ids)

