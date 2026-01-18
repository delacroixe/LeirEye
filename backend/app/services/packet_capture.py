"""Servicio de captura de paquetes"""
import threading
import queue
from typing import Optional, Callable, Dict, List
from collections import defaultdict
from datetime import datetime
import logging
from scapy.all import sniff, IP, TCP, UDP, ICMP, get_if_list
from ..models import PacketData, CaptureStats
from .system_info import connection_cache

logger = logging.getLogger(__name__)


class PacketCaptureService:
    """Servicio para capturar y analizar paquetes de red"""
    
    def __init__(self):
        self.is_running = False
        self.packets: List[PacketData] = []
        self.packet_queue: queue.Queue = queue.Queue(maxsize=100)
        self.stats = {
            'total': 0,
            'tcp': 0,
            'udp': 0,
            'icmp': 0,
            'other': 0,
            'ips_src': defaultdict(int),
            'ips_dst': defaultdict(int),
            'ports': defaultdict(int),
        }
        self.start_time = None
        self.interface = None
        self.packet_filter = None
        self.on_packet_callback: Optional[Callable] = None
        self.max_packets = 1000
        self.sniff_thread: Optional[threading.Thread] = None
    
    def set_packet_callback(self, callback: Callable):
        """Establece el callback para nuevos paquetes"""
        self.on_packet_callback = callback
    
    def get_available_interfaces(self) -> List[str]:
        """Obtiene las interfaces de red disponibles"""
        try:
            interfaces = get_if_list()
            # Filtrar interfaces válidas (no loopback, no vacías)
            valid_interfaces = [iface for iface in interfaces if iface and iface != 'lo']
            return sorted(valid_interfaces)
        except Exception as e:
            logger.error(f"Error obteniendo interfaces: {e}")
            return []
    
    def get_pending_packets(self) -> List[PacketData]:
        """Obtiene paquetes pendientes de enviar"""
        packets = []
        while True:
            try:
                packet = self.packet_queue.get_nowait()
                packets.append(packet)
            except queue.Empty:
                break
        return packets
    
    def _process_packet(self, packet):
        """Procesa un paquete capturado"""
        try:
            if not self.is_running or len(self.packets) >= self.max_packets:
                return
            
            packet_info = self._parse_packet(packet)
            if packet_info:
                self.packets.append(packet_info)
                self._update_stats(packet_info)
                
                # Agregar a queue para enviar via WebSocket
                try:
                    self.packet_queue.put_nowait(packet_info)
                    logger.debug(f"Paquete agregado a queue: {packet_info.src_ip} -> {packet_info.dst_ip}")
                except queue.Full:
                    # Si la queue está llena, sacar el más antiguo
                    try:
                        self.packet_queue.get_nowait()
                        self.packet_queue.put_nowait(packet_info)
                    except queue.Empty:
                        pass
                
                # Llamar callback si existe
                if self.on_packet_callback:
                    try:
                        # Ejecutar en thread si es coroutine
                        import asyncio
                        if asyncio.iscoroutine(self.on_packet_callback(packet_info)):
                            logger.debug("Callback es asíncrono, ejecutándose en background")
                    except Exception as e:
                        logger.debug(f"Error en callback de paquete: {e}")
                
                self.stats['total'] += 1
                
                if self.stats['total'] % 10 == 0:
                    logger.info(f"Paquetes capturados: {self.stats['total']}")
        except Exception as e:
            logger.error(f"Error procesando paquete: {e}")
    
    def _parse_packet(self, packet) -> Optional[PacketData]:
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
                    process_name = proc_info.get('name')
                    pid = proc_info.get('pid')
            
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
                pid=pid
            )
        except Exception as e:
            logger.error(f"Error parseando paquete: {e}")
            return None
    
    def _update_stats(self, packet_info: PacketData):
        """Actualiza estadísticas"""
        self.stats['ips_src'][packet_info.src_ip] += 1
        self.stats['ips_dst'][packet_info.dst_ip] += 1
        
        # Registrar conexión para mapa de red
        connection_key = f"{packet_info.src_ip}->{packet_info.dst_ip}"
        self.stats['connections'][connection_key] += 1
        
        if packet_info.protocol == "TCP":
            self.stats['tcp'] += 1
        elif packet_info.protocol == "UDP":
            self.stats['udp'] += 1
        elif packet_info.protocol == "ICMP":
            self.stats['icmp'] += 1
        else:
            self.stats['other'] += 1
        
        if packet_info.src_port:
            self.stats['ports'][packet_info.src_port] += 1
        if packet_info.dst_port:
            self.stats['ports'][packet_info.dst_port] += 1
    
    def start_capture(
        self,
        interface: Optional[str] = None,
        packet_filter: Optional[str] = None,
        max_packets: int = 1000
    ):
        """Inicia la captura de paquetes"""
        if self.is_running:
            raise RuntimeError("Captura ya en progreso")
        
        # Validaciones básicas
        if interface and isinstance(interface, str) and interface.strip() == '':
            interface = None
        
        if packet_filter and isinstance(packet_filter, str) and packet_filter.strip() == '':
            packet_filter = None
        
        self.is_running = True
        self.interface = interface
        self.packet_filter = packet_filter
        self.max_packets = max_packets
        self.start_time = datetime.now()
        self.packets.clear()
        self.packet_queue = queue.Queue(maxsize=100)  # Reiniciar queue
        self.stats = {
            'total': 0,
            'tcp': 0,
            'udp': 0,
            'icmp': 0,
            'other': 0,
            'ips_src': defaultdict(int),
            'ips_dst': defaultdict(int),
            'ports': defaultdict(int),
            'connections': defaultdict(int),  # (src_ip->dst_ip) -> count
        }
        
        logger.info(f"✓ Iniciando captura en {interface or 'todas las interfaces'}")
        self.sniff_thread = threading.Thread(target=self._run_sniff, daemon=True)
        self.sniff_thread.start()
    
    def _run_sniff(self):
        """Ejecuta sniff en un thread"""
        try:
            logger.info(f"🔍 Iniciando sniff - interface: {self.interface}, filter: {self.packet_filter}")
            sniff(
                iface=self.interface,
                prn=self._process_packet,
                filter=self.packet_filter,
                store=False,
                promisc=False,
                stop_filter=lambda x: not self.is_running or self.stats['total'] >= self.max_packets,
                timeout=None
            )
            logger.info(f"✓ Captura finalizada. Total paquetes: {self.stats['total']}")
        except PermissionError:
            logger.error("❌ Se requieren permisos de root para capturar paquetes. Ejecuta con: sudo python run.py")
            self.is_running = False
        except Exception as e:
            logger.error(f"❌ Error en captura: {type(e).__name__}: {e}", exc_info=True)
            self.is_running = False
    
    def stop_capture(self) -> CaptureStats:
        """Detiene la captura y retorna estadísticas"""
        logger.info("⏹️ Señal de parada recibida")
        self.is_running = False
        
        # Esperar a que el thread de sniff termine (máximo 2 segundos)
        if self.sniff_thread and self.sniff_thread.is_alive():
            logger.info("⏳ Esperando a que termine el thread de sniff...")
            self.sniff_thread.join(timeout=2.0)
            if self.sniff_thread.is_alive():
                logger.warning("⚠️ Thread de sniff no respondió en 2 segundos")
        
        logger.info(f"✓ Captura detenida. Total paquetes: {self.stats['total']}")
        
        duration = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        
        return CaptureStats(
            total_packets=self.stats['total'],
            tcp_packets=self.stats['tcp'],
            udp_packets=self.stats['udp'],
            icmp_packets=self.stats['icmp'],
            other_packets=self.stats['other'],
            top_src_ips=dict(sorted(
                self.stats['ips_src'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]),
            top_dst_ips=dict(sorted(
                self.stats['ips_dst'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]),
            top_ports=dict(sorted(
                self.stats['ports'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]),
            capture_duration=duration
        )
    
    def get_status(self) -> Dict:
        """Retorna el status actual de captura"""
        return {
            "is_running": self.is_running,
            "packets_captured": self.stats['total'],
            "interface": self.interface,
            "filter": self.packet_filter
        }
    
    def get_packets(self, limit: int = 100) -> List[PacketData]:
        """Retorna últimos N paquetes"""
        return self.packets[-limit:]
    
    def clear_packets(self):
        """Limpia el buffer de paquetes"""
        self.packets.clear()
    
    def reset(self):
        """Resetea el estado de captura (para recovery de errores)"""
        logger.info("🔄 Reseteando estado de captura")
        self.is_running = False
        
        # Esperar a que el thread termine si está activo
        if self.sniff_thread and self.sniff_thread.is_alive():
            logger.info("⏳ Esperando a que termine thread de sniff antes de resetear...")
            self.sniff_thread.join(timeout=2.0)
        
        self.packets.clear()
        self.packet_queue = queue.Queue(maxsize=100)
        self.stats = {
            'total': 0,
            'tcp': 0,
            'udp': 0,
            'icmp': 0,
            'other': 0,
            'ips_src': defaultdict(int),
            'ips_dst': defaultdict(int),
            'ports': defaultdict(int),
        }
        logger.info("✓ Estado de captura reseteado")
# Instancia global
capture_service = PacketCaptureService()
