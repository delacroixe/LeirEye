"""Servicio principal de captura de paquetes"""

import threading
import queue
import logging
from typing import Optional, Callable, Dict, List
from datetime import datetime
from scapy.all import sniff, get_if_list
from ...schemas import PacketData, CaptureStats
from .parser import PacketParser
from .stats import StatsManager

logger = logging.getLogger(__name__)


class PacketCaptureService:
    """Servicio para capturar y analizar paquetes de red"""

    def __init__(self):
        self.is_running = False
        self.packets: List[PacketData] = []
        self.packet_queue: queue.Queue = queue.Queue(maxsize=100)
        self.stats_manager = StatsManager()
        self.parser = PacketParser()
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
            valid_interfaces = [
                iface for iface in interfaces if iface and iface != "lo"
            ]
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

            packet_info = self.parser.parse(packet)
            if packet_info:
                self.packets.append(packet_info)
                self.stats_manager.update(packet_info)

                # Agregar a queue para WebSocket
                try:
                    self.packet_queue.put_nowait(packet_info)
                    logger.debug(
                        f"Paquete agregado a queue: {packet_info.src_ip} -> {packet_info.dst_ip}"
                    )
                except queue.Full:
                    try:
                        self.packet_queue.get_nowait()
                        self.packet_queue.put_nowait(packet_info)
                    except queue.Empty:
                        # La cola ya está vacía; no hay paquetes antiguos que descartar
                        pass

                # Llamar callback si existe
                if self.on_packet_callback:
                    try:
                        import asyncio

                        if asyncio.iscoroutine(self.on_packet_callback(packet_info)):
                            logger.debug(
                                "Callback es asíncrono, ejecutándose en background"
                            )
                    except Exception as e:
                        logger.debug(f"Error en callback de paquete: {e}")

                if self.stats_manager.stats["total"] % 10 == 0:
                    logger.info(
                        f"Paquetes capturados: {self.stats_manager.stats['total']}"
                    )
        except Exception as e:
            logger.error(f"Error procesando paquete: {e}")

    def start_capture(
        self,
        interface: Optional[str] = None,
        packet_filter: Optional[str] = None,
        max_packets: int = 1000,
    ):
        """Inicia la captura de paquetes"""
        if self.is_running:
            raise RuntimeError("Captura ya en progreso")

        # Validaciones básicas
        if interface and isinstance(interface, str) and interface.strip() == "":
            interface = None

        if (
            packet_filter
            and isinstance(packet_filter, str)
            and packet_filter.strip() == ""
        ):
            packet_filter = None

        self.is_running = True
        self.interface = interface
        self.packet_filter = packet_filter
        self.max_packets = max_packets
        self.start_time = datetime.now()
        self.packets.clear()
        self.packet_queue = queue.Queue(maxsize=100)
        self.stats_manager.reset()

        logger.info(f"✓ Iniciando captura en {interface or 'todas las interfaces'}")
        self.sniff_thread = threading.Thread(target=self._run_sniff, daemon=True)
        self.sniff_thread.start()

    def _run_sniff(self):
        """Ejecuta sniff en un thread"""
        try:
            logger.info(
                f"🔍 Iniciando sniff - interface: {self.interface}, filter: {self.packet_filter}"
            )
            sniff(
                iface=self.interface,
                prn=self._process_packet,
                filter=self.packet_filter,
                store=False,
                promisc=False,
                stop_filter=lambda x: not self.is_running
                or self.stats_manager.stats["total"] >= self.max_packets,
                timeout=None,
            )
            logger.info(
                f"✓ Captura finalizada. Total paquetes: {self.stats_manager.stats['total']}"
            )
        except PermissionError:
            logger.error(
                "❌ Se requieren permisos de root para capturar paquetes. Ejecuta con: sudo python run.py"
            )
            self.is_running = False
        except Exception as e:
            logger.error(f"❌ Error en captura: {type(e).__name__}: {e}", exc_info=True)
            self.is_running = False

    def stop_capture(self) -> CaptureStats:
        """Detiene la captura y retorna estadísticas"""
        logger.info("⏹️ Señal de parada recibida")
        self.is_running = False

        if self.sniff_thread and self.sniff_thread.is_alive():
            logger.info("⏳ Esperando a que termine el thread de sniff...")
            self.sniff_thread.join(timeout=2.0)
            if self.sniff_thread.is_alive():
                logger.warning("⚠️ Thread de sniff no respondió en 2 segundos")

        logger.info(
            f"✓ Captura detenida. Total paquetes: {self.stats_manager.stats['total']}"
        )
        return self.stats_manager.get_summary(self.start_time)

    def get_status(self) -> Dict:
        """Retorna el status actual de captura"""
        return {
            "is_running": self.is_running,
            "packets_captured": self.stats_manager.stats["total"],
            "interface": self.interface,
            "filter": self.packet_filter,
        }

    def get_packets(self, limit: int = 100) -> List[PacketData]:
        """Retorna últimos N paquetes"""
        return self.packets[-limit:]

    def clear_packets(self):
        """Limpia el buffer de paquetes"""
        self.packets.clear()

    def reset(self):
        """Resetea el estado de captura"""
        logger.info("🔄 Reseteando estado de captura")
        self.is_running = False

        if self.sniff_thread and self.sniff_thread.is_alive():
            logger.info(
                "⏳ Esperando a que termine thread de sniff antes de resetear..."
            )
            self.sniff_thread.join(timeout=2.0)

        self.packets.clear()
        self.packet_queue = queue.Queue(maxsize=100)
        self.stats_manager.reset()
        logger.info("✓ Estado de captura reseteado")


# Instancia global
capture_service = PacketCaptureService()
