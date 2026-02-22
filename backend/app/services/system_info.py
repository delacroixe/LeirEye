"""
Servicio de información del sistema y procesos de red
"""

import logging
import platform
import socket
import subprocess
import time
from typing import Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Lazy imports para evitar errores si no están instalados
psutil = None
netifaces = None


def _load_psutil():
    global psutil
    if psutil is None:
        try:
            import psutil as _psutil

            psutil = _psutil
        except ImportError:
            logger.error("psutil no instalado. Ejecutar: pip install psutil")
            raise ImportError("psutil requerido")
    return psutil


def _load_netifaces():
    global netifaces
    if netifaces is None:
        try:
            import netifaces as _netifaces

            netifaces = _netifaces
        except ImportError:
            logger.warning("netifaces no instalado, usando alternativas")
            return None
    return netifaces


# ==================== MODELOS ====================


class NetworkInterface(BaseModel):
    name: str
    ipv4: Optional[str] = None
    ipv6: Optional[str] = None
    mac: Optional[str] = None
    is_up: bool = False
    speed: Optional[int] = None  # Mbps


class SystemInfo(BaseModel):
    hostname: str
    os: str
    os_version: str
    architecture: str
    cpu_count: int
    cpu_percent: float
    memory_total_gb: float
    memory_used_gb: float
    memory_percent: float
    disk_total_gb: float
    disk_used_gb: float
    disk_percent: float
    uptime_hours: float


class DeviceInfo(BaseModel):
    system: SystemInfo
    private_ip: str
    public_ip: Optional[str] = None
    geolocation: Optional[dict] = None
    interfaces: List[NetworkInterface]
    gateway: Optional[str] = None
    dns_servers: List[str] = []


class NetworkConnection(BaseModel):
    local_ip: str
    local_port: int
    remote_ip: Optional[str] = None
    remote_port: Optional[int] = None
    status: str
    protocol: str  # tcp, udp
    pid: Optional[int] = None
    process_name: Optional[str] = None
    process_user: Optional[str] = None
    process_cpu: Optional[float] = None
    process_memory_mb: Optional[float] = None


class ProcessWithConnections(BaseModel):
    pid: int
    name: str
    user: Optional[str] = None
    cpu_percent: float
    memory_mb: float
    executable: Optional[str] = None
    connection_count: int
    connections: List[NetworkConnection]


# ==================== FUNCIONES ====================


def get_system_info() -> SystemInfo:
    """Obtiene información del sistema"""
    ps = _load_psutil()

    mem = ps.virtual_memory()
    disk = ps.disk_usage("/")
    boot_time = ps.boot_time()
    uptime_seconds = time.time() - boot_time

    return SystemInfo(
        hostname=socket.gethostname(),
        os=platform.system(),
        os_version=platform.release(),
        architecture=platform.machine(),
        cpu_count=ps.cpu_count(),
        cpu_percent=ps.cpu_percent(interval=0.1),
        memory_total_gb=round(mem.total / (1024**3), 2),
        memory_used_gb=round(mem.used / (1024**3), 2),
        memory_percent=mem.percent,
        disk_total_gb=round(disk.total / (1024**3), 2),
        disk_used_gb=round(disk.used / (1024**3), 2),
        disk_percent=disk.percent,
        uptime_hours=round(uptime_seconds / 3600, 1),
    )


def _is_real_interface(iface_name: str) -> bool:
    """Verifica si una interfaz es real y no virtual/loopback"""
    # Interfaces a ignorar: loopback, virtuales de VM, docker, bridge, tap
    excluded_patterns = [
        'lo',           # loopback
        'veth',         # docker virtual ethernet
        'br',           # bridge
        'docker',       # docker
        'virbr',        # libvirt bridge
        'vnet',         # KVM virtual network
        'vmnet',        # VMware
        'vbox',         # VirtualBox
        'utun',         # macOS Tunneling
        'awdl',         # macOS auto wireless
        'llw',          # macOS link-local WiFi
        'ppp',          # Point-to-point
        'sl',           # Serial line
        'tun',          # VPN tunnel
        'tap',          # TAP tunnel
        'sit',          # 6to4 tunnel
    ]
    
    iface_lower = iface_name.lower()
    
    # Si comienza con algún patrón excluido, es virtual
    for pattern in excluded_patterns:
        if iface_lower.startswith(pattern):
            return False
    
    # Si contiene "virtual" o números muy altos (típico de virtuales), excluir
    if 'virtual' in iface_lower:
        return False
    
    return True


