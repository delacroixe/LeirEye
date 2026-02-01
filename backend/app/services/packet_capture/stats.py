"""Gestión de estadísticas de captura"""

from collections import defaultdict
from typing import Dict
from ...schemas import PacketData, CaptureStats
from datetime import datetime


class StatsManager:
    """Gestiona estadísticas de paquetes capturados"""

    def __init__(self):
        self.reset()

    def reset(self):
        """Resetea todas las estadísticas"""
        self.stats = {
            "total": 0,
            "tcp": 0,
            "udp": 0,
            "icmp": 0,
            "other": 0,
            "ips_src": defaultdict(int),
            "ips_dst": defaultdict(int),
            "ports": defaultdict(int),
            "connections": defaultdict(int),
        }

    def update(self, packet_info: PacketData):
        """Actualiza estadísticas con un nuevo paquete"""
        self.stats["ips_src"][packet_info.src_ip] += 1
        self.stats["ips_dst"][packet_info.dst_ip] += 1

        # Registrar conexión para mapa de red
        connection_key = f"{packet_info.src_ip}->{packet_info.dst_ip}"
        self.stats["connections"][connection_key] += 1

        if packet_info.protocol == "TCP":
            self.stats["tcp"] += 1
        elif packet_info.protocol == "UDP":
            self.stats["udp"] += 1
        elif packet_info.protocol == "ICMP":
            self.stats["icmp"] += 1
        else:
            self.stats["other"] += 1

        if packet_info.src_port:
            self.stats["ports"][packet_info.src_port] += 1
        if packet_info.dst_port:
            self.stats["ports"][packet_info.dst_port] += 1

        self.stats["total"] += 1

    def get_summary(self, start_time: datetime) -> CaptureStats:
        """Genera resumen de estadísticas"""
        duration = (datetime.now() - start_time).total_seconds() if start_time else 0

        return CaptureStats(
            total_packets=self.stats["total"],
            tcp_packets=self.stats["tcp"],
            udp_packets=self.stats["udp"],
            icmp_packets=self.stats["icmp"],
            other_packets=self.stats["other"],
            top_src_ips=dict(
                sorted(self.stats["ips_src"].items(), key=lambda x: x[1], reverse=True)[
                    :10
                ]
            ),
            top_dst_ips=dict(
                sorted(self.stats["ips_dst"].items(), key=lambda x: x[1], reverse=True)[
                    :10
                ]
            ),
            top_ports=dict(
                sorted(self.stats["ports"].items(), key=lambda x: x[1], reverse=True)[
                    :10
                ]
            ),
            capture_duration=duration,
        )

    def get_dict(self) -> Dict:
        """Retorna estadísticas como diccionario"""
        return dict(self.stats)
