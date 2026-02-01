"""
Servicio de análisis de redes WiFi
"""

import logging
import subprocess
import re
import plistlib
import time
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
    is_current: bool = False

class WiFiAnalysis(BaseModel):
    current_network: Optional[WiFiNetwork] = None
    available_networks: List[WiFiNetwork] = []
    scanning_active: bool = False
    last_scan: float = 0
    privacy_mode_active: bool = False # Detecta si macOS está ocultando SSIDs

# Diccionario expandido de OUIs para vendors premium
COMMON_VENDORS = {
    "00:03:7F": "Atheros", "00:05:02": "Apple", "00:0C:43": "Ralink",
    "00:0E:8E": "Cisco", "00:13:10": "Linksys", "00:14:6C": "Netgear",
    "00:17:C5": "Intel", "00:1D:CE": "TP-Link", "00:21:29": "Cisco",
    "00:23:69": "Cisco", "00:24:B2": "Netgear", "00:26:BB": "D-Link",
    "28:CF:E9": "Apple", "30:8D:99": "Hewlett Packard", "34:E6:AD": "Intel",
    "40:A5:EF": "Apple", "60:A4:4C": "ASUSTek", "70:F1:1C": "Google",
    "80:2A:A8": "Ubiquiti", "8C:3B:AD": "Apple", "90:9A:4A": "Apple",
    "A4:2B:B0": "Samsung", "B0:BE:76": "Huawei", "C0:56:27": "Belkin",
    "D8:07:B6": "TP-Link", "E4:F4:C6": "Apple", "F8:D1:11": "TP-Link",
    "00:25:9C": "Cisco", "B4:FB:E4": "Google", "A8:66:7F": "Apple",
    "BC:67:1C": "Apple", "E0:D9:E3": "TP-Link", "F0:9F:C2": "Ubiquiti",
    "74:83:C2": "Apple", "D8:CF:9C": "TP-Link", "04:18:D6": "Ubiquiti",
    "1C:7E:E5": "Cisco", "2C:F0:EE": "Apple", "78:81:02": "Apple"
}

def _get_vendor_from_bssid(bssid: str) -> Optional[str]:
    """Retorna el fabricante basado en el BSSID (OUI)"""
    if not bssid or bssid == "00:00:00:00:00:00" or any(x in bssid for x in ["ANON", "VIRT", "UNKNOWN"]):
        return "Generic/Unknown"
    
    oui = ":".join(bssid.split(":")[:3]).upper()
    return COMMON_VENDORS.get(oui, "Global Vendor")

def _calculate_quality(rssi: int) -> int:
    """Calcula calidad de señal 0-100"""
    if rssi >= -50: return 100
    if rssi <= -100: return 0
    return int((rssi + 100) * 2)

def scan_wifi_macos() -> (List[WiFiNetwork], bool):
    """
    Escanea redes WiFi en macOS (Engine V8.1 - Enhanced XML)
    Retorna (Lista de redes, Flag de privacidad activa)
    """
    networks = []
    privacy_active = False
    try:
        logger.info("📡 WiFi Engine V8.1: Iniciando rastreo XML...")
        
        process = subprocess.run(
            ["system_profiler", "SPAirPortDataType", "-xml"],
            capture_output=True,
            timeout=35
        )
        
        if process.returncode != 0:
            return [], False
            
        plist = plistlib.loads(process.stdout)
        if not plist: return [], False
            
        data = plist[0]
        items = data.get('_items', [])
        if not items: return [], False
            
        for iface_entry in items[0].get('spairport_airport_interfaces', []):
            # 1. Red Actual
            curr = iface_entry.get('spairport_current_network_information')
            if curr:
                net = _parse_xml_network(curr, is_current=True)
                if net.ssid == "<redacted>": privacy_active = True
                networks.append(net)
                
            # 2. Otras redes
            others = iface_entry.get('spairport_airport_other_local_wireless_networks', [])
            for net_data in others:
                net = _parse_xml_network(net_data)
                if net.ssid == "<redacted>": privacy_active = True
                networks.append(net)
                
        # Deduplicación inteligente
        final_list = []
        seen_keys = set()
        
        for i, net in enumerate(networks):
            is_red = net.ssid == "<redacted>"
            # Si es redacted, usamos canal + rssi como firma
            key = f"{net.ssid}-{net.channel}-{net.rssi}" if not is_red else f"VIRT-{net.channel}-{net.rssi}-{i}"
            
            if key not in seen_keys:
                if is_red:
                    net.ssid = f"Hidden Signal ({net.band} CH{net.channel})"
                    if net.bssid == "UNKNOWN":
                        net.bssid = f"FE:00:C0:FF:{net.channel:02X}:{i%256:02X}"
                
                final_list.append(net)
                seen_keys.add(key)
                
        return final_list, privacy_active
        
    except Exception as e:
        logger.error(f"❌ Error en Motor WiFi V8.1: {e}")
        return [], False

def _parse_xml_network(data: dict, is_current: bool = False) -> WiFiNetwork:
    """Parsea una red del plsit"""
    ssid = data.get('_name', 'Unknown')
    channel_info = data.get('spairport_network_channel', '0')
    channel = 0
    if isinstance(channel_info, str):
        m = re.search(r"(\d+)", channel_info)
        if m: channel = int(m.group(1))
            
    sig_ns = data.get('spairport_signal_noise', '')
    rssi, noise = -100, -120
    if sig_ns:
        m = re.search(r"([-\d]+)\s*dBm\s*/\s*([-\d]+)\s*dBm", sig_ns)
        if m:
            rssi = int(m.group(1))
            noise = int(m.group(2))
            
    bssid = data.get('spairport_network_bssid', 'UNKNOWN').upper()
    
    return WiFiNetwork(
        ssid=ssid,
        bssid=bssid,
        rssi=rssi,
        noise=noise,
        channel=channel,
        band="5GHz" if channel > 14 else "2.4GHz",
        width="80MHz" if "80MHz" in str(channel_info) else "20MHz",
        security=data.get('spairport_security_mode', 'WPA2/WPA3'),
        protocol=data.get('spairport_network_phymode', '802.11ax'),
        vendor=_get_vendor_from_bssid(bssid),
        signal_quality=_calculate_quality(rssi),
        is_current=is_current
    )

def get_wifi_analysis() -> WiFiAnalysis:
    """Retorna estado completo"""
    networks, privacy = scan_wifi_macos()
    
    # Red actual es la marcada como is_current
    current = next((n for n in networks if n.is_current), None)
    
    return WiFiAnalysis(
        current_network=current,
        available_networks=networks,
        scanning_active=False,
        last_scan=time.time(),
        privacy_mode_active=privacy
    )
