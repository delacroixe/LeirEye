"""
Unit tests for PacketParser
"""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from scapy.all import IP, TCP, UDP, ICMP, Ether
from app.services.packet_capture.parser import PacketParser
from app.schemas.capture import PacketData


class TestPacketParser:
    """Tests para el parser de paquetes"""
    
    def test_parse_tcp_packet(self):
        """Parser extrae correctamente información de paquete TCP"""
        # Crear paquete TCP de prueba
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80, flags="S")
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert isinstance(result, PacketData)
        assert result.src_ip == "192.168.1.1"
        assert result.dst_ip == "8.8.8.8"
        assert result.src_port == 12345
        assert result.dst_port == 80
        assert result.protocol == "TCP"
        assert result.flags == "S"
        assert result.length == len(packet)
        assert isinstance(result.timestamp, datetime)
    
    def test_parse_udp_packet(self):
        """Parser extrae correctamente información de paquete UDP"""
        # Crear paquete UDP de prueba
        packet = Ether() / IP(src="10.0.0.1", dst="10.0.0.2") / UDP(sport=5555, dport=5555)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.src_ip == "10.0.0.1"
        assert result.dst_ip == "10.0.0.2"
        assert result.src_port == 5555
        assert result.dst_port == 5555
        assert result.protocol == "UDP"
        assert result.flags is None
    
    def test_parse_icmp_packet(self):
        """Parser extrae correctamente información de paquete ICMP"""
        # Crear paquete ICMP de prueba
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / ICMP()
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.src_ip == "192.168.1.1"
        assert result.dst_ip == "8.8.8.8"
        assert result.protocol == "ICMP"
        assert result.src_port is None
        assert result.dst_port is None
    
    def test_parse_packet_without_ip_layer(self):
        """Parser retorna None para paquetes sin capa IP"""
        # Crear paquete sin capa IP
        packet = Ether()
        
        parser = PacketParser()
        result = parser.parse(packet)
        
        assert result is None
    
    def test_parse_tcp_packet_with_payload(self):
        """Parser extrae payload preview de paquete TCP"""
        # Crear paquete TCP con payload
        payload = b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80) / payload
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.payload_preview is not None
        assert len(result.payload_preview) <= 100  # 50 bytes = 100 hex chars
    
    def test_parse_udp_packet_with_payload(self):
        """Parser extrae payload preview de paquete UDP"""
        # Crear paquete UDP con payload
        payload = b"DNS query data here"
        packet = Ether() / IP(src="10.0.0.1", dst="8.8.8.8") / UDP(sport=53, dport=53) / payload
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.payload_preview is not None
    
    def test_parse_packet_with_process_info(self):
        """Parser incluye información de proceso cuando está disponible"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = {
                "name": "chrome",
                "pid": 1234
            }
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.process_name == "chrome"
        assert result.pid == 1234
    
    def test_parse_packet_without_process_info(self):
        """Parser maneja correctamente ausencia de información de proceso"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.process_name is None
        assert result.pid is None
    
    def test_parse_tcp_flags(self):
        """Parser captura correctamente flags TCP"""
        # Probar diferentes flags
        flags_to_test = ["S", "SA", "A", "F", "R", "P"]
        
        for flags in flags_to_test:
            packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80, flags=flags)
            
            with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
                mock_cache.get_process.return_value = None
                
                parser = PacketParser()
                result = parser.parse(packet)
            
            assert result is not None
            assert result.flags == flags
    
    def test_parse_handles_exception_gracefully(self):
        """Parser retorna None cuando ocurre una excepción"""
        # Crear un mock que lance excepción
        packet = Mock()
        packet.__contains__ = Mock(side_effect=Exception("Test error"))
        
        parser = PacketParser()
        result = parser.parse(packet)
        
        assert result is None
    
    def test_parse_static_method(self):
        """parse es un método estático"""
        # Verificar que se puede llamar sin instanciar
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            result = PacketParser.parse(packet)
        
        assert result is not None
    
    def test_parse_ip_proto_1_is_icmp(self):
        """Parser reconoce proto=1 como ICMP"""
        # Crear paquete con proto=1 (ICMP)
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8", proto=1)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.protocol == "ICMP"
    
    def test_parse_unknown_protocol(self):
        """Parser marca protocolos desconocidos como UNKNOWN"""
        # Crear paquete IP sin TCP/UDP/ICMP
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8", proto=47)  # GRE protocol
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.protocol == "UNKNOWN"
    
    def test_parse_tcp_payload_limited_to_50_bytes(self):
        """Parser limita payload preview a 50 bytes"""
        # Crear payload grande
        large_payload = b"A" * 200
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80) / large_payload
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.payload_preview is not None
        # 50 bytes en hex = 100 caracteres
        assert len(result.payload_preview) == 100
    
    def test_parse_udp_payload_limited_to_50_bytes(self):
        """Parser limita payload preview a 50 bytes para UDP"""
        # Crear payload grande
        large_payload = b"B" * 200
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / UDP(sport=53, dport=53) / large_payload
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        assert result.payload_preview is not None
        assert len(result.payload_preview) == 100
    
    def test_parse_tcp_without_payload(self):
        """Parser maneja paquetes TCP sin payload"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80, flags="S")
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        # SYN packets typically don't have payload
        # payload_preview should be None or empty
    
    def test_parse_udp_without_payload(self):
        """Parser maneja paquetes UDP sin payload"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / UDP(sport=53, dport=53)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
        
        assert result is not None
        # Payload preview might be None or empty
    
    def test_parse_process_lookup_only_for_src_port(self):
        """Parser solo busca proceso para puerto de origen"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / TCP(sport=12345, dport=80)
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            mock_cache.get_process.return_value = None
            
            parser = PacketParser()
            result = parser.parse(packet)
            
            # Verificar que se llamó con el puerto de origen
            mock_cache.get_process.assert_called_once_with(12345)
        
        assert result is not None
    
    def test_parse_no_process_lookup_without_src_port(self):
        """Parser no busca proceso si no hay puerto de origen"""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / ICMP()
        
        with patch('app.services.packet_capture.parser.connection_cache') as mock_cache:
            parser = PacketParser()
            result = parser.parse(packet)
            
            # No debería llamar get_process para ICMP (sin puertos)
            mock_cache.get_process.assert_not_called()
        
        assert result is not None
        assert result.src_port is None
