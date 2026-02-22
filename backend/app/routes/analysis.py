from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies.auth import get_current_user
from app.services.network_analysis import DeviceDiscovery, analysis_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/scan", response_model=List[DeviceDiscovery])
async def start_scan(
    force: bool = Query(False, description="Forzar un nuevo escaneo ignorando la caché"),
    current_user: dict = Depends(get_current_user)
):
    """
    Inicia un escaneo de la red local para descubrir dispositivos y sus vulnerabilidades.
    Usa caché por defecto (TTL 5 min).
    """
    try:
        results = await analysis_service.scan_network(force=force)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/devices", response_model=List[DeviceDiscovery])
async def get_discovered_devices(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene los últimos dispositivos descubiertos desde la caché.
    """
    if not analysis_service.cache:
        # Si no hay caché, intentamos realizar un escaneo rápido
        return await analysis_service.scan_network()
    return analysis_service.cache.devices
