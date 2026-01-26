"""
Rutas API para análisis de señales WiFi
"""

from fastapi import APIRouter, HTTPException
import logging

from ..services.wifi_service import get_wifi_analysis, WiFiAnalysis

logger = logging.getLogger(__name__)
router = APIRouter(tags=["wifi"])

@router.get("/analysis", response_model=WiFiAnalysis)
async def get_wifi_status():
    """
    Analiza el espectro WiFi circundante y retorna información técnica de cada AP visible.
    """
    try:
        return get_wifi_analysis()
    except Exception as e:
        logger.error(f"Error en API WiFi: {e}")
        raise HTTPException(status_code=500, detail=str(e))
