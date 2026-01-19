"""Servicio principal de explicaciones con IA"""

import logging
from typing import Optional, Dict, Any
from .patterns import KNOWN_PATTERNS, KNOWN_SERVICES, ALERT_EXPLANATIONS
from .ollama_client import OllamaClient

logger = logging.getLogger(__name__)


class AIExplainerService:
    """Servicio de IA para explicaciones educativas de tráfico de red"""

    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        model: str = "llama3.2:3b",
        timeout: float = 30.0,
    ):
        self.ollama_client = OllamaClient(ollama_url, model, timeout)
        self._explanation_cache: Dict[str, dict] = {}

    async def check_ollama_status(self) -> Dict[str, Any]:
        """Verifica si Ollama está disponible"""
        return await self.ollama_client.check_status()

    @property
    def is_available(self) -> bool:
        """Retorna si Ollama está disponible"""
        return self.ollama_client.is_available

    def _get_cache_key(self, protocol: str, port: Optional[int]) -> str:
        """Genera clave de cache para un patrón"""
        return f"{protocol}:{port}" if port else protocol

    def _detect_service(self, ip: str, domain: Optional[str] = None) -> Optional[str]:
        """Detecta servicio conocido por IP o dominio"""
        check_str = (domain or ip).lower()
        for service, description in KNOWN_SERVICES.items():
            if service in check_str:
                return description
        return None

    def _get_cached_explanation(
        self, protocol: str, port: Optional[int]
    ) -> Optional[dict]:
        """Busca explicación en cache de patrones conocidos"""
        cache_key = self._get_cache_key(protocol, port)
        return KNOWN_PATTERNS.get(cache_key)

    def _generate_basic_explanation(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int],
        dst_port: Optional[int],
        flags: Optional[str],
        length: int,
        service: Optional[str],
    ) -> Dict[str, Any]:
        """Genera explicación básica sin IA"""

        is_outgoing = src_ip.startswith(("192.168.", "10.", "172.16."))
        direction = "enviando datos a" if is_outgoing else "recibiendo datos de"

        if service:
            explanation = f"Tu dispositivo está {direction} {service}."
        else:
            explanation = f"Conexión {protocol} desde {src_ip} hacia {dst_ip}."

        security = "ℹ️ Sin información adicional disponible."
        if protocol == "TCP" and dst_port == 80:
            security = "⚠️ Conexión HTTP sin encriptar."
        elif protocol == "TCP" and dst_port == 443:
            security = "✅ Conexión HTTPS encriptada."

        return {
            "source": "basic",
            "app": service or f"{protocol} puerto {dst_port}",
            "explanation": explanation,
            "security": security,
            "learn": f"El protocolo {protocol} se usa para este tipo de conexiones.",
            "details": {
                "protocol": protocol,
                "src": f"{src_ip}:{src_port}" if src_port else src_ip,
                "dst": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                "flags": flags,
                "size": f"{length} bytes",
            },
        }

    async def explain_packet(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int] = None,
        dst_port: Optional[int] = None,
        flags: Optional[str] = None,
        length: int = 0,
        use_ai: bool = True,
    ) -> Dict[str, Any]:
        """
        Genera explicación educativa de un paquete.

        Estrategia:
        1. Buscar en cache de patrones conocidos (instantáneo)
        2. Si no está, usar Ollama para generar explicación
        3. Cachear resultado para futuras consultas
        """

        # 1. Intentar cache de patrones conocidos
        cached = self._get_cached_explanation(protocol, dst_port)
        if cached:
            service = self._detect_service(dst_ip)
            return {
                "source": "cache",
                "app": service or cached.get("app", "Desconocido"),
                "explanation": cached.get("explanation", ""),
                "security": cached.get("security", ""),
                "learn": cached.get("learn", ""),
                "details": {
                    "protocol": protocol,
                    "src": f"{src_ip}:{src_port}" if src_port else src_ip,
                    "dst": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                    "flags": flags,
                    "size": f"{length} bytes",
                },
            }

        # 2. Detectar servicio por IP/dominio
        service = self._detect_service(dst_ip)

        # 3. Si Ollama no está disponible o no se quiere usar IA
        if not use_ai or not self.is_available:
            return self._generate_basic_explanation(
                protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
            )

        # 4. Usar Ollama para explicación avanzada
        try:
            explanation = await self.ollama_client.generate_explanation(
                protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
            )

            if explanation:
                explanation["details"] = {
                    "protocol": protocol,
                    "src": f"{src_ip}:{src_port}" if src_port else src_ip,
                    "dst": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                    "flags": flags,
                    "size": f"{length} bytes",
                }
                return explanation
        except Exception as e:
            logger.error(f"Error con Ollama: {e}")

        return self._generate_basic_explanation(
            protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
        )

    async def explain_alert(
        self, alert_type: str, context: Dict[str, Any]
    ) -> Dict[str, str]:
        """Explica una alerta de seguridad de forma educativa"""

        explanation = ALERT_EXPLANATIONS.get(alert_type)

        if explanation and alert_type == "unusual_port":
            explanation = dict(explanation)
            explanation["explanation"] = (
                f"Se detectó tráfico en el puerto {context.get('port', '?')}. Este puerto no es común para uso normal."
            )

        return explanation or {
            "title": "Alerta de red",
            "explanation": "Se detectó actividad inusual en tu red.",
            "risk": "desconocido",
            "action": "Revisa los detalles del tráfico.",
            "learn": "Monitorear tu red te ayuda a entender y proteger tus dispositivos.",
        }


# Instancia global del servicio
ai_service = AIExplainerService()
