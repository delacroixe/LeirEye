"""Rutas para estadísticas"""

from fastapi import APIRouter
from ..services.packet_capture import capture_service
from ..services.geoip import is_private_ip, get_batch_locations, get_network_label

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary")
async def get_summary():
    """Obtiene resumen de estadísticas"""
    stats = capture_service.stats

    return {
        "total_packets": stats["total"],
        "tcp": stats["tcp"],
        "udp": stats["udp"],
        "icmp": stats["icmp"],
        "other": stats["other"],
        "top_src_ips": dict(
            sorted(stats["ips_src"].items(), key=lambda x: x[1], reverse=True)[:5]
        ),
        "top_dst_ips": dict(
            sorted(stats["ips_dst"].items(), key=lambda x: x[1], reverse=True)[:5]
        ),
        "top_ports": dict(
            sorted(stats["ports"].items(), key=lambda x: x[1], reverse=True)[:10]
        ),
    }


@router.get("/protocols")
async def get_protocol_distribution():
    """Distribución de protocolos"""
    stats = capture_service.stats
    total = stats["total"] or 1

    return {
        "tcp": {"count": stats["tcp"], "percentage": (stats["tcp"] / total) * 100},
        "udp": {"count": stats["udp"], "percentage": (stats["udp"] / total) * 100},
        "icmp": {"count": stats["icmp"], "percentage": (stats["icmp"] / total) * 100},
        "other": {
            "count": stats["other"],
            "percentage": (stats["other"] / total) * 100,
        },
    }


@router.get("/top-ips")
async def get_top_ips(limit: int = 10):
    """Top IPs origen y destino"""
    stats = capture_service.stats

    return {
        "top_src": dict(
            sorted(stats["ips_src"].items(), key=lambda x: x[1], reverse=True)[:limit]
        ),
        "top_dst": dict(
            sorted(stats["ips_dst"].items(), key=lambda x: x[1], reverse=True)[:limit]
        ),
    }


@router.get("/top-ports")
async def get_top_ports(limit: int = 15):
    """Top puertos"""
    stats = capture_service.stats

    return {
        "ports": dict(
            sorted(stats["ports"].items(), key=lambda x: x[1], reverse=True)[:limit]
        )
    }


@router.get("/network-map")
async def get_network_map():
    """
    Datos para el mapa de red: nodos (IPs) y enlaces (conexiones)
    """
    stats = capture_service.stats
    connections = stats.get("connections", {})

    if not connections:
        return {
            "nodes": [],
            "links": [],
            "summary": {"total_nodes": 0, "total_links": 0},
        }

    # Recopilar todas las IPs únicas
    all_ips = set()
    for conn_key in connections.keys():
        parts = conn_key.split("->")
        if len(parts) == 2:
            all_ips.add(parts[0])
            all_ips.add(parts[1])

    # Obtener geolocalización para todas las IPs
    ip_list = list(all_ips)
    geo_data = await get_batch_locations(ip_list)

    # Construir nodos
    nodes = []
    for ip in all_ips:
        geo = geo_data.get(ip, {})
        is_local = is_private_ip(ip)

        # Calcular tráfico total (entrante + saliente)
        traffic = stats["ips_src"].get(ip, 0) + stats["ips_dst"].get(ip, 0)

        nodes.append(
            {
                "id": ip,
                "label": ip,
                "isLocal": is_local,
                "networkType": get_network_label(ip),
                "traffic": traffic,
                "geo": (
                    {
                        "country": geo.get("country", "Unknown"),
                        "countryCode": geo.get("countryCode", ""),
                        "city": geo.get("city", ""),
                        "isp": geo.get("isp", ""),
                        "lat": geo.get("lat", 0),
                        "lon": geo.get("lon", 0),
                    }
                    if geo
                    else None
                ),
            }
        )

    # Construir enlaces
    links = []
    for conn_key, count in connections.items():
        parts = conn_key.split("->")
        if len(parts) == 2:
            src, dst = parts[0], parts[1]
            # Solo agregar enlaces si ambos nodos existen
            if src in all_ips and dst in all_ips:
                links.append({"source": src, "target": dst, "value": count})

    # Ordenar enlaces por valor (más tráfico primero)
    links = sorted(links, key=lambda x: x["value"], reverse=True)

    # Estadísticas del mapa
    local_nodes = sum(1 for n in nodes if n["isLocal"])
    external_nodes = len(nodes) - local_nodes

    return {
        "nodes": nodes,
        "links": links,
        "summary": {
            "total_nodes": len(nodes),
            "local_nodes": local_nodes,
            "external_nodes": external_nodes,
            "total_links": len(links),
            "total_connections": sum(connections.values()),
        },
    }
