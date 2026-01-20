"""
Tests para las rutas de estadísticas
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient


class TestStatsRoutes:
    """Tests para /api/stats/*"""

    @pytest.mark.asyncio
    async def test_get_summary(self, client: AsyncClient):
        """Test GET /api/stats/summary"""
        # Mock el capture_service
        mock_stats = {
            "total": 100,
            "tcp": 60,
            "udp": 30,
            "icmp": 5,
            "other": 5,
            "ips_src": {"192.168.1.1": 50, "10.0.0.1": 30, "8.8.8.8": 20},
            "ips_dst": {"192.168.1.100": 40, "8.8.4.4": 35, "1.1.1.1": 25},
            "ports": {80: 30, 443: 40, 22: 10, 53: 20},
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/summary")

            assert response.status_code == 200
            data = response.json()
            assert data["total_packets"] == 100
            assert data["tcp"] == 60
            assert data["udp"] == 30
            assert "top_src_ips" in data
            assert "top_dst_ips" in data
            assert "top_ports" in data

    @pytest.mark.asyncio
    async def test_get_protocol_distribution(self, client: AsyncClient):
        """Test GET /api/stats/protocols"""
        mock_stats = {
            "total": 100,
            "tcp": 60,
            "udp": 30,
            "icmp": 5,
            "other": 5,
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/protocols")

            assert response.status_code == 200
            data = response.json()
            assert data["tcp"]["count"] == 60
            assert data["tcp"]["percentage"] == 60.0
            assert data["udp"]["count"] == 30
            assert data["udp"]["percentage"] == 30.0

    @pytest.mark.asyncio
    async def test_get_protocol_distribution_empty(self, client: AsyncClient):
        """Test GET /api/stats/protocols con stats vacías"""
        mock_stats = {
            "total": 0,
            "tcp": 0,
            "udp": 0,
            "icmp": 0,
            "other": 0,
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/protocols")

            assert response.status_code == 200
            data = response.json()
            # Con total=0, evita división por cero usando total=1
            assert data["tcp"]["percentage"] == 0.0

    @pytest.mark.asyncio
    async def test_get_top_ips(self, client: AsyncClient):
        """Test GET /api/stats/top-ips"""
        mock_stats = {
            "ips_src": {"192.168.1.1": 50, "10.0.0.1": 30},
            "ips_dst": {"8.8.8.8": 40, "1.1.1.1": 20},
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/top-ips?limit=5")

            assert response.status_code == 200
            data = response.json()
            assert "top_src" in data
            assert "top_dst" in data

    @pytest.mark.asyncio
    async def test_get_top_ports(self, client: AsyncClient):
        """Test GET /api/stats/top-ports"""
        mock_stats = {
            "ports": {80: 100, 443: 200, 22: 50, 53: 75},
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/top-ports?limit=10")

            assert response.status_code == 200
            data = response.json()
            assert "ports" in data
            # Verificar que están ordenados por valor
            ports_list = list(data["ports"].values())
            assert ports_list == sorted(ports_list, reverse=True)


class TestNetworkMapRoute:
    """Tests para /api/stats/network-map"""

    @pytest.mark.asyncio
    async def test_get_network_map_empty(self, client: AsyncClient):
        """Test GET /api/stats/network-map sin conexiones"""
        mock_stats = {
            "connections": {},
            "ips_src": {},
            "ips_dst": {},
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture:
            mock_capture.stats = mock_stats

            response = await client.get("/api/stats/network-map")

            assert response.status_code == 200
            data = response.json()
            assert data["nodes"] == []
            assert data["links"] == []
            assert data["summary"]["total_nodes"] == 0

    @pytest.mark.asyncio
    async def test_get_network_map_with_connections(self, client: AsyncClient):
        """Test GET /api/stats/network-map con conexiones"""
        mock_stats = {
            "connections": {
                "192.168.1.1->8.8.8.8": 10,
                "192.168.1.1->1.1.1.1": 5,
            },
            "ips_src": {"192.168.1.1": 15},
            "ips_dst": {"8.8.8.8": 10, "1.1.1.1": 5},
        }

        with patch(
            "app.routes.stats.capture_service"
        ) as mock_capture, patch(
            "app.routes.stats.get_batch_locations"
        ) as mock_geo:
            mock_capture.stats = mock_stats
            mock_geo.return_value = {
                "192.168.1.1": {"country": "Local", "city": "LAN"},
                "8.8.8.8": {"country": "USA", "city": "Mountain View"},
                "1.1.1.1": {"country": "Australia", "city": "Sydney"},
            }

            response = await client.get("/api/stats/network-map")

            assert response.status_code == 200
            data = response.json()
            assert len(data["nodes"]) == 3
            assert len(data["links"]) == 2
            assert data["summary"]["total_nodes"] == 3
