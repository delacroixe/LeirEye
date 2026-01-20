"""Rutas para captura de paquetes"""

import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException, WebSocket

from ..schemas import CaptureRequest, CaptureStatus
from ..services.packet_capture import capture_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/capture", tags=["capture"])


@router.get("/interfaces")
async def get_interfaces():
    """Obtiene las interfaces de red disponibles"""
    try:
        interfaces = capture_service.get_available_interfaces()
        return {"interfaces": interfaces}
    except Exception as e:
        logger.error(f"Error obteniendo interfaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_capture(request: CaptureRequest):
    """Inicia la captura de paquetes"""
    try:
        capture_service.start_capture(
            interface=request.interface,
            packet_filter=request.packet_filter,
            max_packets=request.max_packets,
        )
        return {"message": "Captura iniciada", "status": capture_service.get_status()}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error iniciando captura: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_capture():
    """Resetea el estado de captura (para recovery)"""
    try:
        capture_service.reset()
        return {"message": "Estado reseteado", "status": capture_service.get_status()}
    except Exception as e:
        logger.error(f"Error reseteando captura: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_capture():
    """Detiene la captura"""
    try:
        stats = capture_service.stop_capture()
        return {"message": "Captura detenida", "stats": stats.model_dump()}
    except Exception as e:
        logger.error(f"Error deteniendo captura: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_status() -> CaptureStatus:
    """Obtiene el status actual de captura"""
    status = capture_service.get_status()
    return CaptureStatus(**status)


@router.get("/packets")
async def get_packets(limit: int = 100):
    """Obtiene últimos N paquetes capturados"""
    packets = capture_service.get_packets(limit)
    return {
        "count": len(packets),
        "packets": [p.model_dump(mode="json") for p in packets],
    }


@router.post("/clear")
async def clear_packets():
    """Limpia el buffer de paquetes"""
    capture_service.clear_packets()
    return {"message": "Buffer limpiado"}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para streaming de paquetes en tiempo real"""
    await websocket.accept()

    try:
        # Enviar estado inicial
        await websocket.send_json(
            {"type": "status", "data": capture_service.get_status()}
        )
        logger.info("WebSocket: Cliente conectado")

        # Loop para enviar paquetes pendientes
        while True:
            try:
                # Obtener paquetes pendientes de la queue (non-blocking)
                pending_packets = capture_service.get_pending_packets()

                if pending_packets:
                    logger.debug(
                        f"Enviando {len(pending_packets)} paquetes via WebSocket"
                    )

                for packet in pending_packets:
                    try:
                        await websocket.send_json(
                            {"type": "packet", "data": packet.model_dump(mode="json")}
                        )
                        logger.debug(
                            f"Paquete enviado via WebSocket: {packet.src_ip} -> {packet.dst_ip}"
                        )
                    except Exception as e:
                        logger.error(f"Error enviando paquete: {e}")
                        break

                # Escuchar comandos del cliente (con timeout para no bloquear)
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                    command = json.loads(data)

                    if command.get("action") == "status":
                        await websocket.send_json(
                            {"type": "status", "data": capture_service.get_status()}
                        )
                    elif command.get("action") == "stats":
                        stats = capture_service.stop_capture()
                        await websocket.send_json(
                            {"type": "stats", "data": stats.model_dump(mode="json")}
                        )
                except asyncio.TimeoutError:
                    # Timeout normal, continuar
                    pass

                # Pequeña pausa para no saturar CPU
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error en loop WebSocket: {e}")
                break

    except Exception as e:
        logger.error(f"Error en WebSocket: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("WebSocket: Cliente desconectado")
        logger.info("WebSocket: Cliente desconectado")
