"""Parser de paquetes de red"""

import logging
from datetime import datetime
from typing import List, Optional, Tuple

from scapy.all import DNS, DNSQR, DNSRR, IP, TCP, UDP

from ...schemas import PacketData
from ..dns_tracker import dns_tracker
from ..pattern_detector import pattern_detector
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
            dns_query_id = None
            dns_domain = None

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
                
                # Procesar DNS si es puerto 53
                if src_port == 53 or dst_port == 53:
                    dns_query_id, dns_domain = PacketParser._process_dns(packet, src_ip, dst_ip, process_name, pid)
                    protocol = "DNS"
                    
            elif packet[IP].proto == 1:
                protocol = "ICMP"

            # Buscar el proceso asociado a este puerto local
            if src_port:
                proc_info = connection_cache.get_process(src_port)
                if proc_info:
                    process_name = proc_info.get("name")
                    pid = proc_info.get("pid")

            packet_data = PacketData(
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
                dns_query_id=dns_query_id,
                dns_domain=dns_domain,
            )
            
            # Analizar con el detector de patrones para generar alertas automáticas
            try:
                pattern_detector.analyze(packet_data)
            except Exception as e:
                logger.debug(f"Error en pattern_detector: {e}")
            
            return packet_data
        except Exception as e:
            logger.error(f"Error parseando paquete: {e}")
            return None
    
    @staticmethod
    def parse_with_alerts(packet) -> Tuple[Optional[PacketData], List[dict]]:
        """
        Parsea un paquete y retorna también las alertas generadas.
        Útil para enviar alertas en tiempo real por WebSocket.
        """
        try:
            if IP not in packet:
                return None, []

            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            src_port = None
            dst_port = None
            protocol = "UNKNOWN"
            payload_preview = None
            flags = None
            process_name = None
            pid = None
            dns_query_id = None
            dns_domain = None

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
                
                if src_port == 53 or dst_port == 53:
                    dns_query_id, dns_domain = PacketParser._process_dns(packet, src_ip, dst_ip, process_name, pid)
                    protocol = "DNS"
                    
            elif packet[IP].proto == 1:
                protocol = "ICMP"

            if src_port:
                proc_info = connection_cache.get_process(src_port)
                if proc_info:
                    process_name = proc_info.get("name")
                    pid = proc_info.get("pid")

            packet_data = PacketData(
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
                dns_query_id=dns_query_id,
                dns_domain=dns_domain,
            )
            
            # Analizar y obtener alertas generadas
            alerts = []
            try:
                alerts = pattern_detector.analyze(packet_data)
            except Exception as e:
                logger.debug(f"Error en pattern_detector: {e}")
            
            return packet_data, alerts
        except Exception as e:
            logger.error(f"Error parseando paquete: {e}")
            return None, []
    
    @staticmethod
    def _process_dns(packet, src_ip: str, dst_ip: str, process_name: str = None, pid: int = None) -> Tuple[Optional[str], Optional[str]]:
        """
        Procesa paquetes DNS y los envía al tracker.
        Retorna (query_id, domain) para vincular con PacketData.
        """
        try:
            if DNS not in packet:
                return None, None
            
            dns_layer = packet[DNS]
            dns_query = None
            
            # Query DNS
            if dns_layer.qr == 0 and DNSQR in packet:
                qname = packet[DNSQR].qname.decode() if isinstance(packet[DNSQR].qname, bytes) else str(packet[DNSQR].qname)
                qtype = packet[DNSQR].qtype
                
                dns_query = dns_tracker.process_dns_packet(
                    query_name=qname,
                    query_type=qtype,
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    is_response=False,
                    process_name=process_name,
                    pid=pid
                )
            
            # Respuesta DNS
            elif dns_layer.qr == 1:
                qname = ""
                qtype = 1
                answers: List[str] = []
                ttl = None
                rcode = dns_layer.rcode
                
                if DNSQR in packet:
                    qname = packet[DNSQR].qname.decode() if isinstance(packet[DNSQR].qname, bytes) else str(packet[DNSQR].qname)
                    qtype = packet[DNSQR].qtype
                
                # Extraer respuestas
                if dns_layer.ancount > 0 and DNSRR in packet:
                    for i in range(dns_layer.ancount):
                        try:
                            rr = dns_layer.an[i]
                            if hasattr(rr, 'rdata'):
                                rdata = rr.rdata
                                if isinstance(rdata, bytes):
                                    rdata = rdata.decode('utf-8', errors='ignore')
                                answers.append(str(rdata))
                            if ttl is None and hasattr(rr, 'ttl'):
                                ttl = rr.ttl
                        except Exception:
                            pass
                
                dns_query = dns_tracker.process_dns_packet(
                    query_name=qname,
                    query_type=qtype,
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    is_response=True,
                    response_code=rcode,
                    answers=answers,
                    ttl=ttl,
                    process_name=process_name,
                    pid=pid
                )
            
            # Retornar ID y dominio si se procesó
            if dns_query:
                return dns_query.id, dns_query.query_name
            return None, None
                
        except Exception as e:
            logger.debug(f"Error procesando DNS: {e}")
            return None, None
