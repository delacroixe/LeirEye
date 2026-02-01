"""
Unit tests for StatsManager
"""
import pytest
from datetime import datetime
from app.services.packet_capture.stats import StatsManager
from app.schemas.capture import PacketData, CaptureStats


class TestStatsManager:
    """Tests para el gestor de estadísticas"""
    
    def test_init_creates_empty_stats(self):
        """StatsManager se inicializa con estadísticas vacías"""
        manager = StatsManager()
        
        assert manager.stats["total"] == 0
        assert manager.stats["tcp"] == 0
        assert manager.stats["udp"] == 0
        assert manager.stats["icmp"] == 0
        assert manager.stats["other"] == 0
        assert len(manager.stats["ips_src"]) == 0
        assert len(manager.stats["ips_dst"]) == 0
        assert len(manager.stats["ports"]) == 0
        assert len(manager.stats["connections"]) == 0
    
    def test_reset_clears_stats(self):
        """Reset limpia todas las estadísticas"""
        manager = StatsManager()
        
        # Agregar algunos datos
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            src_port=12345,
            dst_port=80,
            protocol="TCP",
            length=100
        )
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        
        # Reset
        manager.reset()
        
        assert manager.stats["total"] == 0
        assert manager.stats["tcp"] == 0
        assert len(manager.stats["ips_src"]) == 0
    
    def test_update_tcp_packet(self):
        """Update incrementa correctamente estadísticas de TCP"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            src_port=12345,
            dst_port=80,
            protocol="TCP",
            length=100
        )
        
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        assert manager.stats["tcp"] == 1
        assert manager.stats["udp"] == 0
        assert manager.stats["icmp"] == 0
        assert manager.stats["ips_src"]["192.168.1.1"] == 1
        assert manager.stats["ips_dst"]["8.8.8.8"] == 1
        assert manager.stats["ports"][12345] == 1
        assert manager.stats["ports"][80] == 1
        assert manager.stats["connections"]["192.168.1.1->8.8.8.8"] == 1
    
    def test_update_udp_packet(self):
        """Update incrementa correctamente estadísticas de UDP"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="10.0.0.1",
            dst_ip="10.0.0.2",
            src_port=53,
            dst_port=53,
            protocol="UDP",
            length=64
        )
        
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        assert manager.stats["tcp"] == 0
        assert manager.stats["udp"] == 1
        assert manager.stats["icmp"] == 0
        assert manager.stats["ports"][53] == 2  # src and dst port
    
    def test_update_icmp_packet(self):
        """Update incrementa correctamente estadísticas de ICMP"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="ICMP",
            length=84
        )
        
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        assert manager.stats["tcp"] == 0
        assert manager.stats["udp"] == 0
        assert manager.stats["icmp"] == 1
        assert manager.stats["ips_src"]["192.168.1.1"] == 1
        assert manager.stats["ips_dst"]["8.8.8.8"] == 1
    
    def test_update_other_protocol(self):
        """Update incrementa correctamente estadísticas de otros protocolos"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="UNKNOWN",
            length=100
        )
        
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        assert manager.stats["other"] == 1
    
    def test_update_multiple_packets(self):
        """Update acumula correctamente múltiples paquetes"""
        manager = StatsManager()
        
        packets = [
            PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.8.8",
                protocol="TCP",
                length=100
            ),
            PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.4.4",
                protocol="UDP",
                length=64
            ),
            PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.2",
                dst_ip="8.8.8.8",
                protocol="TCP",
                length=120
            ),
        ]
        
        for packet in packets:
            manager.update(packet)
        
        assert manager.stats["total"] == 3
        assert manager.stats["tcp"] == 2
        assert manager.stats["udp"] == 1
        assert manager.stats["ips_src"]["192.168.1.1"] == 2
        assert manager.stats["ips_src"]["192.168.1.2"] == 1
        assert manager.stats["ips_dst"]["8.8.8.8"] == 2
        assert manager.stats["ips_dst"]["8.8.4.4"] == 1
    
    def test_get_summary_returns_capture_stats(self):
        """get_summary retorna CaptureStats con datos correctos"""
        manager = StatsManager()
        start_time = datetime.now()
        
        # Agregar algunos paquetes
        packets = [
            PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.8.8",
                src_port=12345,
                dst_port=80,
                protocol="TCP",
                length=100
            ),
            PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.2",
                dst_ip="8.8.4.4",
                src_port=54321,
                dst_port=443,
                protocol="TCP",
                length=120
            ),
        ]
        
        for packet in packets:
            manager.update(packet)
        
        summary = manager.get_summary(start_time)
        
        assert isinstance(summary, CaptureStats)
        assert summary.total_packets == 2
        assert summary.tcp_packets == 2
        assert summary.udp_packets == 0
        assert summary.capture_duration >= 0
        assert "192.168.1.1" in summary.top_src_ips
        assert "8.8.8.8" in summary.top_dst_ips
        assert 80 in summary.top_ports or 443 in summary.top_ports
    
    def test_get_summary_with_no_start_time(self):
        """get_summary maneja correctamente start_time None"""
        manager = StatsManager()
        
        summary = manager.get_summary(None)
        
        assert isinstance(summary, CaptureStats)
        assert summary.capture_duration == 0
    
    def test_get_summary_top_ips_limited_to_10(self):
        """get_summary limita top IPs a 10 entradas"""
        manager = StatsManager()
        
        # Crear más de 10 IPs únicas
        for i in range(15):
            packet = PacketData(
                timestamp=datetime.now(),
                src_ip=f"192.168.1.{i}",
                dst_ip=f"8.8.8.{i}",
                protocol="TCP",
                length=100
            )
            manager.update(packet)
        
        summary = manager.get_summary(datetime.now())
        
        assert len(summary.top_src_ips) <= 10
        assert len(summary.top_dst_ips) <= 10
    
    def test_get_summary_top_ports_limited_to_10(self):
        """get_summary limita top ports a 10 entradas"""
        manager = StatsManager()
        
        # Crear más de 10 puertos únicos
        for i in range(15):
            packet = PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.8.8",
                src_port=1000 + i,
                dst_port=2000 + i,
                protocol="TCP",
                length=100
            )
            manager.update(packet)
        
        summary = manager.get_summary(datetime.now())
        
        assert len(summary.top_ports) <= 10
    
    def test_get_summary_sorts_by_count(self):
        """get_summary ordena IPs y puertos por frecuencia"""
        manager = StatsManager()
        
        # Crear paquetes con diferentes frecuencias
        for _ in range(5):
            manager.update(PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.8.8",
                protocol="TCP",
                length=100
            ))
        
        for _ in range(3):
            manager.update(PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.2",
                dst_ip="8.8.4.4",
                protocol="TCP",
                length=100
            ))
        
        summary = manager.get_summary(datetime.now())
        
        # Verificar que el IP más frecuente esté primero
        top_src_ips_list = list(summary.top_src_ips.items())
        assert top_src_ips_list[0][0] == "192.168.1.1"
        assert top_src_ips_list[0][1] == 5
        assert top_src_ips_list[1][0] == "192.168.1.2"
        assert top_src_ips_list[1][1] == 3
    
    def test_get_dict_returns_stats_as_dict(self):
        """get_dict retorna estadísticas como diccionario"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            protocol="TCP",
            length=100
        )
        manager.update(packet)
        
        stats_dict = manager.get_dict()
        
        assert isinstance(stats_dict, dict)
        assert "total" in stats_dict
        assert "tcp" in stats_dict
        assert stats_dict["total"] == 1
        assert stats_dict["tcp"] == 1
    
    def test_update_packet_without_ports(self):
        """Update maneja correctamente paquetes sin puertos"""
        manager = StatsManager()
        
        packet = PacketData(
            timestamp=datetime.now(),
            src_ip="192.168.1.1",
            dst_ip="8.8.8.8",
            src_port=None,
            dst_port=None,
            protocol="ICMP",
            length=84
        )
        
        manager.update(packet)
        
        assert manager.stats["total"] == 1
        assert len(manager.stats["ports"]) == 0
    
    def test_connections_tracking(self):
        """Update rastrea correctamente las conexiones"""
        manager = StatsManager()
        
        # Misma conexión varias veces
        for _ in range(3):
            manager.update(PacketData(
                timestamp=datetime.now(),
                src_ip="192.168.1.1",
                dst_ip="8.8.8.8",
                protocol="TCP",
                length=100
            ))
        
        # Conexión inversa
        for _ in range(2):
            manager.update(PacketData(
                timestamp=datetime.now(),
                src_ip="8.8.8.8",
                dst_ip="192.168.1.1",
                protocol="TCP",
                length=100
            ))
        
        assert manager.stats["connections"]["192.168.1.1->8.8.8.8"] == 3
        assert manager.stats["connections"]["8.8.8.8->192.168.1.1"] == 2
