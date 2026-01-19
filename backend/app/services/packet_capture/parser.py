"""Parser de paquetes de red"""

import logging
from typing import Optional
from datetime import datetime
from scapy.all import IP, TCP, UDP
from ...schemas import PacketData
from ..system_info import connection_cache

logger = logging.getLogger(__name__)


class PacketParser:
    """Extrae información de paquetes de red"""

    @staticmethod
    def parse(packet) -> Optional[PacketData]:
        """Extrae información del paquete"""
        try:
            if IP not in packet:
                return None

            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            src_port = None
            dst_port = None
            protocol = "UNKNOWN"
            payload_preview = None
            flags = None
            process_name = None
            pid = None

            if TCP in packet:
                protocol = "TCP"
                src_port = packet[TCP].sport
                dst_port = packet[TCP].dport
                flags = str(packet[TCP].flags)
                if packet[TCP].payload:
                    payload = bytes(packet[TCP].payload)
                    payload_preview = payload[:50].hex()
            elif UDP in packet:
                protocol = "UDP"
                src_port = packet[UDP].sport
                dst_port = packet[UDP].dport
                if packet[UDP].payload:
                    payload = bytes(packet[UDP].payload)
                    payload_preview = payload[:50].hex()
            elif packet[IP].proto == 1:
                protocol = "ICMP"

            # Buscar el proceso asociado a este puerto local
            if src_port:
                proc_info = connection_cache.get_process(src_port)
                if proc_info:
                    process_name = proc_info.get("name")
                    pid = proc_info.get("pid")

            return PacketData(
                timestamp=datetime.now(),
                src_ip=src_ip,
                dst_ip=dst_ip,
                src_port=src_port,
                dst_port=dst_port,
                protocol=protocol,
                length=len(packet),
                payload_preview=payload_preview,
                flags=flags,
                process_name=process_name,
                pid=pid,
            )
        except Exception as e:
            logger.error(f"Error parseando paquete: {e}")
            return None
