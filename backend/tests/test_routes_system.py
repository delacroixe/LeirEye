"""
Tests para las rutas de sistema
"""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


class TestSystemRoutes:
    """Tests para /api/system/*"""

    @pytest.mark.asyncio
    async def test_get_system_summary(self, client: AsyncClient):
        """Test GET /api/system/summary"""
        mock_system_info = MagicMock()
        mock_system_info.hostname = "test-host"
        mock_system_info.os = "Linux"
        mock_system_info.os_version = "5.4.0"
        mock_system_info.cpu_percent = 25.5
        mock_system_info.memory_percent = 60.0
        mock_system_info.uptime_hours = 48.5

        mock_connection = MagicMock()
        mock_connection.protocol = "TCP"
        mock_connection.process_name = "python"

        with patch(
            "app.routes.system.get_system_info", return_value=mock_system_info
        ), patch(
            "app.routes.system.get_private_ip", return_value="192.168.1.100"
        ), patch(
            "app.routes.system.get_network_connections", return_value=[mock_connection]
        ):
            response = await client.get("/api/system/summary")

            assert response.status_code == 200
            data = response.json()
            assert data["hostname"] == "test-host"
            assert data["private_ip"] == "192.168.1.100"
            assert data["cpu_percent"] == 25.5
            assert data["active_connections"] == 1

    @pytest.mark.asyncio
    async def test_get_system_summary_error(self, client: AsyncClient):
        """Test GET /api/system/summary con error"""
        with patch(
            "app.routes.system.get_system_info",
            side_effect=Exception("System error"),
        ):
            response = await client.get("/api/system/summary")

            assert response.status_code == 200
            data = response.json()
            assert "error" in data

    @pytest.mark.asyncio
    async def test_get_active_connections_with_filter(self, client: AsyncClient):
        """Test GET /api/system/connections con filtro de status"""
        with patch(
            "app.routes.system.get_network_connections",
            return_value=[],
        ) as mock_get:
            response = await client.get("/api/system/connections?status=ESTABLISHED&limit=50")

            assert response.status_code == 200
            mock_get.assert_called_once_with(status_filter="ESTABLISHED")

    @pytest.mark.asyncio
    async def test_get_active_connections_permission_error(self, client: AsyncClient):
        """Test GET /api/system/connections con error de permisos"""
        with patch(
            "app.routes.system.get_network_connections",
            side_effect=PermissionError("Access denied"),
        ):
            response = await client.get("/api/system/connections")

            assert response.status_code == 403
            assert "Permisos insuficientes" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_connection_lookup(self, client: AsyncClient):
        """Test GET /api/system/connection-lookup"""
        mock_result = {
            "found": True,
            "pid": 1234,
            "process_name": "chrome",
        }

        with patch(
            "app.routes.system.lookup_process_for_connection",
            return_value=mock_result,
        ):
            response = await client.get("/api/system/connection-lookup?ip=8.8.8.8&port=443")

            assert response.status_code == 200
            data = response.json()
            assert data["found"] is True
            assert data["process_name"] == "chrome"

    @pytest.mark.asyncio
    async def test_connection_lookup_not_found(self, client: AsyncClient):
        """Test GET /api/system/connection-lookup no encontrado"""
        mock_result = {
            "found": False,
            "pid": None,
            "process_name": None,
        }

        with patch(
            "app.routes.system.lookup_process_for_connection",
            return_value=mock_result,
        ):
            response = await client.get("/api/system/connection-lookup?ip=1.2.3.4&port=12345")

            assert response.status_code == 200
            data = response.json()
            assert data["found"] is False

    @pytest.mark.asyncio
    async def test_connection_lookup_invalid_port(self, client: AsyncClient):
        """Test GET /api/system/connection-lookup con puerto inválido"""
        response = await client.get("/api/system/connection-lookup?ip=8.8.8.8&port=70000")

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_connection_lookup_missing_params(self, client: AsyncClient):
        """Test GET /api/system/connection-lookup sin parámetros"""
        response = await client.get("/api/system/connection-lookup")

        assert response.status_code == 422  # Validation error
        assert response.status_code == 422  # Validation error
