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
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """El endpoint de salud indica estado del sistema"""
        response = await client.get("/api/system/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


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
    """Tests para endpoints de estadísticas"""
    
    @pytest.mark.asyncio
    async def test_get_stats(self, client: AsyncClient):
        """Obtener estadísticas de captura"""
        response = await client.get("/api/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data or "total_packets" in data
