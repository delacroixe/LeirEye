"""
Servicio de Geolocalización de IPs
Usa ip-api.com (gratis, 45 req/min)
"""

import ipaddress
from typing import Dict, Optional

import httpx

# Cache de geolocalización
geo_cache: Dict[str, dict] = {}


def is_private_ip(ip: str) -> bool:
    """Verifica si una IP es privada/local"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local
    except ValueError:
        return True  # Si no es válida, tratarla como local


def is_local_ip(ip: str) -> bool:
    """Alias para compatibilidad"""
    return is_private_ip(ip)


async def get_ip_location(ip: str) -> Optional[dict]:
    """
    Obtiene la ubicación geográfica de una IP
    Returns: {country, city, lat, lon, isp} o None
    """
    # No geolocalizar IPs privadas
    if is_private_ip(ip):
        return {
            "country": "Local",
            "city": "Red Local",
            "lat": 0,
            "lon": 0,
            "isp": "Local Network",
            "is_local": True,
        }

    # Revisar cache
    if ip in geo_cache:
        return geo_cache[ip]

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip}")

            if response.status_code == 200:
                data = response.json()

                if data.get("status") == "success":
                    result = {
                        "country": data.get("country", "Unknown"),
                        "countryCode": data.get("countryCode", ""),
                        "city": data.get("city", "Unknown"),
                        "lat": data.get("lat", 0),
                        "lon": data.get("lon", 0),
                        "isp": data.get("isp", "Unknown"),
                        "is_local": False,
                    }
                    geo_cache[ip] = result
                    return result
    except Exception as e:
        print(f"[GeoIP] Error geolocalizando {ip}: {e}")

    return None


async def get_batch_locations(ips: list[str]) -> Dict[str, dict]:
    """
    Obtiene ubicaciones para múltiples IPs (más eficiente)
    ip-api.com soporta batch requests hasta 100 IPs
    """
    results = {}
    external_ips = []

    # Procesar IPs locales primero
    for ip in ips:
        if is_private_ip(ip):
            results[ip] = {
                "country": "Local",
                "city": "Red Local",
                "lat": 0,
                "lon": 0,
                "isp": "Local Network",
                "is_local": True,
            }
        elif ip in geo_cache:
            results[ip] = geo_cache[ip]
        else:
            external_ips.append(ip)

    # Batch request para IPs externas (máx 100)
    if external_ips:
        try:
            batch = external_ips[:100]
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    "http://ip-api.com/batch", json=[{"query": ip} for ip in batch]
                )

                if response.status_code == 200:
                    data = response.json()
                    for item in data:
                        if item.get("status") == "success":
                            ip = item.get("query")
                            result = {
                                "country": item.get("country", "Unknown"),
                                "countryCode": item.get("countryCode", ""),
                                "city": item.get("city", "Unknown"),
                                "lat": item.get("lat", 0),
                                "lon": item.get("lon", 0),
                                "isp": item.get("isp", "Unknown"),
                                "is_local": False,
                            }
                            geo_cache[ip] = result
                            results[ip] = result
        except Exception as e:
            print(f"[GeoIP] Error en batch request: {e}")

    return results


def get_network_label(ip: str) -> str:
    """Devuelve una etiqueta corta para el tipo de red"""
    if is_private_ip(ip):
        if ip.startswith("192.168."):
            return "LAN"
        elif ip.startswith("10."):
            return "Private"
        elif ip.startswith("172."):
            return "Private"
        elif ip.startswith("127."):
            return "Localhost"
        return "Local"
    return "Internet"
    return "Internet"
