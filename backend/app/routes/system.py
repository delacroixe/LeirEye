"""
Rutas API para información del sistema y procesos de red
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import httpx
import logging

from ..services.system_info import (
    get_system_info,
    get_network_interfaces,
    get_private_ip,
    get_gateway,
    get_dns_servers,
    get_network_connections,
    get_processes_with_connections,
    lookup_process_for_connection,
    DeviceInfo,
    NetworkConnection,
    ProcessWithConnections,
)
from ..services.geoip import get_ip_location

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/info", response_model=DeviceInfo)
async def get_device_info():
    """
    Obtiene información completa del dispositivo:
    - Sistema operativo, CPU, RAM, disco
    - IP privada y pública
    - Geolocalización
    - Interfaces de red
    - Gateway y DNS
    """
    try:
        system = get_system_info()
        interfaces = get_network_interfaces()
        private_ip = get_private_ip()
        gateway = get_gateway()
        dns = get_dns_servers()

        # Obtener IP pública y geolocalización
        public_ip = None
        geo = None

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Obtener IP pública
                ip_response = await client.get("https://api.ipify.org?format=json")
                if ip_response.status_code == 200:
                    public_ip = ip_response.json().get("ip")

                    # Obtener geolocalización
                    geo = await get_ip_location(public_ip)
        except Exception as e:
            logger.warning(f"No se pudo obtener IP pública/geo: {e}")

        return DeviceInfo(
            system=system,
            private_ip=private_ip,
            public_ip=public_ip,
            geolocation=geo,
            interfaces=interfaces,
            gateway=gateway,
            dns_servers=dns,
        )

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dependencia no instalada: {e}. Ejecutar: pip install psutil netifaces",
        )
    except Exception as e:
        logger.error(f"Error obteniendo info del sistema: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections", response_model=list[NetworkConnection])
async def get_active_connections(
    status: Optional[str] = Query(
        None, description="Filtrar por status: ESTABLISHED, TIME_WAIT, etc."
    ),
    limit: int = Query(
        100, ge=1, le=500, description="Máximo de conexiones a retornar"
    ),
):
    """
    Obtiene conexiones de red activas con información del proceso.
    Requiere ejecutar con sudo para ver todos los procesos.
    """
    try:
        connections = get_network_connections(status_filter=status)
        return connections[:limit]

    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"psutil no instalado: {e}")
    except PermissionError:
        raise HTTPException(
            status_code=403, detail="Permisos insuficientes. Ejecutar backend con sudo."
        )
    except Exception as e:
        logger.error(f"Error obteniendo conexiones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/processes-with-connections", response_model=list[ProcessWithConnections])
async def get_processes_connections():
    """
    Obtiene procesos agrupados con sus conexiones de red.
    Ordenados por número de conexiones (más conexiones primero).
    """
    try:
        return get_processes_with_connections()

    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"psutil no instalado: {e}")
    except PermissionError:
        raise HTTPException(
            status_code=403, detail="Permisos insuficientes. Ejecutar backend con sudo."
        )
    except Exception as e:
        logger.error(f"Error obteniendo procesos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection-lookup")
async def lookup_connection(
    ip: str = Query(..., description="IP remota"),
    port: int = Query(..., ge=1, le=65535, description="Puerto remoto"),
):
    """
    Busca qué proceso está conectado a un IP:puerto específico.
    Útil para asociar paquetes capturados con procesos.
    """
    try:
        result = lookup_process_for_connection(ip, port)
        return result

    except Exception as e:
        logger.error(f"Error en lookup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_system_summary():
    """
    Resumen rápido para mostrar en headers/widgets
    """
    try:
        system = get_system_info()
        private_ip = get_private_ip()
        connections = get_network_connections()

        # Contar conexiones por protocolo y estado
        tcp_count = sum(1 for c in connections if c.protocol == "TCP")
        udp_count = len(connections) - tcp_count

        process_names = set(c.process_name for c in connections if c.process_name)

        return {
            "hostname": system.hostname,
            "os": f"{system.os} {system.os_version}",
            "private_ip": private_ip,
            "cpu_percent": system.cpu_percent,
            "memory_percent": system.memory_percent,
            "active_connections": len(connections),
            "tcp_connections": tcp_count,
            "udp_connections": udp_count,
            "unique_processes": len(process_names),
            "uptime_hours": system.uptime_hours,
        }

    except Exception as e:
        logger.error(f"Error en summary: {e}")
        return {"error": str(e)}
