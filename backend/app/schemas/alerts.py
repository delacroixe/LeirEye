"""
Modelos Pydantic para Sistema de Alertas
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class AlertSeverity(str, Enum):
    """Niveles de severidad de alertas"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Tipos de alertas soportados"""
    DNS_TUNNELING = "dns_tunneling"
    DNS_UNUSUAL = "dns_unusual"
    PORT_SCAN = "port_scan"
    NEW_CONNECTION = "new_connection"
    GEO_UNUSUAL = "geo_unusual"
    HIGH_TRAFFIC = "high_traffic"
    UNENCRYPTED_DATA = "unencrypted_data"
    SUSPICIOUS_PROCESS = "suspicious_process"
    FAILED_AUTH = "failed_auth"
    CUSTOM = "custom"


class AlertSource(BaseModel):
    """Origen de la alerta"""
    process_name: Optional[str] = None
    pid: Optional[int] = None
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    domain: Optional[str] = None


class Alert(BaseModel):
    """Modelo de alerta genérica"""
    id: str
    timestamp: datetime
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    source: AlertSource
    metadata: dict = {}
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None


class AlertCreate(BaseModel):
    """Para crear una alerta manualmente"""
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    source: AlertSource = AlertSource()
    metadata: dict = {}


class AlertUpdate(BaseModel):
    """Para actualizar una alerta"""
    acknowledged: Optional[bool] = None


class AlertStats(BaseModel):
    """Estadísticas de alertas"""
    total: int
    unacknowledged: int
    by_severity: dict  # {"high": 5, "medium": 10, ...}
    by_type: dict  # {"dns_tunneling": 3, ...}
    recent_24h: int


class AlertFilter(BaseModel):
    """Filtros para consultar alertas"""
    types: Optional[List[AlertType]] = None
    severities: Optional[List[AlertSeverity]] = None
    acknowledged: Optional[bool] = None
    process_name: Optional[str] = None
    since: Optional[datetime] = None
    limit: int = 100
    limit: int = 100
