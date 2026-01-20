"""
Tests para el servicio de GeoIP
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import httpx

from app.services.geoip import (
    is_private_ip,
    is_local_ip,
    get_ip_location,
    get_batch_locations,
    get_network_label,
    geo_cache,
)


class TestIsPrivateIp:
    """Tests para is_private_ip()"""

    def test_private_192_168(self):
        """Test IP privada 192.168.x.x"""
        assert is_private_ip("192.168.1.1") is True
        assert is_private_ip("192.168.0.100") is True
        assert is_private_ip("192.168.255.255") is True

    def test_private_10_x(self):
        """Test IP privada 10.x.x.x"""
        assert is_private_ip("10.0.0.1") is True
        assert is_private_ip("10.255.255.255") is True

    def test_private_172_x(self):
        """Test IP privada 172.16-31.x.x"""
        assert is_private_ip("172.16.0.1") is True
        assert is_private_ip("172.31.255.255") is True

    def test_loopback(self):
        """Test IP loopback"""
        assert is_private_ip("127.0.0.1") is True
        assert is_private_ip("127.0.0.100") is True

    def test_link_local(self):
        """Test IP link-local"""
        assert is_private_ip("169.254.1.1") is True

    def test_public_ips(self):
        """Test IPs públicas"""
        assert is_private_ip("8.8.8.8") is False
        assert is_private_ip("1.1.1.1") is False
        assert is_private_ip("142.250.185.46") is False

    def test_invalid_ip(self):
        """Test IP inválida retorna True (tratada como local)"""
        assert is_private_ip("not-an-ip") is True
        assert is_private_ip("999.999.999.999") is True
        assert is_private_ip("") is True


class TestIsLocalIp:
    """Tests para is_local_ip() - alias de is_private_ip"""

    def test_is_alias(self):
        """Verificar que is_local_ip es alias de is_private_ip"""
        assert is_local_ip("192.168.1.1") == is_private_ip("192.168.1.1")
        assert is_local_ip("8.8.8.8") == is_private_ip("8.8.8.8")


class TestGetNetworkLabel:
    """Tests para get_network_label()"""

    def test_lan_label(self):
        """Test etiqueta LAN para 192.168.x.x"""
        assert get_network_label("192.168.1.1") == "LAN"
        assert get_network_label("192.168.0.100") == "LAN"

    def test_private_label_10(self):
        """Test etiqueta Private para 10.x.x.x"""
        assert get_network_label("10.0.0.1") == "Private"

    def test_private_label_172(self):
        """Test etiqueta Private para 172.x.x.x"""
        assert get_network_label("172.16.0.1") == "Private"

    def test_localhost_label(self):
        """Test etiqueta Localhost para 127.x.x.x"""
        assert get_network_label("127.0.0.1") == "Localhost"

    def test_internet_label(self):
        """Test etiqueta Internet para IPs públicas"""
        assert get_network_label("8.8.8.8") == "Internet"
        assert get_network_label("1.1.1.1") == "Internet"


class TestGetIpLocation:
    """Tests para get_ip_location()"""

    @pytest.mark.asyncio
    async def test_private_ip_returns_local(self):
        """Test que IPs privadas retornan info local"""
        result = await get_ip_location("192.168.1.1")

        assert result is not None
        assert result["country"] == "Local"
        assert result["city"] == "Red Local"
        assert result["is_local"] is True

    @pytest.mark.asyncio
    async def test_cached_ip(self):
        """Test que IPs en cache se retornan sin llamada HTTP"""
        # Agregar IP al cache
        geo_cache["8.8.8.8"] = {
            "country": "USA",
            "city": "Mountain View",
            "is_local": False,
        }

        result = await get_ip_location("8.8.8.8")

        assert result is not None
        assert result["country"] == "USA"

        # Limpiar cache
        del geo_cache["8.8.8.8"]

    @pytest.mark.asyncio
    async def test_external_ip_success(self):
        """Test geolocalización exitosa de IP externa"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "country": "United States",
            "countryCode": "US",
            "city": "Mountain View",
            "lat": 37.4056,
            "lon": -122.0775,
            "isp": "Google LLC",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.get = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client.return_value = mock_instance

            # Limpiar cache antes del test
            if "9.9.9.9" in geo_cache:
                del geo_cache["9.9.9.9"]

            result = await get_ip_location("9.9.9.9")

            assert result is not None
            assert result["country"] == "United States"
            assert result["city"] == "Mountain View"
            assert result["is_local"] is False

    @pytest.mark.asyncio
    async def test_external_ip_api_error(self):
        """Test manejo de error de API"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.get = AsyncMock(side_effect=httpx.TimeoutException("timeout"))
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client.return_value = mock_instance

            # Limpiar cache
            if "5.5.5.5" in geo_cache:
                del geo_cache["5.5.5.5"]

            result = await get_ip_location("5.5.5.5")

            assert result is None


class TestGetBatchLocations:
    """Tests para get_batch_locations()"""

    @pytest.mark.asyncio
    async def test_all_private_ips(self):
        """Test batch con solo IPs privadas"""
        ips = ["192.168.1.1", "10.0.0.1", "127.0.0.1"]

        result = await get_batch_locations(ips)

        assert len(result) == 3
        for ip in ips:
            assert result[ip]["is_local"] is True
            assert result[ip]["country"] == "Local"

    @pytest.mark.asyncio
    async def test_mixed_ips_with_cache(self):
        """Test batch con IPs mixtas y cache"""
        # Agregar una IP al cache
        geo_cache["8.8.8.8"] = {
            "country": "USA",
            "city": "MV",
            "is_local": False,
        }

        ips = ["192.168.1.1", "8.8.8.8"]

        result = await get_batch_locations(ips)

        assert len(result) == 2
        assert result["192.168.1.1"]["is_local"] is True
        assert result["8.8.8.8"]["country"] == "USA"

        # Limpiar
        del geo_cache["8.8.8.8"]

    @pytest.mark.asyncio
    async def test_batch_api_success(self):
        """Test batch request exitoso a API"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "status": "success",
                "query": "1.2.3.4",
                "country": "TestCountry",
                "countryCode": "TC",
                "city": "TestCity",
                "lat": 0,
                "lon": 0,
                "isp": "TestISP",
            }
        ]

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client.return_value = mock_instance

            # Limpiar cache
            if "1.2.3.4" in geo_cache:
                del geo_cache["1.2.3.4"]

            ips = ["1.2.3.4"]
            result = await get_batch_locations(ips)

            assert "1.2.3.4" in result
            assert result["1.2.3.4"]["country"] == "TestCountry"

    @pytest.mark.asyncio
    async def test_batch_api_error(self):
        """Test manejo de error en batch request"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(side_effect=Exception("Network error"))
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client.return_value = mock_instance

            # Limpiar cache
            if "2.3.4.5" in geo_cache:
                del geo_cache["2.3.4.5"]

            ips = ["192.168.1.1", "2.3.4.5"]
            result = await get_batch_locations(ips)

            # La IP privada debe estar, la externa puede no estar
            assert result["192.168.1.1"]["is_local"] is True
