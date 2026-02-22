"""
Modelos Pydantic para DNS Tracking
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DNSQuery(BaseModel):
    """Una consulta DNS capturada"""
    id: str
    timestamp: datetime
    query_name: str  # Dominio consultado (ej: google.com)
    query_type: str  # Tipo de registro (A, AAAA, CNAME, MX, TXT, etc.)
    src_ip: str
    dst_ip: str  # Servidor DNS
    process_name: Optional[str] = None
    pid: Optional[int] = None
    
    # Para detección de tunneling
    query_length: int = 0  # Longitud del dominio
    subdomain_count: int = 0  # Cantidad de subdominios
    entropy: float = 0.0  # Entropía del dominio
    is_suspicious: bool = False
    suspicion_reasons: List[str] = []


class DNSResponse(BaseModel):
    """Una respuesta DNS capturada"""
    query_id: str
    timestamp: datetime
    response_code: str  # NOERROR, NXDOMAIN, SERVFAIL, etc.
    answers: List[str] = []  # IPs o valores resueltos
    ttl: Optional[int] = None


class DNSRecord(BaseModel):
    """Registro combinado de query + response"""
    query: DNSQuery
    response: Optional[DNSResponse] = None
    resolved: bool = False


class DNSStats(BaseModel):
    """Estadísticas de DNS"""
    total_queries: int
    unique_domains: int
    queries_by_type: dict  # {"A": 100, "AAAA": 50, ...}
    top_domains: List[dict]  # [{"domain": "google.com", "count": 50}, ...]
    top_processes: List[dict]  # [{"process": "chrome", "count": 200}, ...]
    suspicious_queries: int
    failed_queries: int  # NXDOMAIN, etc.
    queries_per_minute: float


class DNSProcessStats(BaseModel):
    """Estadísticas DNS por proceso"""
    process_name: str
    pid: Optional[int] = None
    total_queries: int
    unique_domains: int
    domains: List[str]
    suspicious_count: int
    last_query: Optional[datetime] = None


class DNSTunnelingIndicators(BaseModel):
    """Indicadores de posible DNS tunneling"""
    long_queries: int  # Queries > 50 chars
    high_entropy_queries: int  # Entropía > 3.5
    many_subdomains: int  # > 4 subdominios
    unusual_types: int  # TXT, NULL records
    high_frequency: bool  # Muchas queries en poco tiempo
    score: float  # 0-100, probabilidad de tunneling
    score: float  # 0-100, probabilidad de tunneling
