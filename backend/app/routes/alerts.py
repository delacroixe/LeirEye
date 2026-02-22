"""Rutas de alertas del sistema"""

import asyncio
import json
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket

from ..schemas.alerts import Alert, AlertSeverity, AlertStats, AlertType
from ..services.alerts import alert_manager
from ..services.pattern_detector import pattern_detector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[Alert])
async def get_alerts(
    alert_type: Optional[AlertType] = Query(None, description="Filtrar por tipo de alerta"),
    severity: Optional[AlertSeverity] = Query(None, description="Filtrar por severidad"),
    acknowledged: Optional[bool] = Query(None, description="Filtrar por estado de reconocimiento"),
    limit: int = Query(100, ge=1, le=500, description="Límite de resultados")
):
    """Obtiene lista de alertas con filtros opcionales"""
    types = [alert_type] if alert_type else None
    severities = [severity] if severity else None
    
    alerts = alert_manager.get_alerts(
        types=types,
        severities=severities,
        acknowledged=acknowledged,
        limit=limit
    )
    return alerts


@router.get("/stats", response_model=AlertStats)
async def get_alert_stats():
    """Obtiene estadísticas de alertas"""
    return alert_manager.get_stats()


@router.get("/recent", response_model=List[Alert])
async def get_recent_alerts(
    limit: int = Query(10, ge=1, le=50, description="Número de alertas recientes")
):
    """Obtiene las alertas más recientes"""
    return alert_manager.get_alerts(limit=limit)


@router.get("/unacknowledged", response_model=List[Alert])
async def get_unacknowledged_alerts():
    """Obtiene todas las alertas no reconocidas"""
    return alert_manager.get_alerts(acknowledged=False)


@router.get("/critical", response_model=List[Alert])
async def get_critical_alerts():
    """Obtiene alertas críticas y de alta severidad"""
    critical = alert_manager.get_alerts(severity=AlertSeverity.CRITICAL)
    high = alert_manager.get_alerts(severity=AlertSeverity.HIGH)
    return critical + high


@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    """Obtiene una alerta específica por ID"""
    alert = alert_manager.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return alert


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Marca una alerta como reconocida"""
    result = alert_manager.acknowledge(alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {"status": "acknowledged", "alert_id": alert_id}


@router.post("/acknowledge-all")
async def acknowledge_all_alerts():
    """Marca todas las alertas como reconocidas"""
    count = alert_manager.acknowledge_all()
    return {"status": "acknowledged", "count": count}


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    """Elimina una alerta específica"""
    success = alert_manager.delete_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {"status": "deleted", "alert_id": alert_id}


@router.delete("")
async def clear_alerts():
    """Limpia todas las alertas"""
    count = alert_manager.clear_all()
    return {"status": "cleared", "count": count}


@router.get("/detector/stats")
async def get_detector_stats():
    """Obtiene estadísticas del detector de patrones"""
    return pattern_detector.get_stats()


@router.post("/detector/enable")
async def enable_detector():
    """Habilita el detector de patrones"""
    pattern_detector.enable()
    return {"status": "enabled"}


@router.post("/detector/disable")
async def disable_detector():
    """Deshabilita el detector de patrones"""
    pattern_detector.disable()
    return {"status": "disabled"}


@router.post("/detector/reset")
async def reset_detector():
    """Resetea el estado del detector de patrones"""
    pattern_detector.reset()
    return {"status": "reset"}


# Cola de alertas para WebSocket
_alert_subscribers = []


def broadcast_alert(alert: Alert):
    """Agrega una alerta a todos los suscriptores"""
    for subscriber in _alert_subscribers:
        try:
            subscriber.put_nowait(alert)
        except asyncio.QueueFull:
            pass


@router.websocket("/ws")
async def alerts_websocket(websocket: WebSocket):
    """
    WebSocket para recibir alertas en tiempo real.
    
    Envía alertas automáticamente cuando se generan, sin necesidad de polling.
    Formato de mensajes:
    - {"type": "alert", "data": {...}}  - Nueva alerta
    - {"type": "stats", "data": {...}}  - Estadísticas actualizadas
    """
    await websocket.accept()
    
    # Crear cola para este cliente
    client_queue = asyncio.Queue(maxsize=50)
    _alert_subscribers.append(client_queue)
    
    logger.info("WebSocket Alerts: Cliente conectado")
    
    try:
        # Enviar estadísticas iniciales
        await websocket.send_json({
            "type": "stats",
            "data": alert_manager.get_stats().model_dump()
        })
        
        # Enviar alertas no reconocidas recientes
        recent_alerts = alert_manager.get_alerts(acknowledged=False, limit=10)
        for alert in recent_alerts:
            await websocket.send_json({
                "type": "alert",
                "data": alert.model_dump(mode="json")
            })
        
        last_stats_update = asyncio.get_event_loop().time()
        
        while True:
            try:
                # Esperar nuevas alertas o timeout
                try:
                    alert = await asyncio.wait_for(client_queue.get(), timeout=5.0)
                    await websocket.send_json({
                        "type": "alert",
                        "data": alert.model_dump(mode="json")
                    })
                    logger.info(f"Alerta enviada via WebSocket: {alert.title}")
                except asyncio.TimeoutError:
                    pass
                
                # Enviar stats cada 10 segundos
                now = asyncio.get_event_loop().time()
                if now - last_stats_update > 10:
                    await websocket.send_json({
                        "type": "stats",
                        "data": alert_manager.get_stats().model_dump()
                    })
                    last_stats_update = now
                
                # Procesar comandos del cliente
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                    command = json.loads(data)
                    
                    if command.get("action") == "acknowledge":
                        alert_id = command.get("alert_id")
                        if alert_id:
                            alert_manager.acknowledge(alert_id)
                            await websocket.send_json({
                                "type": "acknowledged",
                                "data": {"alert_id": alert_id}
                            })
                    elif command.get("action") == "stats":
                        await websocket.send_json({
                            "type": "stats",
                            "data": alert_manager.get_stats().model_dump()
                        })
                except asyncio.TimeoutError:
                    pass
                
            except Exception as e:
                logger.error(f"Error en loop WebSocket alertas: {e}")
                break
                
    except Exception as e:
        logger.error(f"Error en WebSocket alertas: {e}")
    finally:
        _alert_subscribers.remove(client_queue)
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("WebSocket Alerts: Cliente desconectado")
