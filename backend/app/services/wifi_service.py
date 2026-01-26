"""
Servicio de análisis de redes WiFi
"""

import logging
import subprocess
import re
from typing import List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class WiFiNetwork(BaseModel):
    ssid: str
    bssid: str
    rssi: int
    noise: int
    channel: int
    band: str
    width: str
    security: str
    protocol: str
    vendor: Optional[str] = None
    signal_quality: int  # 0-100 percentage

class WiFiAnalysis(BaseModel):
    current_network: Optional[WiFiNetwork] = None
    available_networks: List[WiFiNetwork] = []
    scanning_active: bool = False
    last_scan: float = 0

# Diccionario simplificado de OUIs para vendors comunes
COMMON_VENDORS = {
    "00:03:7F": "Atheros",
    "00:05:02": "Apple",
    "00:0C:43": "Ralink",
    "00:0E:8E": "Cisco",
    "00:13:10": "Linksys",
    "00:14:6C": "Netgear",
    "00:17:C5": "Intel",
    "00:1D:CE": "TP-Link",
    "00:21:29": "Cisco",
    "00:23:69": "Cisco",
    "00:24:B2": "Netgear",
    "00:26:BB": "D-Link",
    "28:CF:E9": "Apple",
    "30:8D:99": "Hewlett Packard",
    "34:E6:AD": "Intel",
    "40:A5:EF": "Apple",
    "60:A4:4C": "ASUSTek",
    "70:F1:1C": "Google",
    "80:2A:A8": "Ubiquiti",
    "8C:3B:AD": "Apple",
    "90:9A:4A": "Apple",
    "A4:2B:B0": "Samsung",
    "B0:BE:76": "Huawei",
    "C0:56:27": "Belkin",
    "D8:07:B6": "TP-Link",
    "E4:F4:C6": "Apple",
    "F8:D1:11": "TP-Link",
}

def _get_vendor_from_bssid(bssid: str) -> Optional[str]:
    """Retorna el fabricante basado en el BSSID (OUI)"""
    if not bssid or bssid == "00:00:00:00:00:00":
        return "UnknownVendor"
    
    oui = ":".join(bssid.split(":")[:3]).upper()
    return COMMON_VENDORS.get(oui, "Generic/Unknown")

def scan_wifi_macos() -> List[WiFiNetwork]:
    """Escanea redes WiFi en macOS usando system_profiler con un parseo ultra-robusto"""
    networks = []
    try:
        logger.info("Iniciando escaneo WiFi a bajo nivel...")
        result = subprocess.run(
            ["system_profiler", "SPAirPortDataType"],
            capture_output=True,
            text=True,
            timeout=25
        )
        
        output = result.stdout
        if not output:
            return []

        # Usamos una estrategia basada en bloques de SSID
        # Las redes en system_profiler están bajo "Visible Networks:"
        if "Visible Networks:" not in output:
            return []
            
        visible_networks_text = output.split("Visible Networks:")[1]
        # Cortamos si empieza otra sección (como awdl0:)
        visible_networks_text = re.split(r"\n\s{0,8}\w+:", visible_networks_text)[0]

        # Cada bloque de red empieza con el SSID a 12 espacios:
        #             SSID_NAME:
        #               PHY Mode: ...
        
        # Encontramos todos los posibles SSIDs (Indentación de 12 espacios seguida de nombre y colon)
        # Regex: buscamos líneas con exactamente 12 espacios, luego texto (incluyendo < >), luego ':'
        parts = re.split(r"^\s{12}([\w\s\-\._<>\(\)]+):\s*$", visible_networks_text, flags=re.MULTILINE)
        
        # parts[0] es basura antes de la primera red
        for i in range(1, len(parts), 2):
            ssid = parts[i].strip()
            details = parts[i+1]
            
            # Extraer con regex directos de cada bloque
            # A veces BSSID no está presente en system_profiler si no es la red actual
            bssid_m = re.search(r"BSSID:\s*([0-9a-fA-F:]+)", details)
            chan_m = re.search(r"Channel:\s*(\d+)", details)
            sec_m = re.search(r"Security:\s*(.*)", details)
            phy_m = re.search(r"PHY Mode:\s*(.*)", details)
            snr_m = re.search(r"Signal\s*/\s*Noise:\s*(.*?)\s*dBm\s*/\s*(.*?)\s*dBm", details)
            
            # Generar un BSSID falso si falta pero tenemos la red
            bssid = bssid_m.group(1).upper() if bssid_m else f"00:00:00:{i:02X}:00:00"
            rssi = -100
            noise = int(snr_m.group(2)) if snr_m else -100
            
            # Calidad de señal heurística
            quality = max(0, min(100, int((rssi + 100) * 1.43)))
            
            # Banda
            band = "2GHz"
            if chan_m:
                c = int(chan_m.group(1))
                if c > 14: band = "5GHz"
                if c > 165: band = "6GHz"
            
            networks.append(WiFiNetwork(
                ssid=ssid,
                bssid=bssid,
                rssi=rssi,
                noise=noise,
                channel=int(chan_m.group(1)) if chan_m else 0,
                band=band,
                width="20MHz", # Fallback
                security=sec_m.group(1).strip() if sec_m else "Open",
                protocol=phy_m.group(1).strip() if phy_m else "802.11",
                vendor=_get_vendor_from_bssid(bssid),
                signal_quality=quality
            ))

        logger.info(f"Escaneo completado. {len(networks)} redes identificadas.")
        
    except Exception as e:
        logger.error(f"Falla crítica en motor WiFi: {e}", exc_info=True)
        
    return networks

def get_wifi_analysis() -> WiFiAnalysis:
    """Retorna el estado actual del aire WiFi"""
    networks = scan_wifi_macos()
    
    # Identificar red actual si está conectada
    current = None
    # Podríamos buscar la que tiene "Current Network Information" en el output total,
    # pero por ahora simplemente retornamos la lista
    
    return WiFiAnalysis(
        available_networks=networks,
        scanning_active=False
    )
