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
    """Escanea redes WiFi en macOS (Engine V6 - Multi-Section Support)"""
    networks = []
    try:
        logger.info("📡 Iniciando rastreo espectral WiFi...")
        result = subprocess.run(
            ["system_profiler", "SPAirPortDataType"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        output = result.stdout
        if not output:
            logger.warning("❌ system_profiler vacío")
            return []

        # Intentar localizar el inicio de la sección de redes
        # macOS usa diferentes nombres según versión/idioma
        section_headers = ["Visible Networks:", "Other Local Wi-Fi Networks:", "Redes Wi-Fi locales:"]
        raw_section = ""
        
        for header in section_headers:
            if header in output:
                logger.info(f"📍 Sección detectada: '{header}'")
                raw_section = output.split(header)[1]
                # Cortar si empieza otra sección de hardware
                raw_section = re.split(r"\n\s{0,8}\w+:", raw_section)[0]
                break
        
        if not raw_section:
            logger.warning("⚠️ No se encontró una sección de redes estándar. Usando modo 'Deep Parse'...")
            raw_section = output # Fallback al output completo

        lines = raw_section.split("\n")
        current_net = None
        
        for line in lines:
            if not line.strip(): continue
            
            # Detectar Cabecera (Indentación de 8-16 espacios + Nombre + :)
            header_match = re.match(r"^\s{8,16}(.+):\s*$", line)
            
            if header_match:
                ssid = header_match.group(1).strip()
                if ssid in ["Current Network Information", "Other Families", "Visible Networks", "Wi-Fi"]:
                    continue
                    
                if current_net:
                    networks.append(WiFiNetwork(**current_net))
                
                current_net = {
                    "ssid": ssid,
                    "bssid": "UNKNOWN", # Inicialmente desconocido
                    "rssi": -100, "noise": -100, "channel": 0,
                    "band": "2GHz", "width": "20MHz",
                    "security": "WPA/WPA2", "protocol": "802.11",
                    "vendor": "Generic", "signal_quality": 0
                }
                continue

            if not current_net: continue
            clean_line = line.strip()
            
            if "BSSID:" in clean_line:
                m = re.search(r"BSSID:\s*([0-9a-fA-F:]+)", clean_line)
                if m: 
                    current_net["bssid"] = m.group(1).upper()
                    current_net["vendor"] = _get_vendor_from_bssid(current_net["bssid"])

            elif "Channel:" in clean_line:
                m = re.search(r"Channel:\s*(\d+)", clean_line)
                if m:
                    chan = int(m.group(1))
                    current_net["channel"] = chan
                    current_net["band"] = "5GHz" if chan > 14 else "2GHz"
                bw_match = re.search(r"(\d+)\s*MHz", clean_line)
                if bw_match: current_net["width"] = f"{bw_match.group(1)}MHz"

            elif "Signal / Noise:" in clean_line:
                m = re.search(r"([-\d]+)\s*dBm\s*/\s*([-\d]+)\s*dBm", clean_line)
                if m:
                    rssi = int(m.group(1))
                    current_net["rssi"] = rssi
                    current_net["noise"] = int(m.group(2))
                    current_net["signal_quality"] = max(0, min(100, int((rssi + 100) * 1.42)))

            elif "Security:" in clean_line:
                current_net["security"] = clean_line.split("Security:")[1].strip()

            elif "PHY Mode:" in clean_line:
                current_net["protocol"] = clean_line.split("PHY Mode:")[1].strip()

        if current_net:
            networks.append(WiFiNetwork(**current_net))

        # --- DEDUPLICACIÓN Y LIMPIEZA INTELIGENTE ---
        final_list = []
        seen_keys = set()
        
        for i, net in enumerate(networks):
            # Si el BSSID es desconocido (común en 'Other Local Networks'), usamos el SSID + Canal como key
            # o simplemente el índice para no perder ninguna señal real
            key = f"{net.bssid}-{net.ssid}-{net.channel}" if net.bssid != "UNKNOWN" else f"VIRT-{i}"
            
            if key not in seen_keys:
                if net.bssid == "UNKNOWN":
                    # Asignar un BSSID virtual descriptivo si es anónimo
                    net.bssid = f"ANON:{i:02X}:VIRT:00"
                
                final_list.append(net)
                seen_keys.add(key)

        logger.info(f"✅ Escaneo completado. {len(final_list)} estaciones base identificadas.")
        return final_list
        
    except Exception as e:
        logger.error(f"❌ Error crítico en Motor WiFi V6: {e}", exc_info=True)
        
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
