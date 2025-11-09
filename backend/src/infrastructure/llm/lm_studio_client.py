"""
LMStudioClient - Cliente para LLM local vía LM Studio u Ollama.

Usa OpenAI SDK para compatibilidad con LM Studio y Ollama.
Ollama expone una API compatible con OpenAI en /v1/chat/completions.
"""

import asyncio
from typing import Optional
from openai import AsyncOpenAI, OpenAIError
from loguru import logger


class LMStudioClient:
    """
    Cliente para LM Studio usando protocolo compatible con OpenAI.
    
    LM Studio expone una API compatible con OpenAI que permite usar
    el SDK oficial para comunicación con modelos locales.
    """
    
    def __init__(
        self,
        base_url: str,
        model: str,
        max_tokens: int,
        temperature: float
    ):
        """
        Inicializar cliente LM Studio.
        
        Args:
            base_url: URL del servidor LM Studio
            model: Nombre del modelo en LM Studio
            max_tokens: Límite de tokens para respuestas
            temperature: Creatividad del modelo (0.0-2.0)
        
        Note: Valores vienen de config.py (única fuente de verdad)
        """
        self.base_url = base_url
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        # Cliente OpenAI configurado para LM Studio
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key="not-needed"  # LM Studio no requiere API key
        )
        
        # Detectar si es Ollama o LM Studio basado en la URL
        is_ollama = "ollama" in base_url.lower() or ":11434" in base_url or ":1234" in base_url
        
        logger.info(
            f"🧠 LLM client initialized ({'Ollama' if is_ollama else 'LM Studio'}): {base_url}, "
            f"model={model}, max_tokens={max_tokens}"
        )
    
    async def generate_response(
        self,
        messages: list[dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generar respuesta usando el LLM local.
        
        Args:
            messages: Lista de mensajes en formato OpenAI
                     [{"role": "user"|"assistant"|"system", "content": "..."}]
            max_tokens: Override de límite de tokens
            temperature: Override de temperatura
            
        Returns:
            Texto de la respuesta generada
            
        Raises:
            ValueError: Si messages está vacío
            RuntimeError: Si LM Studio no responde
        """
        if not messages:
            raise ValueError("Messages list cannot be empty")
        
        # Usar valores override o defaults
        tokens = max_tokens or self.max_tokens
        temp = temperature or self.temperature
        
        logger.info(
            f"🤖 Generating response: {len(messages)} messages, "
            f"max_tokens={tokens}, temp={temp}"
        )
        
        try:
            # Llamada async al LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=tokens,
                temperature=temp,
                stream=False  # Sin streaming por ahora (optimización futura)
            )
            
            # Extraer texto de respuesta
            message = response.choices[0].message
            content = message.content
            
            # Algunos modelos (como QwQ/reasoning models) usan reasoning_content
            # Si content está vacío, intentar con reasoning_content
            if not content or not content.strip():
                reasoning_content = getattr(message, 'reasoning_content', None)
                if reasoning_content and reasoning_content.strip():
                    logger.debug("Using reasoning_content instead of content")
                    content = reasoning_content
            
            # Validar que el contenido no sea None o vacío
            if content is None:
                logger.error("❌ LLM returned None content")
                logger.debug(f"Raw response: {response}")
                raise RuntimeError("LLM returned empty response (None)")
            
            response_text = content.strip()
            
            if not response_text:
                logger.error("❌ LLM returned empty content after strip")
                logger.debug(f"Raw response: {response}")
                raise RuntimeError("LLM returned empty response")
            
            logger.info(f"✅ Response generated: '{response_text[:50]}...'")
            return response_text
            
        except OpenAIError as e:
            logger.error(f"❌ LLM API error: {e}")
            raise RuntimeError(
                f"LLM service failed to respond. "
                f"Ensure Ollama/LM Studio is running at {self.base_url}"
            ) from e
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            raise RuntimeError(f"LLM generation error: {e}") from e
    
    async def generate_response_stream(
        self,
        messages: list[dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ):
        """
        Generar respuesta en modo streaming (para optimización futura).
        
        Args:
            messages: Lista de mensajes
            max_tokens: Límite de tokens
            temperature: Temperatura
            
        Yields:
            Chunks de texto conforme se generan
        """
        tokens = max_tokens or self.max_tokens
        temp = temperature or self.temperature
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=tokens,
                temperature=temp,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"❌ Streaming error: {e}")
            raise RuntimeError(f"LLM streaming error: {e}") from e
    
    async def health_check(self) -> bool:
        """
        Verificar que el servicio LLM (Ollama/LM Studio) está accesible.
        
        Returns:
            True si el servicio responde, False si no
        """
        try:
            # Mensaje simple de prueba
            test_messages = [
                {"role": "user", "content": "Hi"}
            ]
            
            await asyncio.wait_for(
                self.generate_response(test_messages, max_tokens=5),
                timeout=10.0
            )
            
            logger.info("✅ LLM service health check passed")
            return True
            
        except asyncio.TimeoutError:
            logger.warning("⏱️ LLM service health check timeout")
            return False
        except Exception as e:
            logger.warning(f"⚠️ LLM service health check failed: {e}")
            return False
    
    def cleanup(self) -> None:
        """Limpiar recursos."""
        logger.info("🧹 Cleaning up LLM client")
        # AsyncOpenAI maneja su propio cleanup

