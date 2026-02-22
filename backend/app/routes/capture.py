"""Rutas para captura de paquetes"""

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel

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


@router.get("/packets-by-process")
async def get_packets_by_process():
    """Obtiene estadísticas de paquetes agrupados por proceso"""
    packets = capture_service.get_packets(10000)  # Obtener todos
    
    process_stats = {}
    for packet in packets:
        process_name = packet.process_name or "Unknown"
        if process_name not in process_stats:
            process_stats[process_name] = {
                "count": 0,
                "bytes": 0,
                "protocols": {},
                "ports": set(),
                "ips": set()
            }
        
        process_stats[process_name]["count"] += 1
        process_stats[process_name]["bytes"] += packet.length
        
        # Protocolos
        protocol = packet.protocol
        process_stats[process_name]["protocols"][protocol] = (
            process_stats[process_name]["protocols"].get(protocol, 0) + 1
        )
        
        # Puertos
        if packet.src_port:
            process_stats[process_name]["ports"].add(packet.src_port)
        if packet.dst_port:
            process_stats[process_name]["ports"].add(packet.dst_port)
        
        # IPs
        process_stats[process_name]["ips"].add(packet.src_ip)
        process_stats[process_name]["ips"].add(packet.dst_ip)
    
    # Convertir sets a listas para JSON
    result = {}
    for process_name, stats in process_stats.items():
        result[process_name] = {
            "count": stats["count"],
            "bytes": stats["bytes"],
            "protocols": stats["protocols"],
            "ports": sorted(list(stats["ports"])),
            "ips": sorted(list(stats["ips"]))
        }
    
    # Ordenar por cantidad de paquetes
    sorted_result = dict(
        sorted(result.items(), key=lambda x: x[1]["count"], reverse=True)
    )
    
    return sorted_result


@router.get("/packets-by-process/{process_name}")
async def get_packets_by_process_name(process_name: str, limit: int = 100):
    """Obtiene paquetes de un proceso específico"""
    packets = capture_service.get_packets(10000)
    
    filtered_packets = [
        p for p in packets
        if (p.process_name or "Unknown") == process_name
    ]
    
    # Limitar resultados
    filtered_packets = filtered_packets[-limit:]
    
    return {
        "process": process_name,
        "count": len(filtered_packets),
        "packets": [p.model_dump(mode="json") for p in filtered_packets]
    }


@router.get("/packets-by-dns/{dns_query_id}")
async def get_packets_by_dns_query(dns_query_id: str, limit: int = 100):
    """
    Obtiene paquetes asociados a un query DNS específico.
    Permite cruzar información entre la vista DNS y la captura.
    """
    packets = capture_service.get_packets(10000)
    
    filtered_packets = [
        p for p in packets
        if p.dns_query_id == dns_query_id
    ]
    
    # Limitar resultados
    filtered_packets = filtered_packets[-limit:]
    
    return {
        "dns_query_id": dns_query_id,
        "count": len(filtered_packets),
        "packets": [p.model_dump(mode="json") for p in filtered_packets]
    }


@router.get("/dns-packets")
async def get_dns_packets(limit: int = 100):
    """
    Obtiene todos los paquetes DNS capturados.
    Útil para ver la actividad DNS en la captura.
    """
    packets = capture_service.get_packets(10000)
    
    dns_packets = [
        p for p in packets
        if p.protocol == "DNS" or p.dns_query_id is not None
    ]
    
    # Limitar resultados
    dns_packets = dns_packets[-limit:]
    
    return {
        "count": len(dns_packets),
        "packets": [p.model_dump(mode="json") for p in dns_packets]
    }


@router.post("/clear")
async def clear_packets():
    """Limpia el buffer de paquetes"""
    capture_service.clear_packets()
    return {"message": "Buffer limpiado"}


class TCPFlags(BaseModel):
    syn: bool = False
    ack: bool = False
    fin: bool = False
    rst: bool = False
    psh: bool = False
    urg: bool = False


class SendPacketRequest(BaseModel):
    protocol: str
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    payload: Optional[str] = None
    ttl: int = 64
    tcp_flags: Optional[TCPFlags] = None
    icmp_type: Optional[int] = None


@router.post("/send-packet")
async def send_crafted_packet(request: SendPacketRequest):
    """
    Envía un paquete de red crafteado manualmente.
    
    ⚠️ ADVERTENCIA: Esta funcionalidad requiere permisos especiales y 
    solo debe usarse en redes donde tengas autorización.
    """
    try:
        # Por seguridad, validar que el destino sea una IP válida
        import ipaddress
        try:
            ipaddress.ip_address(request.dst_ip)
        except ValueError:
            raise HTTPException(status_code=400, detail="IP de destino inválida")
        
        # Construir información del paquete para logging
        packet_info = {
            "protocol": request.protocol,
            "src_ip": request.src_ip,
            "dst_ip": request.dst_ip,
            "src_port": request.src_port,
            "dst_port": request.dst_port,
            "ttl": request.ttl,
        }
        
        logger.info(f"📤 Solicitud de envío de paquete: {packet_info}")
        
        # En un entorno real, aquí usaríamos scapy para enviar el paquete
        # Por ahora, simulamos el envío para propósitos educativos
        
        # Simular delay de red
        import asyncio
        await asyncio.sleep(0.1)
        
        # Respuesta exitosa (simulada)
        message = f"Paquete {request.protocol} enviado a {request.dst_ip}"
        if request.dst_port:
            message += f":{request.dst_port}"
        
        return {
            "success": True,
            "message": message,
            "packet_info": packet_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando paquete: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
