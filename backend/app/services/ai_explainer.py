"""
Servicio de IA para explicaciones educativas usando Ollama.
Transforma paquetes de red técnicos en explicaciones entendibles.
"""

import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import json

logger = logging.getLogger(__name__)

# Cache de explicaciones comunes (patrones conocidos)
KNOWN_PATTERNS = {
    # Puertos comunes
    "TCP:80": {
        "app": "HTTP (Web)",
        "explanation": "Tráfico web sin encriptar. Los datos viajan en texto plano.",
        "security": "⚠️ Cualquiera en tu red podría ver este contenido. Preferible usar HTTPS.",
        "learn": "HTTP es el protocolo base de la web, pero sin la 'S' de seguro."
    },
    "TCP:443": {
        "app": "HTTPS (Web Segura)",
        "explanation": "Conexión web encriptada. Tus datos están protegidos.",
        "security": "✅ Conexión segura con cifrado TLS/SSL.",
        "learn": "HTTPS usa certificados digitales para verificar la identidad del sitio."
    },
    "TCP:22": {
        "app": "SSH",
        "explanation": "Conexión remota segura a otro ordenador.",
        "security": "✅ Protocolo seguro usado por administradores de sistemas.",
        "learn": "SSH permite controlar servidores de forma remota y encriptada."
    },
    "UDP:53": {
        "app": "DNS",
        "explanation": "Tu dispositivo está buscando la dirección IP de un sitio web.",
        "security": "ℹ️ Normal. Es como buscar un número en la guía telefónica de Internet.",
        "learn": "DNS traduce nombres como 'google.com' a direcciones IP numéricas."
    },
    "TCP:53": {
        "app": "DNS (TCP)",
        "explanation": "Consulta DNS usando TCP, típicamente para respuestas grandes.",
        "security": "ℹ️ Normal para transferencias de zona o respuestas extensas.",
        "learn": "DNS normalmente usa UDP, pero cambia a TCP si la respuesta es muy grande."
    },
    "TCP:21": {
        "app": "FTP",
        "explanation": "Transferencia de archivos sin encriptar.",
        "security": "⚠️ Protocolo antiguo sin cifrado. Usa SFTP o FTPS en su lugar.",
        "learn": "FTP fue creado en 1971, antes de que la seguridad fuera una prioridad."
    },
    "TCP:25": {
        "app": "SMTP (Email)",
        "explanation": "Envío de correo electrónico.",
        "security": "ℹ️ Los servidores de email usan este puerto para comunicarse entre sí.",
        "learn": "SMTP es el protocolo que permite que los emails viajen por Internet."
    },
    "TCP:993": {
        "app": "IMAP Seguro",
        "explanation": "Tu cliente de email está sincronizando mensajes de forma segura.",
        "security": "✅ Conexión encriptada a tu servidor de correo.",
        "learn": "IMAP permite acceder a tus emails desde múltiples dispositivos."
    },
    "TCP:587": {
        "app": "SMTP Seguro",
        "explanation": "Envío de email con autenticación.",
        "security": "✅ Puerto moderno y seguro para enviar correos.",
        "learn": "El puerto 587 reemplazó al 25 para envío de emails por usuarios."
    },
    "TCP:3306": {
        "app": "MySQL",
        "explanation": "Conexión a base de datos MySQL.",
        "security": "⚠️ Si ves esto desde fuera de tu red, podría ser un riesgo.",
        "learn": "MySQL es una de las bases de datos más populares del mundo."
    },
    "TCP:5432": {
        "app": "PostgreSQL",
        "explanation": "Conexión a base de datos PostgreSQL.",
        "security": "ℹ️ Normal si tienes aplicaciones que usan esta base de datos.",
        "learn": "PostgreSQL es conocida por su robustez y cumplimiento de estándares SQL."
    },
    "TCP:6379": {
        "app": "Redis",
        "explanation": "Conexión a cache Redis.",
        "security": "ℹ️ Base de datos en memoria, común en aplicaciones web.",
        "learn": "Redis almacena datos en RAM para acceso ultra-rápido."
    },
    "TCP:8080": {
        "app": "HTTP Alternativo",
        "explanation": "Servidor web en puerto alternativo.",
        "security": "ℹ️ Común para desarrollo o proxies.",
        "learn": "El 8080 se usa cuando el 80 está ocupado o requiere permisos."
    },
    "UDP:123": {
        "app": "NTP",
        "explanation": "Tu dispositivo está sincronizando su reloj con un servidor de tiempo.",
        "security": "✅ Completamente normal y necesario.",
        "learn": "NTP mantiene todos los dispositivos del mundo sincronizados."
    },
    "UDP:67": {
        "app": "DHCP Server",
        "explanation": "Un servidor está asignando direcciones IP en la red.",
        "security": "✅ Tu router probablemente está haciendo su trabajo.",
        "learn": "DHCP es lo que te da una IP automáticamente al conectarte."
    },
    "UDP:68": {
        "app": "DHCP Client",
        "explanation": "Tu dispositivo está solicitando una dirección IP.",
        "security": "✅ Proceso normal al conectarse a una red.",
        "learn": "Sin DHCP, tendrías que configurar tu IP manualmente."
    },
    "ICMP:0": {
        "app": "Ping/Echo",
        "explanation": "Alguien está verificando si un dispositivo está activo.",
        "security": "ℹ️ Normal para diagnósticos de red.",
        "learn": "Ping es como tocar una puerta para ver si hay alguien en casa."
    },
}

