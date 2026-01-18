"""Modelos de datos para la API"""
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime


class PacketData(BaseModel):
    """Datos de un paquete capturado"""
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: str
    length: int
    payload_preview: Optional[str] = None
    flags: Optional[str] = None


class CaptureStats(BaseModel):
    """Estadísticas de captura"""
    total_packets: int
    tcp_packets: int
    udp_packets: int
    icmp_packets: int
    other_packets: int
    top_src_ips: Dict[str, int]
    top_dst_ips: Dict[str, int]
    top_ports: Dict[int, int]
    capture_duration: float


class CaptureRequest(BaseModel):
    """Request para iniciar captura"""
    interface: Optional[str] = None
    packet_filter: Optional[str] = None
    max_packets: int = 1000


class CaptureStatus(BaseModel):
    """Status de la captura"""
    is_running: bool
    packets_captured: int
    interface: Optional[str] = None
    filter: Optional[str] = None
