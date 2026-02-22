"""
Tests para endpoints de la API general
"""
import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Tests para endpoints de salud y estado"""
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """El endpoint raíz devuelve información de la API"""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "LeirEye" in data["message"]
        assert "version" in data


class TestCaptureEndpoints:
    """Tests para endpoints de captura"""
    
    @pytest.mark.asyncio
    async def test_get_interfaces(self, client: AsyncClient):
        """Obtener lista de interfaces de red"""
        response = await client.get("/api/capture/interfaces")
        
        assert response.status_code == 200
        data = response.json()
        assert "interfaces" in data
        assert isinstance(data["interfaces"], list)
    
    @pytest.mark.asyncio
    async def test_capture_status(self, client: AsyncClient):
        """Obtener estado de la captura"""
        response = await client.get("/api/capture/status")
        
        assert response.status_code == 200
        data = response.json()
        assert "is_running" in data
        assert "packets_captured" in data


class TestStatsEndpoints:
    """Tests para endpoints de estadísticas - requieren captura activa"""
    pass  # Los endpoints de stats requieren datos de captura
