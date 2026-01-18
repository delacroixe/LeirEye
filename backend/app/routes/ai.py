"""
Rutas API para el servicio de IA explicativa.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from ..services.ai_explainer import ai_service

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
            use_ai=request.use_ai
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
            alert_type=request.alert_type,
            context=request.context
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
    from ..services.ai_explainer import KNOWN_PATTERNS, KNOWN_SERVICES
    
    return {
        "patterns_count": len(KNOWN_PATTERNS),
        "services_count": len(KNOWN_SERVICES),
        "patterns": list(KNOWN_PATTERNS.keys()),
        "services": list(KNOWN_SERVICES.keys())
    }
