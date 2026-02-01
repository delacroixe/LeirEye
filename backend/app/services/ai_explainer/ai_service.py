"""Servicio principal de explicaciones con IA"""

import json
import logging
from typing import Any, Dict, List, Optional

from ...core.config import settings
from .ollama_client import OllamaClient
from .patterns import ALERT_EXPLANATIONS, KNOWN_PATTERNS, KNOWN_SERVICES

logger = logging.getLogger(__name__)


class AIExplainerService:
    """Servicio de IA para explicaciones educativas de tráfico de red"""

    def __init__(
        self,
        ollama_url: str = settings.OLLAMA_URL,
        model: str = settings.OLLAMA_MODEL,
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
        if use_ai and not self.is_available:
            # Intento de reconexión rápida por si Ollama se inició tarde
            await self.check_ollama_status()

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


    async def analyze_wifi_environment(self, networks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analiza el entorno WiFi y sugiere optimizaciones"""
        if not self.is_available:
            return {"summary": "Servicio de IA no disponible para análisis WiFi.", "security": "Desconocido", "optimization": []}

        prompt = f"""Analiza estas redes WiFi detectadas y proporciona un resumen de seguridad y optimización en JSON.
        Redes detectadas: {json.dumps(networks[:15])}
        
        Responde con este formato JSON:
        {{
            "summary": "Resumen general de lo que ves",
            "security_score": 0-100,
            "security_findings": ["hallazgo 1", "hallazgo 2"],
            "optimization_tips": ["tip 1", "tip 2"],
            "crowded_channels": [1, 6, 11]
        }}"""
        
        result = await self.ollama_client.generate(prompt, system_prompt="Eres un experto en seguridad WiFi.")
        return result or {"error": "No se pudo generar el análisis WiFi"}

    async def analyze_dns_threats(self, dns_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analiza logs de DNS en busca de amenazas"""
        if not self.is_available:
            return {"threats": [], "status": "IA no disponible"}

        prompt = f"Analiza estos dominios consultados y detecta posibles amenazas (DGA, phishing, C2). Logs: {json.dumps(dns_logs[:20])}"
        
        result = await self.ollama_client.generate(prompt, system_prompt="Eres un analista de seguridad SOC experto en DNS.")
        return result or {"error": "No se pudo analizar las amenazas DNS"}

    async def get_packet_crafting_help(self, intent: str, protocol: str) -> Dict[str, Any]:
        """Ayuda a construir un paquete basado en la intención"""
        if not self.is_available:
            return {"suggestion": "IA no disponible", "fields": {}}

        prompt = f"Ayúdame a configurar un paquete {protocol} para lograr esto: {intent}. Devuelve los campos recomendados en JSON."
        
        result = await self.ollama_client.generate(prompt, system_prompt="Eres un ingeniero de redes experto en Scapy y construcción de paquetes.")
        return result or {"error": "No se pudo generar ayuda para el paquete"}

    async def analyze_traffic_stats(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza estadísticas de tráfico global"""
        if not self.is_available:
            return {"insight": "IA no disponible para análisis de estadísticas."}

        prompt = f"Analiza estas estadísticas de tráfico de red y proporciona 3 insights clave en JSON. Datos: {json.dumps(stats)}"
        
        result = await self.ollama_client.generate(prompt, system_prompt="Eres un analista de datos de red experto.")
        return result or {"error": "No se pudo generar el análisis de estadísticas"}

    async def analyze_network_map(self, map_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza la topología del mapa de red"""
        if not self.is_available:
            return {"insight": "IA no disponible para análisis de mapa."}

        # Resumir datos para no saturar
        summary = {
            "node_count": len(map_data.get("nodes", [])),
            "link_count": len(map_data.get("links", [])),
            "external_destinations": [n.get("label") for n in map_data.get("nodes", []) if not n.get("isLocal")][:10]
        }

        prompt = f"Analiza esta topología de red y detecta posibles anomalías o puntos de interés. Resumen: {json.dumps(summary)}"
        
        result = await self.ollama_client.generate(prompt, system_prompt="Eres un arquitecto de red y experto en seguridad.")
        return result or {"error": "No se pudo generar el análisis de mapa"}


# Instancia global del servicio
ai_service = AIExplainerService()
