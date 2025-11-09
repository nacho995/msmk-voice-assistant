#!/usr/bin/env python3
"""
Script de inicio para A.R.C.A LLM.

Verifica prerequisites y lanza la aplicación.
"""

import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Verificar versión de Python."""
    if sys.version_info < (3, 11):
        print("❌ Error: Python 3.11+ requerido")
        print(f"   Tu versión: Python {sys.version_info.major}.{sys.version_info.minor}")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detectado")


def check_env_file():
    """Verificar .env (opcional)."""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("ℹ️  Archivo .env no encontrado (usando defaults)")
        print("   Sistema funcionará con configuración por defecto")
        print("   Para personalizar: cp .env.example .env")
    else:
        print("✅ Archivo .env encontrado (usando config personalizada)")


def check_venv():
    """Verificar que estamos en un virtual environment."""
    if sys.prefix == sys.base_prefix:
        print("⚠️  No estás en un virtual environment")
        print("   Recomendado: python -m venv arca-venv && source arca-venv/bin/activate")
        response = input("   ¿Continuar de todos modos? (y/n): ")
        if response.lower() != 'y':
            sys.exit(0)
    else:
        print("✅ Virtual environment activo")


def main():
    """Main function."""
    print("=" * 60)
    print("🤖 A.R.C.A LLM - Voice Conversational Assistant")
    print("=" * 60)
    print()
    
    # Checks
    check_python_version()
    check_venv()
    check_env_file()
    
    print()
    print("=" * 60)
    print("🚀 Iniciando servidor...")
    print("=" * 60)
    print()
    print("IMPORTANTE:")
    print("1. Asegúrate de tener LM Studio corriendo en http://127.0.0.1:1234")
    print("2. Carga el modelo en LM Studio")
    print("3. Abre http://localhost:8000 en tu navegador")
    print()
    print("Presiona Ctrl+C para detener el servidor")
    print()
    
    # Launch uvicorn
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "backend.api.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print("👋 A.R.C.A LLM detenido. ¡Hasta luego!")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Error al iniciar: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