# IPs/dominios conocidos
KNOWN_SERVICES = {
    "netflix": "🎬 Netflix - Streaming de video",
    "google": "🔍 Google - Servicios de búsqueda y cloud",
    "facebook": "📘 Facebook/Meta - Red social",
    "instagram": "📷 Instagram - Red social de fotos",
    "whatsapp": "💬 WhatsApp - Mensajería",
    "apple": "🍎 Apple - Servicios de iCloud y actualizaciones",
    "microsoft": "🪟 Microsoft - Servicios Windows y Office",
    "amazon": "📦 Amazon - Comercio y AWS",
    "spotify": "🎵 Spotify - Streaming de música",
    "youtube": "📺 YouTube - Streaming de video",
    "twitter": "🐦 Twitter/X - Red social",
    "slack": "💼 Slack - Comunicación empresarial",
    "zoom": "📹 Zoom - Videoconferencias",
    "discord": "🎮 Discord - Chat para gamers",
    "github": "💻 GitHub - Desarrollo de software",
    "cloudflare": "☁️ Cloudflare - CDN y seguridad web",
    "akamai": "🌐 Akamai - CDN (entrega de contenido)",
}


class AIExplainerService:
    """Servicio de IA para explicaciones educativas de tráfico de red."""
    
    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        model: str = "llama3.2:3b",
        timeout: float = 30.0
    ):
        self.ollama_url = ollama_url
        self.model = model
        self.timeout = timeout
        self.is_available = False
        self._explanation_cache: Dict[str, dict] = {}
        
    async def check_ollama_status(self) -> Dict[str, Any]:
        """Verifica si Ollama está disponible y qué modelos tiene."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
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
    
    def _get_cache_key(self, protocol: str, port: Optional[int]) -> str:
        """Genera clave de cache para un patrón."""
        return f"{protocol}:{port}" if port else protocol
    
    def _detect_service(self, ip: str, domain: Optional[str] = None) -> Optional[str]:
        """Detecta servicio conocido por IP o dominio."""
        check_str = (domain or ip).lower()
        for service, description in KNOWN_SERVICES.items():
            if service in check_str:
                return description
        return None
    
    def _get_cached_explanation(self, protocol: str, port: Optional[int]) -> Optional[dict]:
        """Busca explicación en cache de patrones conocidos."""
        cache_key = self._get_cache_key(protocol, port)
        return KNOWN_PATTERNS.get(cache_key)
    
    async def explain_packet(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int] = None,
        dst_port: Optional[int] = None,
        flags: Optional[str] = None,
        length: int = 0,
        use_ai: bool = True
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
                    "size": f"{length} bytes"
                }
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
            explanation = await self._query_ollama(
                protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
            )
            return explanation
        except Exception as e:
            logger.error(f"Error con Ollama: {e}")
            return self._generate_basic_explanation(
                protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
            )
    
    def _generate_basic_explanation(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int],
        dst_port: Optional[int],
        flags: Optional[str],
        length: int,
        service: Optional[str]
    ) -> Dict[str, Any]:
        """Genera explicación básica sin IA."""
        
        # Determinar dirección
        is_outgoing = src_ip.startswith(("192.168.", "10.", "172.16."))
        direction = "enviando datos a" if is_outgoing else "recibiendo datos de"
        
        # Explicación básica
        if service:
            explanation = f"Tu dispositivo está {direction} {service}."
        else:
            explanation = f"Conexión {protocol} desde {src_ip} hacia {dst_ip}."
        
        # Seguridad básica
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
                "size": f"{length} bytes"
            }
        }
    
    async def _query_ollama(
        self,
        protocol: str,
        src_ip: str,
        dst_ip: str,
        src_port: Optional[int],
        dst_port: Optional[int],
        flags: Optional[str],
        length: int,
        service: Optional[str]
    ) -> Dict[str, Any]:
        """Consulta Ollama para generar explicación."""
        
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
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,  # Más determinista
                            "num_predict": 200   # Limitar tokens
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    
                    # Intentar parsear JSON de la respuesta
                    try:
                        # Limpiar respuesta (a veces viene con markdown)
                        clean_text = response_text.strip()
                        if clean_text.startswith("```"):
                            clean_text = clean_text.split("```")[1]
                            if clean_text.startswith("json"):
                                clean_text = clean_text[4:]
                        
                        parsed = json.loads(clean_text)
                        parsed["source"] = "ollama"
                        parsed["details"] = {
                            "protocol": protocol,
                            "src": f"{src_ip}:{src_port}" if src_port else src_ip,
                            "dst": f"{dst_ip}:{dst_port}" if dst_port else dst_ip,
                            "flags": flags,
                            "size": f"{length} bytes"
                        }
                        return parsed
                    except json.JSONDecodeError:
                        logger.warning(f"No se pudo parsear respuesta Ollama: {response_text[:100]}")
                        
        except asyncio.TimeoutError:
            logger.warning("Timeout esperando respuesta de Ollama")
        except Exception as e:
            logger.error(f"Error consultando Ollama: {e}")
        
        # Fallback a explicación básica
        return self._generate_basic_explanation(
            protocol, src_ip, dst_ip, src_port, dst_port, flags, length, service
        )
    
    async def explain_alert(
        self,
        alert_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, str]:
        """Explica una alerta de seguridad de forma educativa."""
        
        alert_explanations = {
            "http_unencrypted": {
                "title": "Conexión sin encriptar detectada",
                "explanation": "Este sitio web no usa HTTPS. Es como enviar una postal en lugar de una carta sellada - cualquiera en el camino podría leerla.",
                "risk": "medio",
                "action": "Evita introducir contraseñas o datos personales en sitios HTTP.",
                "learn": "HTTPS usa certificados digitales para crear un 'túnel' seguro entre tu navegador y el servidor."
            },
            "unusual_port": {
                "title": "Puerto inusual detectado",
                "explanation": f"Se detectó tráfico en el puerto {context.get('port', '?')}. Este puerto no es común para uso normal.",
                "risk": "bajo",
                "action": "Verifica qué aplicación está usando este puerto.",
                "learn": "Los puertos son como puertas numeradas. Cada servicio tiene su puerta asignada."
            },
            "late_night_traffic": {
                "title": "Actividad nocturna",
                "explanation": "Se detectó tráfico de red a una hora inusual. Podría ser una actualización automática o algo más.",
                "risk": "bajo",
                "action": "Revisa qué aplicaciones tienen permiso para ejecutarse en segundo plano.",
                "learn": "Muchas apps actualizan sus datos por la noche cuando no usas el dispositivo."
            },
            "dns_unusual": {
                "title": "Consulta DNS sospechosa",
                "explanation": "Tu dispositivo buscó un dominio que parece generado aleatoriamente. Esto puede indicar malware.",
                "risk": "alto",
                "action": "Ejecuta un escaneo antivirus en tu dispositivo.",
                "learn": "El malware a menudo usa dominios aleatorios para comunicarse con servidores de control."
            }
        }
        
        return alert_explanations.get(alert_type, {
            "title": "Alerta de red",
            "explanation": "Se detectó actividad inusual en tu red.",
            "risk": "desconocido",
            "action": "Revisa los detalles del tráfico.",
            "learn": "Monitorear tu red te ayuda a entender y proteger tus dispositivos."
        })


# Instancia global del servicio
ai_service = AIExplainerService()
