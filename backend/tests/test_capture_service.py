"""
Unit tests for PacketCaptureService
"""
import pytest
import queue
import threading
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from app.services.packet_capture.capture_service import PacketCaptureService
from app.schemas.capture import PacketData, CaptureStats


class TestPacketCaptureService:
    """Tests para el servicio de captura de paquetes"""
    
    def test_init_creates_service_with_default_state(self):
        """__init__ crea servicio con estado inicial correcto"""
        service = PacketCaptureService()
        
        assert service.is_running is False
        assert len(service.packets) == 0
        assert isinstance(service.packet_queue, queue.Queue)
        assert service.start_time is None
        assert service.interface is None
        assert service.packet_filter is None
        assert service.on_packet_callback is None
        assert service.max_packets == 1000
        assert service.sniff_thread is None
    
    def test_set_packet_callback(self):
        """set_packet_callback establece el callback correctamente"""
        service = PacketCaptureService()
        callback = Mock()
        
        service.set_packet_callback(callback)
        
        assert service.on_packet_callback == callback
    
    @patch('app.services.system_info.get_network_interfaces')
    def test_get_available_interfaces(self, mock_get_interfaces):
        """get_available_interfaces retorna interfaces válidas"""
        # Crear mocks de interfaces con atributos
        iface1 = Mock(ipv4=True, ipv6=False); iface1.name = "eth0"
        iface2 = Mock(ipv4=False, ipv6=True); iface2.name = "wlan0"
        iface3 = Mock(ipv4=False, ipv6=False); iface3.name = "lo"
        mock_get_interfaces.return_value = [iface1, iface2, iface3]
        
        service = PacketCaptureService()
        interfaces = service.get_available_interfaces()
        
        # Debería filtrar "lo" y ordenar
        assert "lo" not in interfaces
        assert "eth0" in interfaces
        assert "wlan0" in interfaces
        assert interfaces == sorted(interfaces)
    
    @patch('app.services.system_info.get_network_interfaces')
    def test_get_available_interfaces_handles_exception(self, mock_get_interfaces):
        """get_available_interfaces maneja excepciones correctamente"""
        mock_get_interfaces.side_effect = Exception("Test error")
        
        service = PacketCaptureService()
        interfaces = service.get_available_interfaces()
        
        assert interfaces == []
    
    def test_get_pending_packets_empty_queue(self):
        """get_pending_packets retorna lista vacía si no hay paquetes"""
        service = PacketCaptureService()
        
        packets = service.get_pending_packets()
        
        assert packets == []
    
    def test_get_pending_packets_returns_all_queued_packets(self):
        """get_pending_packets retorna todos los paquetes en cola"""
        service = PacketCaptureService()
        
        # Agregar paquetes a la cola
        packet1 = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        packet2 = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.2",
            dst_ip="8.8.4.4",
            protocol="UDP",
            length=64
        )
        
        service.packet_queue.put(packet1)
        service.packet_queue.put(packet2)
        
        packets = service.get_pending_packets()
        
        assert len(packets) == 2
        assert packet1 in packets
        assert packet2 in packets
        assert service.packet_queue.empty()
    
    def test_process_packet_when_not_running(self):
        """_process_packet no procesa si is_running es False"""
        service = PacketCaptureService()
        service.is_running = False
        
        mock_packet = Mock()
        service._process_packet(mock_packet)
        
        assert len(service.packets) == 0
    
    def test_process_packet_when_max_packets_reached(self):
        """_process_packet no procesa si se alcanzó max_packets"""
        service = PacketCaptureService()
        service.is_running = True
        service.max_packets = 1
        
        # Llenar hasta max_packets
        service.packets.append(PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        ))
        
        mock_packet = Mock()
        service._process_packet(mock_packet)
        
        # No debería agregar más
        assert len(service.packets) == 1
    
    def test_process_packet_parses_and_stores(self):
        """_process_packet parsea y almacena paquete correctamente"""
        service = PacketCaptureService()
        service.is_running = True
        
        packet_info = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=packet_info)
        
        service._process_packet(mock_packet)
        
        assert len(service.packets) == 1
        assert service.packets[0] == packet_info
        assert service.stats_manager.stats["total"] == 1
    
    def test_process_packet_adds_to_queue(self):
        """_process_packet agrega paquete a la cola"""
        service = PacketCaptureService()
        service.is_running = True
        
        packet_info = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=packet_info)
        
        service._process_packet(mock_packet)
        
        assert service.packet_queue.qsize() == 1
        queued_packet = service.packet_queue.get_nowait()
        assert queued_packet == packet_info
    
    def test_process_packet_handles_full_queue(self):
        """_process_packet maneja cola llena correctamente"""
        service = PacketCaptureService()
        service.is_running = True
        service.packet_queue = queue.Queue(maxsize=2)
        
        packet_info = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=packet_info)
        
        # Llenar la cola
        service.packet_queue.put(packet_info)
        service.packet_queue.put(packet_info)
        
        # Procesar otro paquete
        service._process_packet(mock_packet)
        
        # Debería descartar el más antiguo y agregar el nuevo
        assert service.packet_queue.qsize() == 2
    
    def test_process_packet_calls_callback(self):
        """_process_packet llama al callback si está configurado"""
        service = PacketCaptureService()
        service.is_running = True
        
        packet_info = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=packet_info)
        service.on_packet_callback = Mock(return_value=None)
        
        service._process_packet(mock_packet)
        
        service.on_packet_callback.assert_called_once_with(packet_info)
    
    def test_process_packet_handles_callback_exception(self):
        """_process_packet maneja excepciones del callback"""
        service = PacketCaptureService()
        service.is_running = True
        
        packet_info = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=packet_info)
        service.on_packet_callback = Mock(side_effect=Exception("Callback error"))
        
        # No debería lanzar excepción
        service._process_packet(mock_packet)
        
        # Paquete aún debería estar almacenado
        assert len(service.packets) == 1
    
    def test_process_packet_handles_parse_error(self):
        """_process_packet maneja errores de parseo"""
        service = PacketCaptureService()
        service.is_running = True
        
        mock_packet = Mock()
        service.parser.parse = Mock(return_value=None)
        
        service._process_packet(mock_packet)
        
        assert len(service.packets) == 0
    
    def test_start_capture_raises_if_already_running(self):
        """start_capture lanza RuntimeError si ya está en ejecución"""
        service = PacketCaptureService()
        service.is_running = True
        
        with pytest.raises(RuntimeError, match="Captura ya en progreso"):
            service.start_capture()
    
    def test_start_capture_initializes_state(self):
        """start_capture inicializa el estado correctamente"""
        service = PacketCaptureService()
        
        # Agregar datos previos
        service.packets.append(PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        ))
        
        with patch.object(service, '_run_sniff'):
            service.start_capture(interface="eth0", packet_filter="tcp", max_packets=500)
        
        assert service.is_running is True
        assert service.interface == "eth0"
        assert service.packet_filter == "tcp"
        assert service.max_packets == 500
        assert service.start_time is not None
        assert len(service.packets) == 0
        assert service.stats_manager.stats["total"] == 0
    
    def test_start_capture_handles_empty_string_interface(self):
        """start_capture convierte string vacío a None para interface"""
        service = PacketCaptureService()
        
        with patch.object(service, '_run_sniff'):
            service.start_capture(interface="  ", packet_filter="tcp")
        
        assert service.interface is None
    
    def test_start_capture_handles_empty_string_filter(self):
        """start_capture convierte string vacío a None para filter"""
        service = PacketCaptureService()
        
        with patch.object(service, '_run_sniff'):
            service.start_capture(interface="eth0", packet_filter="  ")
        
        assert service.packet_filter is None
    
    def test_start_capture_starts_thread(self):
        """start_capture inicia thread de sniff"""
        service = PacketCaptureService()
        
        with patch.object(service, '_run_sniff'):
            service.start_capture()
        
        assert service.sniff_thread is not None
        assert isinstance(service.sniff_thread, threading.Thread)
        assert service.sniff_thread.daemon is True
    
    @patch('app.services.packet_capture.capture_service.sniff')
    def test_run_sniff_calls_scapy_sniff(self, mock_sniff):
        """_run_sniff llama a scapy.sniff con parámetros correctos"""
        service = PacketCaptureService()
        service.is_running = True
        service.interface = "eth0"
        service.packet_filter = "tcp"
        service.max_packets = 100
        
        service._run_sniff()
        
        mock_sniff.assert_called_once()
        call_kwargs = mock_sniff.call_args[1]
        assert call_kwargs['iface'] == "eth0"
        assert call_kwargs['filter'] == "tcp"
        assert call_kwargs['store'] is False
        assert call_kwargs['promisc'] is False
    
    @patch('app.services.packet_capture.capture_service.sniff')
    def test_run_sniff_handles_permission_error(self, mock_sniff):
        """_run_sniff maneja PermissionError correctamente"""
        service = PacketCaptureService()
        service.is_running = True
        
        mock_sniff.side_effect = PermissionError("Permission denied")
        
        service._run_sniff()
        
        assert service.is_running is False
    
    @patch('app.services.packet_capture.capture_service.sniff')
    def test_run_sniff_handles_general_exception(self, mock_sniff):
        """_run_sniff maneja excepciones generales"""
        service = PacketCaptureService()
        service.is_running = True
        
        mock_sniff.side_effect = Exception("Test error")
        
        service._run_sniff()
        
        assert service.is_running is False
    
    def test_stop_capture_sets_is_running_false(self):
        """stop_capture establece is_running a False"""
        service = PacketCaptureService()
        service.is_running = True
        service.start_time = datetime.now()
        
        result = service.stop_capture()
        
        assert service.is_running is False
        assert isinstance(result, CaptureStats)
    
    def test_stop_capture_waits_for_thread(self):
        """stop_capture espera a que termine el thread"""
        service = PacketCaptureService()
        service.is_running = True
        service.start_time = datetime.now()
        
        mock_thread = Mock()
        mock_thread.is_alive.return_value = True
        service.sniff_thread = mock_thread
        
        service.stop_capture()
        
        mock_thread.join.assert_called_once_with(timeout=2.0)
    
    def test_stop_capture_returns_stats(self):
        """stop_capture retorna estadísticas de captura"""
        service = PacketCaptureService()
        service.is_running = True
        service.start_time = datetime.now()
        
        # Agregar algunos paquetes
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        service.stats_manager.update(packet)
        
        stats = service.stop_capture()
        
        assert isinstance(stats, CaptureStats)
        assert stats.total_packets == 1
    
    def test_get_status_returns_current_state(self):
        """get_status retorna estado actual correcto"""
        service = PacketCaptureService()
        service.is_running = True
        service.interface = "eth0"
        service.packet_filter = "tcp"
        service.stats_manager.stats["total"] = 42
        
        status = service.get_status()
        
        assert status["is_running"] is True
        assert status["packets_captured"] == 42
        assert status["interface"] == "eth0"
        assert status["filter"] == "tcp"
    
    def test_get_packets_returns_last_n_packets(self):
        """get_packets retorna últimos N paquetes"""
        service = PacketCaptureService()
        
        # Agregar varios paquetes
        for i in range(10):
            service.packets.append(PacketData(
                timestamp=datetime.now(),
                src_ip=f"192.168.1.{i}",
                dst_ip="8.8.8.8",
                protocol="TCP",
                length=100
            ))
        
        packets = service.get_packets(limit=5)
        
        assert len(packets) == 5
        # Debería retornar los últimos 5
        assert packets[0].src_ip == "192.168.1.5"
        assert packets[-1].src_ip == "192.168.1.9"
    
    def test_get_packets_with_fewer_than_limit(self):
        """get_packets retorna todos si hay menos que el límite"""
        service = PacketCaptureService()
        
        service.packets.append(PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        ))
        
        packets = service.get_packets(limit=100)
        
        assert len(packets) == 1
    
    def test_clear_packets_removes_all_packets(self):
        """clear_packets limpia el buffer de paquetes"""
        service = PacketCaptureService()
        
        service.packets.append(PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        ))
        
        service.clear_packets()
        
        assert len(service.packets) == 0
    
    def test_reset_stops_capture_and_clears_state(self):
        """reset detiene captura y limpia estado"""
        service = PacketCaptureService()
        service.is_running = True
        service.start_time = datetime.now()
        
        # Agregar datos
        service.packets.append(PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        ))
        service.stats_manager.stats["total"] = 1
        
        service.reset()
        
        assert service.is_running is False
        assert len(service.packets) == 0
        assert service.stats_manager.stats["total"] == 0
    
    def test_reset_waits_for_thread(self):
        """reset espera a que termine el thread"""
        service = PacketCaptureService()
        service.is_running = True
        
        mock_thread = Mock()
        mock_thread.is_alive.return_value = True
        service.sniff_thread = mock_thread
        
        service.reset()
        
        mock_thread.join.assert_called_once_with(timeout=2.0)
    
    def test_packet_queue_default_maxsize(self):
        """packet_queue tiene maxsize de 100"""
        service = PacketCaptureService()
        
        assert service.packet_queue.maxsize == 100
    
    def test_start_capture_creates_new_queue(self):
        """start_capture crea nueva cola de paquetes"""
        service = PacketCaptureService()
        
        old_queue = service.packet_queue
        
        with patch.object(service, '_run_sniff'):
            service.start_capture()
        
        assert service.packet_queue is not old_queue
        assert service.packet_queue.maxsize == 100
