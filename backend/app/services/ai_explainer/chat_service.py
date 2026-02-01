"""
Servicio de chat contextual con IA
Soporta streaming via HTTP POST + chunked response
"""

import json
import logging
from typing import AsyncGenerator, Dict, List

import httpx

try:
    import litellm
except ImportError:
    litellm = None

from ...core.config import settings
from ...schemas.chat import ChatMessage, PageContext

logger = logging.getLogger(__name__)


class ChatService:
    """Servicio de chat contextual con streaming"""

    def __init__(
        self,
        ollama_url: str = settings.OLLAMA_URL,
        model: str = settings.OLLAMA_MODEL,
        timeout: float = 60.0,
    ):
        self.url = ollama_url
        self.model = model
        self.timeout = timeout
        self.use_litellm = settings.USE_LITELLM
        self.litellm_base = settings.LITELLM_API_BASE

    def _build_system_prompt(self, context: PageContext) -> str:
        """Construye el system prompt con el contexto de la página"""
        return f"""Eres un asistente experto en redes y seguridad integrado en LeirEye, una aplicación de monitoreo de red.

## Tu rol:
- Ayudar a los usuarios a entender el tráfico de red, alertas, y seguridad
- Explicar conceptos técnicos de forma simple y educativa
- Analizar datos de la página actual y dar insights útiles
- Sugerir acciones cuando sea apropiado

## Contexto actual del usuario:
- **Página:** {context.pageName} ({context.pageId})
- **Estado:** {context.summary}

## Datos disponibles:
{json.dumps(context.data, indent=2, ensure_ascii=False)[:2000]}

## Directrices:
1. Responde en español, de forma concisa pero informativa
2. Usa emojis para indicar seguridad: ✅ seguro, ⚠️ precaución, ❌ riesgo
3. Si mencionas IPs o puertos, explica qué significan
4. Si no tienes datos suficientes, indica qué información adicional necesitas
5. Puedes sugerir que el usuario navegue a otra página si es relevante
6. Responde en markdown cuando sea útil para formatear"""

    def _build_messages(
        self, 
        user_message: str, 
        context: PageContext, 
        history: List[ChatMessage]
    ) -> List[Dict[str, str]]:
        """Construye la lista de mensajes para el LLM"""
        messages = [{"role": "system", "content": self._build_system_prompt(context)}]
        
        # Agregar historial (últimos 10 mensajes)
        for msg in history[-10:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Agregar mensaje actual
        messages.append({"role": "user", "content": user_message})
        
        return messages

    async def chat_stream(
        self,
        message: str,
        context: PageContext,
        history: List[ChatMessage] = [],
    ) -> AsyncGenerator[str, None]:
        """
        Genera respuesta en streaming.
        Yields chunks de texto para streaming con ReadableStream.
        """
        messages = self._build_messages(message, context, history)
        
        # Intentar con LiteLLM si está habilitado
        if self.use_litellm and litellm:
            async for chunk in self._stream_litellm(messages):
                yield chunk
            return

        # Fallback a Ollama directo
        async for chunk in self._stream_ollama(messages):
            yield chunk

    async def _stream_litellm(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """Streaming con LiteLLM"""
        try:
            model_name = self.model
            if not any(prefix in model_name for prefix in ["gpt-", "claude-", "ollama/"]):
                model_name = f"ollama/{model_name}"

            response = await litellm.acompletion(
                model=model_name,
                messages=messages,
                api_base=self.litellm_base or self.url,
                temperature=0.7,
                max_tokens=1000,
                stream=True,
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Error en LiteLLM streaming: {e}")
            yield f"\n\n⚠️ Error conectando con el servicio de IA: {str(e)}"

    async def _stream_ollama(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """Streaming directo con Ollama API"""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "num_predict": 1000,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout, connect=10.0)) as client:
                async with client.stream(
                    "POST",
                    f"{self.url}/api/chat",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        yield f"⚠️ Error del servidor: {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                content = data["message"]["content"]
                                if content:
                                    yield content
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue

        except httpx.TimeoutException:
            yield "\n\n⚠️ Tiempo de espera agotado. Intenta con una pregunta más corta."
        except httpx.ConnectError:
            yield "\n\n❌ No se puede conectar con Ollama. ¿Está ejecutándose?"
        except Exception as e:
            logger.error(f"Error en Ollama streaming: {e}")
            yield f"\n\n⚠️ Error: {str(e)}"

    async def chat_complete(
        self,
        message: str,
        context: PageContext,
        history: List[ChatMessage] = [],
    ) -> str:
        """Respuesta completa sin streaming (fallback)"""
        messages = self._build_messages(message, context, history)
        
        if self.use_litellm and litellm:
            try:
                model_name = self.model
                if not any(prefix in model_name for prefix in ["gpt-", "claude-", "ollama/"]):
                    model_name = f"ollama/{model_name}"

                response = await litellm.acompletion(
                    model=model_name,
                    messages=messages,
                    api_base=self.litellm_base or self.url,
                    temperature=0.7,
                    max_tokens=1000,
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"Error en LiteLLM complete: {e}")

        # Fallback a Ollama
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.7, "num_predict": 1000},
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.url}/api/chat", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("message", {}).get("content", "Sin respuesta")
        except Exception as e:
            logger.error(f"Error en Ollama complete: {e}")
        
        return "⚠️ No se pudo obtener respuesta del servicio de IA."


# Instancia global
chat_service = ChatService()