def get_network_interfaces() -> List[NetworkInterface]:
    """Obtiene las interfaces de red (solo reales, no virtuales)"""
    ps = _load_psutil()

    interfaces = []
    addrs = ps.net_if_addrs()
    stats = ps.net_if_stats()

    for iface_name, iface_addrs in addrs.items():
        # Filtrar interfaces virtuales
        if not _is_real_interface(iface_name):
            continue
            
        iface = NetworkInterface(name=iface_name)

        for addr in iface_addrs:
            family_name = (
                addr.family.name if hasattr(addr.family, "name") else str(addr.family)
            )
            if "AF_INET" == family_name and not family_name.endswith("6"):
                iface.ipv4 = addr.address
            elif "AF_INET6" in family_name:
                iface.ipv6 = addr.address
            elif "AF_LINK" in family_name or "AF_PACKET" in family_name:
                iface.mac = addr.address

        if iface_name in stats:
            iface.is_up = stats[iface_name].isup
            iface.speed = (
                stats[iface_name].speed if stats[iface_name].speed > 0 else None
            )

        interfaces.append(iface)

    # Ordenar: activas primero, luego por nombre
    interfaces.sort(key=lambda x: (not x.is_up, x.name))

    return interfaces


def get_private_ip() -> str:
    """Obtiene la IP privada principal"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return socket.gethostbyname(socket.gethostname())


def get_gateway() -> Optional[str]:
    """Obtiene el gateway por defecto"""
    nf = _load_netifaces()

    if nf:
        try:
            gws = nf.gateways()
            if "default" in gws and nf.AF_INET in gws["default"]:
                return gws["default"][nf.AF_INET][0]
        except Exception:
            pass

    # Alternativa para macOS
    try:
        result = subprocess.run(
            ["route", "-n", "get", "default"], capture_output=True, text=True, timeout=2
        )
        for line in result.stdout.split("\n"):
            if "gateway" in line.lower():
                return line.split(":")[-1].strip()
    except Exception:
        pass

    return None


def get_dns_servers() -> List[str]:
    """Obtiene los servidores DNS configurados"""
    dns_servers = []

    try:
        with open("/etc/resolv.conf", "r") as f:
            for line in f:
                if line.strip().startswith("nameserver"):
                    dns = line.split()[1]
                    if dns not in dns_servers:
                        dns_servers.append(dns)
    except Exception:
        pass

    return dns_servers


def get_network_connections(
    kind: str = "inet", status_filter: Optional[str] = None
) -> List[NetworkConnection]:
    """Obtiene todas las conexiones de red activas con info de procesos"""
    ps = _load_psutil()

    connections = []
    process_cache: Dict[int, "psutil.Process"] = {}

    try:
        for conn in ps.net_connections(kind=kind):
            # Filtrar por status si se especifica
            if status_filter and conn.status != status_filter:
                continue

            # Saltar conexiones sin dirección remota (listening)
            if not conn.raddr:
                continue

            # Info básica de la conexión
            net_conn = NetworkConnection(
                local_ip=conn.laddr.ip if conn.laddr else "0.0.0.0",
                local_port=conn.laddr.port if conn.laddr else 0,
                remote_ip=conn.raddr.ip if conn.raddr else None,
                remote_port=conn.raddr.port if conn.raddr else None,
                status=conn.status,
                protocol="TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                pid=conn.pid,
            )

            # Obtener info del proceso
            if conn.pid:
                try:
                    if conn.pid not in process_cache:
                        process_cache[conn.pid] = ps.Process(conn.pid)

                    proc = process_cache[conn.pid]
                    net_conn.process_name = proc.name()

                    try:
                        net_conn.process_user = proc.username()
                    except (ps.AccessDenied, ps.NoSuchProcess):
                        pass

                    try:
                        net_conn.process_cpu = proc.cpu_percent(interval=0)
                        net_conn.process_memory_mb = round(
                            proc.memory_info().rss / (1024**2), 2
                        )
                    except (ps.AccessDenied, ps.NoSuchProcess):
                        pass

                except (ps.NoSuchProcess, ps.AccessDenied):
                    pass

            connections.append(net_conn)

        # Ordenar por proceso y luego por IP remota
        connections.sort(key=lambda c: (c.process_name or "zzz", c.remote_ip or ""))

        return connections

    except ps.AccessDenied:
        logger.warning("Acceso denegado a net_connections. Ejecutar con sudo.")
        return []
    except Exception as e:
        logger.error(f"Error obteniendo conexiones: {e}")
        return []


def get_processes_with_connections() -> List[ProcessWithConnections]:
    """Agrupa conexiones por proceso"""
    ps = _load_psutil()

    process_map: Dict[int, ProcessWithConnections] = {}

    try:
        for conn in ps.net_connections(kind="inet"):
            if not conn.pid or not conn.raddr:
                continue

            pid = conn.pid

            # Crear entrada del proceso si no existe
            if pid not in process_map:
                try:
                    proc = ps.Process(pid)

                    user = None
                    try:
                        user = proc.username()
                    except (ps.AccessDenied, ps.NoSuchProcess):
                        pass

                    exe = None
                    try:
                        exe = proc.exe()
                    except (ps.AccessDenied, ps.NoSuchProcess):
                        pass

                    process_map[pid] = ProcessWithConnections(
                        pid=pid,
                        name=proc.name(),
                        user=user,
                        cpu_percent=proc.cpu_percent(interval=0),
                        memory_mb=round(proc.memory_info().rss / (1024**2), 2),
                        executable=exe,
                        connection_count=0,
                        connections=[],
                    )
                except (ps.NoSuchProcess, ps.AccessDenied):
                    continue

            # Añadir conexión
            net_conn = NetworkConnection(
                local_ip=conn.laddr.ip if conn.laddr else "0.0.0.0",
                local_port=conn.laddr.port if conn.laddr else 0,
                remote_ip=conn.raddr.ip if conn.raddr else None,
                remote_port=conn.raddr.port if conn.raddr else None,
                status=conn.status,
                protocol="TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                pid=pid,
            )
            process_map[pid].connections.append(net_conn)
            process_map[pid].connection_count = len(process_map[pid].connections)

        # Ordenar por número de conexiones
        result = sorted(
            process_map.values(), key=lambda p: p.connection_count, reverse=True
        )

        return result

    except ps.AccessDenied:
        logger.warning(
            "Acceso denegado. Ejecutar con sudo para ver todos los procesos."
        )
        return []
    except Exception as e:
        logger.error(f"Error: {e}")
        return []


def lookup_process_for_connection(remote_ip: str, remote_port: int) -> Optional[dict]:
    """Busca qué proceso tiene una conexión a un IP:puerto específico"""
    ps = _load_psutil()

    try:
        for conn in ps.net_connections(kind="inet"):
            if (
                conn.raddr
                and conn.raddr.ip == remote_ip
                and conn.raddr.port == remote_port
            ):
                if conn.pid:
                    try:
                        proc = ps.Process(conn.pid)
                        return {
                            "found": True,
                            "pid": conn.pid,
                            "process_name": proc.name(),
                            "local_port": conn.laddr.port if conn.laddr else None,
                        }
                    except (ps.NoSuchProcess, ps.AccessDenied):
                        pass

        return {"found": False}

    except Exception as e:
        logger.error(f"Error en lookup: {e}")
        return {"found": False, "error": str(e)}


# Cache para asociar paquetes con procesos
class ConnectionProcessCache:
    """Cache de mapeo puerto_local -> proceso"""

    def __init__(self):
        self._cache: Dict[int, dict] = {}
        self._last_update = 0
        self._update_interval = 2  # segundos

    def refresh(self):
        """Actualiza el cache de conexiones"""
        ps = _load_psutil()

        now = time.time()
        if now - self._last_update < self._update_interval:
            return

        self._cache.clear()

        try:
            for conn in ps.net_connections(kind="inet"):
                if conn.laddr and conn.pid:
                    try:
                        proc = ps.Process(conn.pid)
                        self._cache[conn.laddr.port] = {
                            "pid": conn.pid,
                            "name": proc.name(),
                        }
                    except (ps.NoSuchProcess, ps.AccessDenied):
                        pass
        except Exception:
            pass

        self._last_update = now

    def get_process(self, local_port: int) -> Optional[dict]:
        self.refresh()
        return self._cache.get(local_port)


# Instancia global del cache
connection_cache = ConnectionProcessCache()
