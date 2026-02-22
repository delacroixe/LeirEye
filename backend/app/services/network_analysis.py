import logging
import threading
import time
from typing import List, Optional

from pydantic import BaseModel

try:
    import nmap
    NMAP_AVAILABLE = True
except ImportError:
    NMAP_AVAILABLE = False

logger = logging.getLogger(__name__)

class PortInfo(BaseModel):
    port: int
    service: str
    status: str  # open, closed, filtered
    vulnerability: Optional[str] = None
    risk_level: str = "low"  # low, medium, high, critical

class DeviceDiscovery(BaseModel):
    ip: str
    mac: str
    hostname: Optional[str] = "Desconocido"
    vendor: Optional[str] = "Desconocido"
    ports: List[PortInfo] = []
    last_seen: float
    is_local: bool = False
    risk_score: int = 0  # 0-100

class ScanCache(BaseModel):
    timestamp: float
    devices: List[DeviceDiscovery]

class NetworkAnalysisService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(NetworkAnalysisService, cls).__new__(cls)
                cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.cache: Optional[ScanCache] = None
        self.cache_ttl = 300  # 5 minutos
        self.common_ports = {
            21: ("FTP", "high", "Protocolo no cifrado (FTP) detectado"),
            22: ("SSH", "low", None),
            23: ("Telnet", "critical", "Protocolo crítico no cifrado (Telnet) detectado"),
            25: ("SMTP", "medium", "Posible relay de correo abierto"),
            53: ("DNS", "low", None),
            80: ("HTTP", "medium", "Servidor web sin cifrado (HTTP)"),
            443: ("HTTPS", "low", None),
            445: ("SMB", "high", "Puerto SMB expuesto (riesgo de ransomware)"),
            3306: ("MySQL", "medium", "Base de datos expuesta"),
            3389: ("RDP", "medium", "Acceso remoto expuesto"),
            8080: ("HTTP-Proxy", "medium", "Puerto alternativo HTTP"),
        }

    def _resolve_hostname(self, ip: str, mac: str = "") -> Optional[str]:
        """Resuelve hostname desde nmap o reverse DNS"""
        # nmap ya intenta resolver hostnames, esto es redundante ahora
        return None

    def _get_local_network(self) -> str:
        """Obtiene el rango de red local (ej: 192.168.1.0/24)"""
        try:
            from app.services.system_info import _load_netifaces
            ni = _load_netifaces()
            if not ni:
                return "192.168.1.0/24"
            
            gws = ni.gateways()
            default_iface = gws.get('default', {}).get(ni.AF_INET, [None, None])[1]
            
            if not default_iface:
                for iface in ni.interfaces():
                    addrs = ni.ifaddresses(iface)
                    if ni.AF_INET in addrs:
                        addr = addrs[ni.AF_INET][0]
                        if not addr['addr'].startswith('127.'):
                            default_iface = iface
                            break
            
            if default_iface:
                addrs = ni.ifaddresses(default_iface)
                if ni.AF_INET in addrs:
                    ip = addrs[ni.AF_INET][0]['addr']
                    octets = ip.split('.')
                    return f"{octets[0]}.{octets[1]}.{octets[2]}.0/24"
        except Exception as e:
            logger.error(f"Error detectando red local: {e}")
        
        return "192.168.1.0/24"

    async def scan_network(self, force: bool = False) -> List[DeviceDiscovery]:
        """Realiza un escaneo completo de la red usando nmap"""
        now = time.time()
        
        if not force and self.cache and (now - self.cache.timestamp < self.cache_ttl):
            logger.info("Retornando resultados de análisis desde caché")
            return self.cache.devices

        if not NMAP_AVAILABLE:
            logger.error("nmap no está disponible")
            raise Exception("nmap no está instalado. Instálalo con: brew install nmap o apt-get install nmap")

        target_ip = self._get_local_network()
        logger.info(f"Iniciando escaneo nmap en {target_ip}")
        
        try:
            nm = nmap.PortScanner()
            
            # Hacer un ping scan para descubrir hosts vivos
            logger.info(f"Descubriendo hosts en {target_ip}...")
            nm.scan(hosts=target_ip, arguments='-sn -T4')
            
            # Obtener lista de hosts vivos
            up_hosts = []
            for host in nm.all_hosts():
                try:
                    state = nm[host].state()
                    # state() puede devolver string o dict dependiendo de la versión
                    if isinstance(state, dict):
                        if state.get('state') == 'up':
                            up_hosts.append(host)
                    elif isinstance(state, str):
                        if state == 'up':
                            up_hosts.append(host)
                except Exception as e:
                    logger.debug(f"Error verificando estado de {host}: {e}")
                    # Asumimos que está activo si está en la lista
                    up_hosts.append(host)
            
            logger.info(f"Hosts encontrados: {len(up_hosts)}")
            
            devices = []
            
            # Para cada host vivo, hacer un escaneo de puertos más detallado
            for host in up_hosts:
                try:
                    logger.debug(f"Escaneando puertos en {host}...")
                    # Escaneo rápido: solo 20 puertos top, timeout corto, sin detección de versión
                    nm.scan(hosts=host, arguments='-T5 --top-ports 20 --host-timeout 30s')
                    
                    if host not in nm.all_hosts():
                        continue
                    
                    ip = host
                    hostname = "Desconocido"
                    mac = ""
                    vendor = "Desconocido"
                    ports = []
                    
                    # Obtener información del host
                    try:
                        hostnames = nm[host].hostnames()
                        if hostnames and len(hostnames) > 0:
                            hostname = hostnames[0].get('name', 'Desconocido')
                    except:
                        pass
                    
                    # Obtener MAC si está disponible (solo funciona para hosts locales)
                    try:
                        if 'addresses' in nm[host]:
                            addresses = nm[host]['addresses']
                            if 'mac' in addresses:
                                mac = addresses['mac']
                        if 'vendor' in nm[host] and mac:
                            vendor_dict = nm[host]['vendor']
                            if mac in vendor_dict:
                                vendor = vendor_dict[mac]
                    except Exception as e:
                        logger.debug(f"Error obteniendo MAC de {ip}: {e}")
                    
                    # Procesar puertos TCP abiertos
                    try:
                        if 'tcp' in nm[host]:
                            for port in nm[host]['tcp'].keys():
                                try:
                                    port_dict = nm[host]['tcp'][port]
                                    if isinstance(port_dict, dict) and port_dict.get('state') == 'open':
                                        service_name = port_dict.get('name', f'Port {port}')
                                        vulnerability = None
                                        risk_level = "low"
                                        
                                        # Mapear riesgos por puerto
                                        if port == 21:
                                            vulnerability = "Protocolo no cifrado (FTP) detectado"
                                            risk_level = "high"
                                        elif port == 23:
                                            vulnerability = "Protocolo crítico no cifrado (Telnet) detectado"
                                            risk_level = "critical"
                                        elif port == 22:
                                            risk_level = "low"
                                        elif port in [80, 8080]:
                                            vulnerability = "Servidor web sin cifrado (HTTP)"
                                            risk_level = "medium"
                                        elif port == 443:
                                            risk_level = "low"
                                        elif port == 445:
                                            vulnerability = "Puerto SMB expuesto (riesgo de ransomware)"
                                            risk_level = "high"
                                        elif port == 3306:
                                            vulnerability = "Base de datos expuesta"
                                            risk_level = "medium"
                                        elif port == 3389:
                                            vulnerability = "Acceso remoto expuesto"
                                            risk_level = "medium"
                                        
                                        port_info = PortInfo(
                                            port=port,
                                            service=service_name,
                                            status="open",
                                            vulnerability=vulnerability,
                                            risk_level=risk_level
                                        )
                                        ports.append(port_info)
                                except Exception as e:
                                    logger.debug(f"Error procesando puerto {port}: {e}")
                                    continue
                    except Exception as e:
                        logger.debug(f"Error procesando puertos TCP para {ip}: {e}")
                    
                    # Calcular risk score
                    risk_score = 0
                    for p in ports:
                        if p.risk_level == "critical": risk_score += 40
                        elif p.risk_level == "high": risk_score += 25
                        elif p.risk_level == "medium": risk_score += 10
                        else: risk_score += 2
                    risk_score = min(risk_score, 100)
                    
                    device = DeviceDiscovery(
                        ip=ip,
                        mac=mac,
                        hostname=hostname,
                        vendor=vendor,
                        ports=ports,
                        last_seen=now,
                        risk_score=risk_score
                    )
                    devices.append(device)
                    logger.info(f"Dispositivo agregado: {ip} ({hostname}) - {len(ports)} puertos")
                
                except Exception as e:
                    logger.error(f"Error escaneando host {host}: {e}")
                    continue
            
            # Ordenar por IP
            devices.sort(key=lambda x: [int(y) for y in x.ip.split('.')])
            
            # Actualizar caché
            self.cache = ScanCache(timestamp=now, devices=devices)
            logger.info(f"Escaneo completado: {len(devices)} dispositivos encontrados")
            return devices

        except Exception as e:
            logger.error(f"Error durante el escaneo nmap: {e}", exc_info=True)
            raise Exception(f"Error en el escaneo de red: {str(e)}")

    def _scan_ports(self, ip: str) -> List[PortInfo]:
        """Obsoleto: ahora nmap maneja el escaneo de puertos"""
        return []

    def _calculate_risk(self, ports: List[PortInfo]) -> int:
        """Calcula un score de riesgo basado en los puertos abiertos"""
        if not ports:
            return 0
        
        score = 0
        for p in ports:
            if p.risk_level == "critical": score += 40
            elif p.risk_level == "high": score += 25
            elif p.risk_level == "medium": score += 10
            else: score += 2
            
        return min(score, 100)

analysis_service = NetworkAnalysisService()
analysis_service = NetworkAnalysisService()
