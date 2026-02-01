"""Cliente para interactuar con Ollama"""

import asyncio
import json
import logging
from typing import Any, Dict, Optional

import httpx

try:
    import litellm
except ImportError:
    litellm = None

from ...core.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """Cliente para comunicación con Ollama"""

    def __init__(
        self,
        url: str = settings.OLLAMA_URL,
        model: str = settings.OLLAMA_MODEL,
        timeout: float = 30.0,
    ):
        self.url = url
        self.model = model
        self.timeout = timeout
        self.is_available = False
        self.use_litellm = settings.USE_LITELLM
        self.litellm_base = settings.LITELLM_API_BASE

    async def check_status(self) -> Dict[str, Any]:
        """Verifica si el servicio de IA está disponible"""
        if self.use_litellm:
            return {
                "available": True,
                "proxy": "LiteLLM",
                "model": self.model,
                "info": "Métricas y trazabilidad habilitadas vía LiteLLM"
            }

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
                        "required_model": self.model,
                    }
        except Exception as e:
            logger.warning(f"Ollama no disponible: {e}")
            self.is_available = False

        return {
            "available": False,
            "models": [],
            "has_required_model": False,
            "required_model": self.model,
            "install_hint": f"Instala Ollama: https://ollama.ai y ejecuta: ollama pull {self.model}",
        }

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = True,
        temperature: float = 0.3,
    ) -> Optional[Dict[str, Any]]:
        """Método genérico para generar contenido con Ollama o LiteLLM"""
        
        if self.use_litellm and litellm:
            try:
                model_name = self.model
                if not any(prefix in model_name for prefix in ["gpt-", "claude-", "ollama/"]):
                    model_name = f"ollama/{model_name}"

                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                response = await litellm.acompletion(
                    model=model_name,
                    messages=messages,
                    api_base=self.litellm_base or self.url,
                    temperature=temperature,
                    response_format={"type": "json_object"} if json_mode and "ollama" not in model_name else None
                )
                
                content = response.choices[0].message.content
                if json_mode:
                    return json.loads(content)
                return {"response": content}
            except Exception as e:
                logger.error(f"Error en LiteLLM (generate): {e}")

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": 500},
        }
        if system_prompt:
            payload["system"] = system_prompt
        
        if json_mode:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.url}/api/generate", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    
                    if json_mode:
                        try:
                            return json.loads(response_text)
                        except json.JSONDecodeError:
                            logger.warning(f"Error parseando JSON de Ollama: {response_text[:100]}")
                            return None
                    return {"response": response_text}
                else:
                    logger.error(f"Error en Ollama API ({response.status_code}): {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error en generate genérico de Ollama: {e}")
        return None

    async def generate_explanation(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int],
        dst_port: Optional[int],
        flags: Optional[str],
        length: int,
        service: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        """Genera explicación usando Ollama o LiteLLM"""

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

        if self.use_litellm and litellm:
            try:
                # Si es un modelo de ollama, nos aseguramos del prefijo
                model_name = self.model
                if not any(prefix in model_name for prefix in ["gpt-", "claude-", "ollama/"]):
                    model_name = f"ollama/{model_name}"

                logger.info(f"Usando LiteLLM para explicar paquete con modelo {model_name}")
                response = await litellm.acompletion(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    api_base=self.litellm_base or self.url,
                    temperature=0.3,
                    max_tokens=250,
                    response_format={"type": "json_object"} if "ollama" not in model_name else None
                )
                
                content = response.choices[0].message.content
                parsed = json.loads(content)
                parsed["source"] = "litellm"
                return parsed
            except Exception as e:
                logger.error(f"Error en LiteLLM: {e}")
                # Fallback al método directo si falla LiteLLM

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                        "options": {"temperature": 0.3, "num_predict": 500},
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")

                    # Limpiar y parsear JSON
                    try:
                        clean_text = response_text.strip()
                        # Eliminar posibles bloques de código markdown si no se respetó el formato JSON
                        if "```" in clean_text:
                            clean_text = clean_text.split("```")[1]
                            if clean_text.startswith("json"):
                                clean_text = clean_text[4:]
                            clean_text = clean_text.strip()

                        parsed = json.loads(clean_text)
                        parsed["source"] = "ollama"
                        return parsed
                    except json.JSONDecodeError:
                        logger.warning(
                            f"No se pudo parsear respuesta Ollama: {response_text[:300]}"
                        )
                else:
                    error_detail = response.text
                    logger.error(f"Ollama devolvió error {response.status_code}: {error_detail}")
                    if response.status_code == 404:
                        logger.warning(f"SUGERENCIA: El modelo '{self.model}' no parece estar instalado. Ejecuta: ollama pull {self.model}")

        except asyncio.TimeoutError:
            logger.warning("Timeout esperando respuesta de Ollama")
        except Exception as e:
            logger.error(f"Error consultando Ollama: {e}")

        return None
