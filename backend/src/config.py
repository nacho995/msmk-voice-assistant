"""
Configuración centralizada del sistema A.R.C.A LLM.

Usa pydantic-settings para validación automática y gestión segura de environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Literal


class Settings(BaseSettings):
    """Configuración global del sistema A.R.C.A LLM."""
    
    # === LM Studio Configuration ===
    lm_studio_url: str = Field(
        default="http://127.0.0.1:1234/v1",
        description="URL del servidor LM Studio local"
    )
    lm_studio_model: str = Field(
        default="qwen/qwen3-8b",
        description="Nombre del modelo en LM Studio"
    )
    llm_max_tokens: int = Field(
        default=150,
        ge=50,
        le=500,
        description="Máximo de tokens para respuestas (optimización latencia)"
    )
    llm_temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperatura del LLM (0=determinista, 1+=creativo)"
    )
    
    # === Whisper STT Configuration ===
    whisper_model: Literal["tiny", "base", "small", "medium", "large"] = Field(
        default="tiny",
        description="Modelo Whisper (tiny=más rápido, large=más preciso)"
    )
    whisper_device: Literal["cpu", "cuda"] = Field(
        default="cpu",
        description="Device para Whisper (cpu o cuda)"
    )
    whisper_compute_type: Literal["int8", "float16", "float32"] = Field(
        default="int8",
        description="Tipo de computación para Whisper (int8=más rápido)"
    )
    
    # === pyttsx3 TTS Configuration ===
    tts_rate: int = Field(
        default=175,
        ge=100,
        le=300,
        description="Velocidad de habla (palabras por minuto)"
    )
    tts_volume: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Volumen de la voz (0.0 a 1.0)"
    )
    tts_voice_index: int = Field(
        default=0,
        ge=0,
        description="Índice de voz del sistema (0=primera disponible)"
    )
    
    # === API Configuration ===
    api_host: str = Field(
        default="0.0.0.0",
        description="Host para FastAPI"
    )
    api_port: int = Field(
        default=8000,
        ge=1000,
        le=65535,
        description="Puerto para FastAPI"
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:8000"],
        description="Orígenes permitidos para CORS"
    )
    
    # === Audio Configuration ===
    audio_sample_rate: int = Field(
        default=16000,
        description="Sample rate para audio (16kHz óptimo para Whisper)"
    )
    audio_channels: int = Field(
        default=1,
        description="Canales de audio (1=mono, 2=stereo)"
    )
    audio_format: Literal["wav", "mp3"] = Field(
        default="wav",
        description="Formato de audio"
    )
    
    # === Logging ===
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Nivel de logging"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignorar variables extra (como HF_HOME, TRANSFORMERS_CACHE)
    
    @field_validator("lm_studio_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validar que la URL tenga formato correcto."""
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL debe comenzar con http:// o https://")
        return v.rstrip("/")
    
    def get_whisper_config(self) -> dict:
        """Obtener configuración para Whisper."""
        return {
            "model_size": self.whisper_model,
            "device": self.whisper_device,
            "compute_type": self.whisper_compute_type
        }
    
    def get_lm_studio_config(self) -> dict:
        """Obtener configuración para LM Studio."""
        return {
            "base_url": self.lm_studio_url,
            "model": self.lm_studio_model,
            "max_tokens": self.llm_max_tokens,
            "temperature": self.llm_temperature
        }
    
    def get_tts_config(self) -> dict:
        """Obtener configuración para pyttsx3 TTS."""
        return {
            "rate": self.tts_rate,
            "volume": self.tts_volume,
            "voice_index": self.tts_voice_index
        }
    
    def print_startup_info(self) -> None:
        """Imprimir información de configuración al startup."""
        print("=" * 60)
        print("🤖 A.R.C.A LLM - Voice Conversational Assistant")
        print("=" * 60)
        print(f"🔊 STT: Whisper {self.whisper_model} ({self.whisper_device})")
        print(f"🧠 LLM: {self.lm_studio_model}")
        print(f"🔈 TTS: pyttsx3 (rate={self.tts_rate}, volume={self.tts_volume})")
        print(f"🌐 API: http://{self.api_host}:{self.api_port}")
        print(f"📊 Log Level: {self.log_level}")
        print("=" * 60)


# Singleton global
settings = Settings()

