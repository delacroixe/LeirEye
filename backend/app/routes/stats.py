"""Rutas para estadísticas"""
from fastapi import APIRouter
from ..services.packet_capture import capture_service

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary")
async def get_summary():
    """Obtiene resumen de estadísticas"""
    status = capture_service.get_status()
    packets = capture_service.packets
    stats = capture_service.stats
    
    return {
        "total_packets": stats['total'],
        "tcp": stats['tcp'],
        "udp": stats['udp'],
        "icmp": stats['icmp'],
        "other": stats['other'],
        "top_src_ips": dict(sorted(
            stats['ips_src'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]),
        "top_dst_ips": dict(sorted(
            stats['ips_dst'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]),
        "top_ports": dict(sorted(
            stats['ports'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10])
    }


@router.get("/protocols")
async def get_protocol_distribution():
    """Distribución de protocolos"""
    stats = capture_service.stats
    total = stats['total'] or 1
    
    return {
        "tcp": {"count": stats['tcp'], "percentage": (stats['tcp']/total)*100},
        "udp": {"count": stats['udp'], "percentage": (stats['udp']/total)*100},
        "icmp": {"count": stats['icmp'], "percentage": (stats['icmp']/total)*100},
        "other": {"count": stats['other'], "percentage": (stats['other']/total)*100}
    }


@router.get("/top-ips")
async def get_top_ips(limit: int = 10):
    """Top IPs origen y destino"""
    stats = capture_service.stats
    
    return {
        "top_src": dict(sorted(
            stats['ips_src'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]),
        "top_dst": dict(sorted(
            stats['ips_dst'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit])
    }


@router.get("/top-ports")
async def get_top_ports(limit: int = 15):
    """Top puertos"""
    stats = capture_service.stats
    
    return {
        "ports": dict(sorted(
            stats['ports'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit])
    }
