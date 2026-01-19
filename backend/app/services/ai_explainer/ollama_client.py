"""Cliente para interactuar con Ollama"""
import httpx
import logging
import asyncio
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class OllamaClient:
    """Cliente para comunicación con Ollama"""
    
    def __init__(self, url: str = "http://localhost:11434", model: str = "llama3.2:3b", timeout: float = 30.0):
        self.url = url
        self.model = model
        self.timeout = timeout
        self.is_available = False
    
    async def check_status(self) -> Dict[str, Any]:
        """Verifica si Ollama está disponible y qué modelos tiene"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    self.is_available = True
                    has_model = any(self.model.split(":")[0] in m for m in models)
                    return {
                        "available": True,
                        "models": models,
                        "has_required_model": has_model,
                        "required_model": self.model
                    }
        except Exception as e:
            logger.warning(f"Ollama no disponible: {e}")
            self.is_available = False
            
        return {
            "available": False,
            "models": [],
            "has_required_model": False,
            "required_model": self.model,
            "install_hint": "Instala Ollama: https://ollama.ai y ejecuta: ollama pull llama3.2:3b"
        }
    
    async def generate_explanation(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int],
        dst_port: Optional[int],
        flags: Optional[str],
        length: int,
        service: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Genera explicación usando Ollama"""
        
        prompt = f"""Eres un profesor de redes amigable que explica conceptos a principiantes.
Analiza este paquete de red y responde en formato JSON:

PAQUETE:
- Protocolo: {protocol}
- Origen: {src_ip}:{src_port or 'N/A'}
- Destino: {dst_ip}:{dst_port or 'N/A'}
- Flags TCP: {flags or 'N/A'}
- Tamaño: {length} bytes
- Servicio detectado: {service or 'Desconocido'}

Responde SOLO con este JSON (sin markdown, sin explicación adicional):
{{
    "app": "Nombre de la aplicación o servicio",
    "explanation": "Explicación simple de qué está pasando (1-2 oraciones)",
    "security": "Nivel de seguridad con emoji (✅ seguro, ⚠️ precaución, ❌ riesgo)",
    "learn": "Un dato curioso educativo sobre este protocolo o servicio"
}}"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "num_predict": 200
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    
                    # Limpiar y parsear JSON
                    try:
                        clean_text = response_text.strip()
                        if clean_text.startswith("```"):
                            clean_text = clean_text.split("```")[1]
                            if clean_text.startswith("json"):
                                clean_text = clean_text[4:]
                        
                        parsed = json.loads(clean_text)
                        parsed["source"] = "ollama"
                        return parsed
                    except json.JSONDecodeError:
                        logger.warning(f"No se pudo parsear respuesta Ollama: {response_text[:100]}")
                        
        except asyncio.TimeoutError:
            logger.warning("Timeout esperando respuesta de Ollama")
        except Exception as e:
            logger.error(f"Error consultando Ollama: {e}")
        
        return None
