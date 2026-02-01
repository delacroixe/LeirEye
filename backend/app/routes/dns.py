"""Rutas de DNS tracking"""

from typing import List, Optional

from fastapi import APIRouter, Query

from ..schemas.dns import DNSProcessStats, DNSRecord, DNSStats, DNSTunnelingIndicators
from ..services.dns_tracker import dns_tracker

router = APIRouter(prefix="/dns", tags=["dns"])


@router.get("/queries", response_model=List[DNSRecord])
async def get_dns_queries(
    domain: Optional[str] = Query(None, description="Filtrar por dominio"),
    process_name: Optional[str] = Query(None, description="Filtrar por proceso"),
    suspicious_only: bool = Query(False, description="Solo mostrar queries sospechosas"),
    limit: int = Query(100, ge=1, le=500, description="Límite de resultados")
):
    """Obtiene lista de queries DNS"""
    return dns_tracker.get_queries(
        domain_filter=domain,
        process_name=process_name,
        suspicious_only=suspicious_only,
        limit=limit
    )


@router.get("/stats", response_model=DNSStats)
async def get_dns_stats():
    """Obtiene estadísticas de DNS"""
    return dns_tracker.get_stats()


@router.get("/stats/processes/{process_name}", response_model=DNSProcessStats)
async def get_dns_process_stats(process_name: str):
    """Obtiene estadísticas DNS de un proceso específico"""
    stats = dns_tracker.get_process_stats(process_name)
    if not stats:
        return DNSProcessStats(
            process_name=process_name,
            pid=None,
            total_queries=0,
            unique_domains=0,
            domains=[],
            suspicious_count=0,
            last_query=None
        )
    return stats


@router.get("/top-domains")
async def get_top_domains(
    limit: int = Query(20, ge=1, le=100, description="Número de dominios")
):
    """Obtiene los dominios más consultados"""
    stats = dns_tracker.get_stats()
    return stats.top_domains[:limit]


@router.get("/suspicious", response_model=List[DNSRecord])
async def get_suspicious_queries():
    """Obtiene queries DNS sospechosas (potencial tunneling)"""
    return dns_tracker.get_queries(suspicious_only=True)


@router.get("/tunneling-indicators", response_model=DNSTunnelingIndicators)
async def get_tunneling_indicators():
    """Obtiene indicadores de DNS tunneling"""
    return dns_tracker.get_tunneling_indicators()


@router.get("/by-process/{process_name}", response_model=List[DNSRecord])
async def get_dns_by_process(
    process_name: str,
    limit: int = Query(50, ge=1, le=200)
):
    """Obtiene queries DNS de un proceso específico"""
    return dns_tracker.get_queries(process_name=process_name, limit=limit)


@router.get("/query/{query_id}")
async def get_dns_query_by_id(query_id: str):
    """
    Obtiene una query DNS específica por su ID.
    Útil para cruzar con paquetes capturados.
    """
    record = dns_tracker.get_query_by_id(query_id)
    if not record:
        return {"error": "Query no encontrada", "query_id": query_id}
    return record


@router.post("/clear")
async def clear_dns_history():
    """Limpia el historial de DNS"""
    dns_tracker.clear()
    return {"status": "cleared"}
