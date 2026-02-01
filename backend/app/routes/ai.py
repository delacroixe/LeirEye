"""
Rutas API para el servicio de IA explicativa.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..schemas.chat import ChatRequest, ChatResponse
from ..services.ai_explainer import ai_service
from ..services.ai_explainer.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()


class PacketExplainRequest(BaseModel):
    """Solicitud para explicar un paquete."""

    protocol: str
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    flags: Optional[str] = None
    length: int = 0
    use_ai: bool = True


class WiFiAnalysisRequest(BaseModel):
    """Solicitud para analizar el entorno WiFi."""
    networks: List[Dict[str, Any]]


class DNSAnalysisRequest(BaseModel):
    """Solicitud para analizar amenazas DNS."""
    logs: List[Dict[str, Any]]


class AlertExplainRequest(BaseModel):
    """Solicitud para explicar una alerta."""

    alert_type: str
    context: Dict[str, Any] = {}


@router.get("/status")
async def get_ai_status():
    """
    Verifica el estado del servicio de IA (Ollama).

    Retorna:
    - available: Si Ollama está corriendo
    - models: Lista de modelos disponibles
    - has_required_model: Si tiene el modelo necesario
    """
    status = await ai_service.check_ollama_status()
    return status


@router.post("/explain-packet")
async def explain_packet(request: PacketExplainRequest):
    """
    Genera una explicación educativa de un paquete de red.

    Estrategia de 3 niveles:
    1. Cache de patrones conocidos (instantáneo)
    2. Ollama IA local (1-3 segundos)
    3. Explicación básica (fallback)

    Retorna explicación con:
    - app: Aplicación/servicio identificado
    - explanation: Qué está pasando en lenguaje simple
    - security: Nivel de seguridad (✅⚠️❌)
    - learn: Dato educativo
    """
    try:
        explanation = await ai_service.explain_packet(
            protocol=request.protocol,
            src_ip=request.src_ip,
            dst_ip=request.dst_ip,
            src_port=request.src_port,
            dst_port=request.dst_port,
            flags=request.flags,
            length=request.length,
            use_ai=request.use_ai,
        )
        return explanation
    except Exception as e:
        logger.error(f"Error explicando paquete: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-alert")
async def explain_alert(request: AlertExplainRequest):
    """
    Explica una alerta de seguridad de forma educativa.

    Tipos de alerta soportados:
    - http_unencrypted: Conexión HTTP sin cifrar
    - unusual_port: Puerto no estándar
    - late_night_traffic: Actividad a horas inusuales
    - dns_unusual: Consulta DNS sospechosa
    """
    try:
        explanation = await ai_service.explain_alert(
            alert_type=request.alert_type, context=request.context
        )
        return explanation
    except Exception as e:
        logger.error(f"Error explicando alerta: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patterns")
async def get_known_patterns():
    """
    Lista los patrones de tráfico conocidos que tienen explicación en cache.
    Útil para debugging y para ver qué puertos/protocolos están documentados.
    """
    from ..services.ai_explainer.patterns import KNOWN_PATTERNS, KNOWN_SERVICES

    return {
        "patterns_count": len(KNOWN_PATTERNS),
        "services_count": len(KNOWN_SERVICES),
        "patterns": list(KNOWN_PATTERNS.keys()),
        "services": list(KNOWN_SERVICES.keys()),
    }


class PacketSuggestionRequest(BaseModel):
    """Solicitud para obtener sugerencias de IA para un paquete."""
    protocol: str
    srcIp: str
    dstIp: str
    srcPort: int
    dstPort: int
    query: str


class GeneratePacketRequest(BaseModel):
    """Solicitud para generar configuración de paquete con IA."""
    intent: str
    protocol: str


@router.post("/packet-suggestion")
async def get_packet_suggestion(request: PacketSuggestionRequest):
    """
    Obtiene sugerencias de IA para configurar un paquete de red.
    """
    try:
        query = request.query.lower()
        
        # Base de conocimiento para sugerencias
        suggestions = {
            "ping": {
                "suggestion": "Usa ICMP Echo Request (tipo 8) para hacer ping",
                "explanation": "El protocolo ICMP se usa para diagnóstico de red. El tipo 8 es una solicitud de eco que espera una respuesta tipo 0.",
                "securityTip": "⚠️ Algunos firewalls bloquean ICMP. Úsalo solo en redes donde tengas permiso."
            },
            "web": {
                "suggestion": "TCP puerto 80 para HTTP o 443 para HTTPS",
                "explanation": "Las conexiones web usan TCP con el handshake SYN→SYN-ACK→ACK antes de enviar datos.",
                "securityTip": "✅ Usa puerto 443 (HTTPS) para conexiones seguras cifradas."
            },
            "http": {
                "suggestion": "TCP puerto 80 con payload HTTP",
                "explanation": "HTTP usa verbos como GET, POST, PUT, DELETE. El formato incluye headers y body.",
                "securityTip": "⚠️ HTTP no está cifrado. Considera usar HTTPS (puerto 443)."
            },
            "dns": {
                "suggestion": "UDP puerto 53 para consultas DNS",
                "explanation": "DNS normalmente usa UDP para consultas rápidas. Las respuestas grandes pueden usar TCP.",
                "securityTip": "🔒 Considera usar DNS-over-HTTPS (DoH) para mayor privacidad."
            },
            "ssh": {
                "suggestion": "TCP puerto 22 para SSH",
                "explanation": "SSH proporciona acceso remoto seguro y cifrado a servidores.",
                "securityTip": "✅ SSH usa cifrado fuerte. Asegúrate de usar autenticación por clave."
            },
            "ftp": {
                "suggestion": "TCP puertos 20/21 para FTP",
                "explanation": "FTP usa puerto 21 para control y 20 para datos. Es un protocolo sin cifrar.",
                "securityTip": "⚠️ FTP transmite credenciales en texto plano. Usa SFTP o FTPS."
            }
        }
        
        # Buscar coincidencias
        for key, value in suggestions.items():
            if key in query:
                return value
        
        # Sugerencia por protocolo
        protocol_suggestions = {
            "TCP": {
                "suggestion": "Configura los flags TCP según tu necesidad",
                "explanation": "SYN para iniciar conexión, ACK para confirmar, FIN para terminar, RST para resetear.",
                "securityTip": "⚠️ Los escaneos con flags inusuales pueden ser detectados como actividad maliciosa."
            },
            "UDP": {
                "suggestion": "UDP es ideal para streaming y juegos",
                "explanation": "UDP no garantiza entrega pero es más rápido. Ideal para aplicaciones en tiempo real.",
                "securityTip": "ℹ️ UDP puede ser usado para amplificación DDoS. Úsalo responsablemente."
            },
            "ICMP": {
                "suggestion": "Tipo 8 para ping, tipo 0 para respuesta",
                "explanation": "ICMP se usa para diagnóstico de red, no transporta datos de aplicación.",
                "securityTip": "⚠️ Algunos administradores desactivan ICMP por seguridad."
            }
        }
        
        if request.protocol in protocol_suggestions:
            return protocol_suggestions[request.protocol]
        
        # Sugerencia genérica
        return {
            "suggestion": "Configura los campos según tu objetivo",
            "explanation": "Cada protocolo tiene su propósito: TCP para conexiones confiables, UDP para velocidad, ICMP para diagnóstico.",
            "securityTip": "⚠️ Solo envía paquetes a redes donde tengas autorización."
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo sugerencia: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-packet")
async def generate_packet_config(request: GeneratePacketRequest):
    """
    Genera una configuración de paquete basada en la intención del usuario.
    """
    try:
        intent = request.intent.lower()
        protocol = request.protocol
        
        # Configuraciones predefinidas basadas en intención
        configs = {
            "ping": {
                "suggestion": "Configuración de ping lista",
                "explanation": "Se ha configurado un paquete ICMP Echo Request estándar.",
                "config": {
                    "dstIp": "8.8.8.8",
                    "ttl": 64
                },
                "securityTip": "✅ Ping es seguro para diagnóstico básico."
            },
            "test": {
                "suggestion": "Paquete de prueba configurado",
                "explanation": "Configuración básica para pruebas de conectividad.",
                "config": {
                    "dstPort": 80 if protocol == "TCP" else 53,
                    "ttl": 64
                },
                "securityTip": "ℹ️ Asegúrate de tener permiso para enviar paquetes de prueba."
            },
            "web": {
                "suggestion": "Configuración HTTP lista",
                "explanation": "Paquete TCP configurado para conexión web.",
                "config": {
                    "dstPort": 80,
                    "payload": "GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
                    "ttl": 64
                },
                "securityTip": "⚠️ Las conexiones HTTP no están cifradas."
            },
            "dns": {
                "suggestion": "Consulta DNS configurada",
                "explanation": "Paquete UDP para consulta DNS estándar.",
                "config": {
                    "dstIp": "8.8.8.8",
                    "dstPort": 53,
                    "ttl": 64
                },
                "securityTip": "✅ DNS sobre UDP puerto 53 es el estándar."
            }
        }
        
        # Buscar configuración por intención
        for key, value in configs.items():
            if key in intent:
                return value
        
        # Configuración genérica
        return {
            "suggestion": "Configuración básica generada",
            "explanation": f"Se ha preparado un paquete {protocol} con configuración estándar.",
            "config": {
                "ttl": 64,
                "dstPort": 80 if protocol in ["TCP", "HTTP"] else 53 if protocol == "DNS" else None
            },
            "securityTip": "ℹ️ Revisa la configuración antes de enviar."
        }
        
    except Exception as e:
        logger.error(f"Error generando paquete: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/analyze-wifi")
async def analyze_wifi(request: WiFiAnalysisRequest):
    """Analiza el entorno WiFi detectado."""
    try:
        analysis = await ai_service.analyze_wifi_environment(request.networks)
        return analysis
    except Exception as e:
        logger.error(f"Error analizando WiFi: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-dns")
async def analyze_dns(request: DNSAnalysisRequest):
    """Analiza logs de DNS en busca de amenazas."""
    try:
        analysis = await ai_service.analyze_dns_threats(request.logs)
        return analysis
    except Exception as e:
        logger.error(f"Error analizando DNS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crafting-help")
async def packet_crafting_help(request: GeneratePacketRequest):
    """Obtiene ayuda avanzada para construir un paquete."""
    try:
        help_data = await ai_service.get_packet_crafting_help(
            intent=request.intent, protocol=request.protocol
        )
        return help_data
    except Exception as e:
        logger.error(f"Error en ayuda de construcción: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-stats")
async def analyze_stats(request: Dict[str, Any]):
    """Analiza estadísticas de tráfico."""
    try:
        analysis = await ai_service.analyze_traffic_stats(request)
        return analysis
    except Exception as e:
        logger.error(f"Error analizando estadísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-map")
async def analyze_map(request: Dict[str, Any]):
    """Analiza el mapa de red."""
    try:
        analysis = await ai_service.analyze_network_map(request)
        return analysis
    except Exception as e:
        logger.error(f"Error analizando mapa: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_context(request: ChatRequest):
    """
    Chat contextual con IA.
    
    Soporta streaming via HTTP POST + chunked response.
    El frontend debe usar fetch() con response.body.getReader() para leer el stream.
    
    Args:
        request: ChatRequest con mensaje, contexto de página e historial
        
    Returns:
        StreamingResponse con chunks de texto (si stream=True)
        ChatResponse con respuesta completa (si stream=False)
    """
    try:
        if request.stream:
            async def generate():
                async for chunk in chat_service.chat_stream(
                    message=request.message,
                    context=request.context,
                    history=request.history,
                ):
                    yield chunk.encode("utf-8")
            
            return StreamingResponse(
                generate(),
                media_type="text/plain; charset=utf-8",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                },
            )
        else:
            content = await chat_service.chat_complete(
                message=request.message,
                context=request.context,
                history=request.history,
            )
            return ChatResponse(content=content)
            
    except Exception as e:
        logger.error(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
