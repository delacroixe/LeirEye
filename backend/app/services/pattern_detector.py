"""
Pattern Detector Service
========================
Detecta patrones sospechosos en el tráfico de red y genera alertas automáticas.
Funciona como un analizador en tiempo real integrado al flujo de captura.
"""

import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timedelta
from threading import Lock
from typing import Dict, List, Optional, Tuple

from ..schemas import PacketData
from ..schemas.alerts import AlertSeverity, AlertSource, AlertType
from .alerts import alert_manager

logger = logging.getLogger(__name__)


# =============================================================================
# Base Detector Interface
# =============================================================================

class BaseDetector(ABC):
    """Interfaz base para todos los detectores de patrones"""
    
    @abstractmethod
    def analyze(self, packet: PacketData) -> Optional[dict]:
        """
        Analiza un paquete y retorna información de alerta si detecta algo.
        
        Returns:
            None si no hay problema, o dict con:
            - type: AlertType
            - severity: AlertSeverity
            - title: str
            - description: str
            - metadata: dict
        """
        pass
    
    @abstractmethod
    def reset(self):
        """Resetea el estado interno del detector"""
        pass


# =============================================================================
# Port Scan Detector
# =============================================================================

class PortScanDetector(BaseDetector):
    """
    Detecta escaneos de puertos.
    Un escaneo se identifica cuando una IP origen intenta conectar
    a múltiples puertos diferentes en un corto período de tiempo.
    """
    
    def __init__(
        self,
        threshold_ports: int = 10,       # Mínimo de puertos para alertar
        time_window_seconds: int = 60,    # Ventana de tiempo
        cooldown_seconds: int = 300       # Cooldown entre alertas por misma IP
    ):
        self.threshold_ports = threshold_ports
        self.time_window = timedelta(seconds=time_window_seconds)
        self.cooldown = timedelta(seconds=cooldown_seconds)
        
        # Estructura: {(src_ip, dst_ip): [(timestamp, port), ...]}
        self._connections: Dict[Tuple[str, str], List[Tuple[datetime, int]]] = defaultdict(list)
        # Cooldown de alertas: {(src_ip, dst_ip): last_alert_time}
        self._alert_cooldown: Dict[Tuple[str, str], datetime] = {}
        self._lock = Lock()
    
    def analyze(self, packet: PacketData) -> Optional[dict]:
        # Solo analizar paquetes TCP/UDP con puertos
        if packet.protocol not in ("TCP", "UDP") or not packet.dst_port:
            return None
        
        # Solo conexiones iniciadas (SYN para TCP)
        if packet.protocol == "TCP" and packet.flags:
            # Si no es un SYN puro o SYN-ACK, ignorar
            if "S" not in packet.flags:
                return None
        
        key = (packet.src_ip, packet.dst_ip)
        now = packet.timestamp
        
        with self._lock:
            # Limpiar conexiones antiguas
            self._connections[key] = [
                (ts, port) for ts, port in self._connections[key]
                if now - ts < self.time_window
            ]
            
            # Agregar nueva conexión
            self._connections[key].append((now, packet.dst_port))
            
            # Contar puertos únicos
            unique_ports = set(port for _, port in self._connections[key])
            
            # ¿Supera el umbral?
            if len(unique_ports) >= self.threshold_ports:
                # ¿Está en cooldown?
                last_alert = self._alert_cooldown.get(key)
                if last_alert and now - last_alert < self.cooldown:
                    return None
                
                # Registrar alerta
                self._alert_cooldown[key] = now
                
                return {
                    "type": AlertType.PORT_SCAN,
                    "severity": AlertSeverity.HIGH,
                    "title": f"Posible escaneo de puertos desde {packet.src_ip}",
                    "description": (
                        f"Se detectaron {len(unique_ports)} puertos diferentes "
                        f"accedidos en {self.time_window.seconds}s hacia {packet.dst_ip}. "
                        f"Puertos: {sorted(list(unique_ports))[:10]}..."
                    ),
                    "metadata": {
                        "unique_ports": len(unique_ports),
                        "sample_ports": sorted(list(unique_ports))[:20],
                        "time_window_seconds": self.time_window.seconds,
                        "protocol": packet.protocol
                    }
                }
        
        return None
    
    def reset(self):
        with self._lock:
            self._connections.clear()
            self._alert_cooldown.clear()


# =============================================================================
# High Traffic Detector
# =============================================================================

class HighTrafficDetector(BaseDetector):
    """
    Detecta picos de tráfico anormales.
    Alerta cuando una IP genera o recibe más paquetes de lo normal.
    """
    
    def __init__(
        self,
        threshold_packets: int = 500,     # Paquetes por ventana para alertar
        time_window_seconds: int = 60,     # Ventana de tiempo
        cooldown_seconds: int = 120        # Cooldown entre alertas
    ):
        self.threshold_packets = threshold_packets
        self.time_window = timedelta(seconds=time_window_seconds)
        self.cooldown = timedelta(seconds=cooldown_seconds)
        
        # Contadores: {ip: [(timestamp, bytes), ...]}
        self._traffic: Dict[str, List[Tuple[datetime, int]]] = defaultdict(list)
        self._alert_cooldown: Dict[str, datetime] = {}
        self._lock = Lock()
    
    def analyze(self, packet: PacketData) -> Optional[dict]:
        now = packet.timestamp
        
        with self._lock:
            # Actualizar tráfico para ambas IPs
            for ip in (packet.src_ip, packet.dst_ip):
                # Limpiar registros antiguos
                self._traffic[ip] = [
                    (ts, size) for ts, size in self._traffic[ip]
                    if now - ts < self.time_window
                ]
                
                # Agregar nuevo paquete
                self._traffic[ip].append((now, packet.length))
                
                # Calcular totales
                total_packets = len(self._traffic[ip])
                total_bytes = sum(size for _, size in self._traffic[ip])
                
                # ¿Supera el umbral?
                if total_packets >= self.threshold_packets:
                    # ¿Está en cooldown?
                    last_alert = self._alert_cooldown.get(ip)
                    if last_alert and now - last_alert < self.cooldown:
                        continue
                    
                    self._alert_cooldown[ip] = now
                    
                    # Determinar severidad basada en el volumen
                    if total_packets > self.threshold_packets * 3:
                        severity = AlertSeverity.CRITICAL
                    elif total_packets > self.threshold_packets * 2:
                        severity = AlertSeverity.HIGH
                    else:
                        severity = AlertSeverity.MEDIUM
                    
                    # Determinar si es tráfico entrante o saliente
                    is_source = ip == packet.src_ip
                    direction = "saliente desde" if is_source else "entrante hacia"
                    
                    return {
                        "type": AlertType.HIGH_TRAFFIC,
                        "severity": severity,
                        "title": f"Alto volumen de tráfico {direction} {ip}",
                        "description": (
                            f"Se detectaron {total_packets} paquetes ({total_bytes:,} bytes) "
                            f"en los últimos {self.time_window.seconds}s. "
                            f"Esto podría indicar un ataque DDoS, exfiltración de datos o "
                            f"una transferencia masiva de archivos."
                        ),
                        "metadata": {
                            "ip": ip,
                            "direction": "outbound" if is_source else "inbound",
                            "packet_count": total_packets,
                            "total_bytes": total_bytes,
                            "packets_per_second": total_packets / self.time_window.seconds
                        }
                    }
        
        return None
    
    def reset(self):
        with self._lock:
            self._traffic.clear()
            self._alert_cooldown.clear()


# =============================================================================
# Unencrypted Sensitive Data Detector
# =============================================================================

class SensitiveDataDetector(BaseDetector):
    """
    Detecta datos sensibles en tráfico no cifrado.
    Busca patrones como contraseñas, tokens, datos de tarjetas en HTTP.
    """
    
    SENSITIVE_PATTERNS = [
        (b"password", "Posible contraseña en texto plano"),
        (b"passwd", "Posible contraseña en texto plano"),
        (b"pwd=", "Posible contraseña en texto plano"),
        (b"token=", "Token de autenticación expuesto"),
        (b"api_key", "API Key expuesta"),
        (b"apikey", "API Key expuesta"),
        (b"secret", "Secreto expuesto"),
        (b"authorization:", "Header de autorización"),
        (b"bearer ", "Token Bearer expuesto"),
        (b"basic ", "Credenciales Basic Auth"),
    ]
    
    # Puertos no cifrados a monitorear
    UNENCRYPTED_PORTS = {80, 21, 23, 25, 110, 143, 8080, 8000, 3000}
    
    def __init__(self, cooldown_seconds: int = 60):
        self.cooldown = timedelta(seconds=cooldown_seconds)
        self._alert_cooldown: Dict[Tuple[str, str], datetime] = {}
        self._lock = Lock()
    
    def analyze(self, packet: PacketData) -> Optional[dict]:
        # Solo revisar tráfico en puertos no cifrados
        if not packet.dst_port or packet.dst_port not in self.UNENCRYPTED_PORTS:
            if not packet.src_port or packet.src_port not in self.UNENCRYPTED_PORTS:
                return None
        
        # Necesitamos el payload
        if not packet.payload_preview:
            return None
        
        try:
            payload_bytes = bytes.fromhex(packet.payload_preview)
            payload_lower = payload_bytes.lower()
        except Exception:
            return None
        
        # Buscar patrones sensibles
        for pattern, description in self.SENSITIVE_PATTERNS:
            if pattern in payload_lower:
                key = (packet.src_ip, packet.dst_ip)
                now = packet.timestamp
                
                with self._lock:
                    last_alert = self._alert_cooldown.get(key)
                    if last_alert and now - last_alert < self.cooldown:
                        return None
                    
                    self._alert_cooldown[key] = now
                
                port = packet.dst_port or packet.src_port
                
                return {
                    "type": AlertType.UNENCRYPTED_DATA,
                    "severity": AlertSeverity.HIGH,
                    "title": f"Datos sensibles en tráfico no cifrado (puerto {port})",
                    "description": (
                        f"{description} detectado en conexión {packet.src_ip} → {packet.dst_ip}. "
                        f"El tráfico en puerto {port} no está cifrado, exponiendo información sensible. "
                        f"Considera usar HTTPS (puerto 443) para proteger estos datos."
                    ),
                    "metadata": {
                        "pattern_found": pattern.decode(),
                        "port": port,
                        "protocol": packet.protocol,
                        "process": packet.process_name
                    }
                }
        
        return None
    
    def reset(self):
        with self._lock:
            self._alert_cooldown.clear()


# =============================================================================
# Suspicious Port Detector
# =============================================================================

class SuspiciousPortDetector(BaseDetector):
    """
    Detecta conexiones a puertos comúnmente usados por malware o servicios inseguros.
    """
    
    SUSPICIOUS_PORTS = {
        # Puertos de malware conocido
        4444: "Metasploit default",
        5555: "Android ADB remoto",
        6666: "IRC botnets",
        6667: "IRC (posible botnet)",
        31337: "Back Orifice",
        12345: "NetBus",
        27374: "SubSeven",
        1080: "SOCKS Proxy (posible C2)",
        9001: "Tor relay",
        9050: "Tor SOCKS",
        # Servicios inseguros
        23: "Telnet (inseguro)",
        513: "rlogin (inseguro)",
        514: "rsh (inseguro)",
    }
    
    def __init__(self, cooldown_seconds: int = 300):
        self.cooldown = timedelta(seconds=cooldown_seconds)
        self._alert_cooldown: Dict[Tuple[str, int], datetime] = {}
        self._lock = Lock()
    
    def analyze(self, packet: PacketData) -> Optional[dict]:
        for port in (packet.src_port, packet.dst_port):
            if port and port in self.SUSPICIOUS_PORTS:
                key = (packet.dst_ip if port == packet.dst_port else packet.src_ip, port)
                now = packet.timestamp
                
                with self._lock:
                    last_alert = self._alert_cooldown.get(key)
                    if last_alert and now - last_alert < self.cooldown:
                        return None
                    
                    self._alert_cooldown[key] = now
                
                reason = self.SUSPICIOUS_PORTS[port]
                is_outgoing = port == packet.dst_port
                
                severity = AlertSeverity.HIGH if port in {4444, 31337, 27374, 12345} else AlertSeverity.MEDIUM
                
                return {
                    "type": AlertType.UNUSUAL_PORT,
                    "severity": severity,
                    "title": f"Conexión a puerto sospechoso {port}",
                    "description": (
                        f"{'Conexión saliente' if is_outgoing else 'Conexión entrante'} "
                        f"detectada en puerto {port} ({reason}). "
                        f"{'Destino' if is_outgoing else 'Origen'}: {packet.dst_ip if is_outgoing else packet.src_ip}. "
                        f"Proceso: {packet.process_name or 'Desconocido'}."
                    ),
                    "metadata": {
                        "port": port,
                        "reason": reason,
                        "direction": "outbound" if is_outgoing else "inbound",
                        "remote_ip": packet.dst_ip if is_outgoing else packet.src_ip,
                        "process": packet.process_name,
                        "pid": packet.pid
                    }
                }
        
        return None
    
    def reset(self):
        with self._lock:
            self._alert_cooldown.clear()


# =============================================================================
# Main Pattern Detector Service
# =============================================================================

class PatternDetector:
    """
    Servicio principal de detección de patrones.
    Coordina múltiples detectores y genera alertas.
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._detectors: List[BaseDetector] = [
            PortScanDetector(),
            HighTrafficDetector(),
            SensitiveDataDetector(),
            SuspiciousPortDetector(),
        ]
        
        self._enabled = True
        self._stats = {
            "packets_analyzed": 0,
            "alerts_generated": 0,
            "last_alert_time": None
        }
        self._lock = Lock()
        self._initialized = True
        
        logger.info(f"PatternDetector inicializado con {len(self._detectors)} detectores")
    
    def analyze(self, packet: PacketData) -> List[dict]:
        """
        Analiza un paquete con todos los detectores activos.
        Genera alertas automáticamente si se detectan patrones.
        
        Returns:
            Lista de alertas generadas (puede estar vacía)
        """
        if not self._enabled:
            return []
        
        alerts_generated = []
        
        with self._lock:
            self._stats["packets_analyzed"] += 1
        
        for detector in self._detectors:
            try:
                result = detector.analyze(packet)
                if result:
                    # Crear la alerta
                    source = AlertSource(
                        process_name=packet.process_name,
                        src_ip=packet.src_ip,
                        dst_ip=packet.dst_ip,
                        src_port=packet.src_port,
                        dst_port=packet.dst_port
                    )
                    
                    alert = alert_manager.add_alert(
                        alert_type=result["type"],
                        severity=result["severity"],
                        title=result["title"],
                        description=result["description"],
                        source=source,
                        metadata=result.get("metadata", {})
                    )
                    
                    alerts_generated.append({
                        "id": alert.id,
                        "type": alert.type.value,
                        "severity": alert.severity.value,
                        "title": alert.title
                    })
                    
                    with self._lock:
                        self._stats["alerts_generated"] += 1
                        self._stats["last_alert_time"] = datetime.now()
                    
                    logger.info(f"🚨 Alerta generada: [{alert.severity.value}] {alert.title}")
                    
            except Exception as e:
                logger.error(f"Error en detector {detector.__class__.__name__}: {e}")
        
        return alerts_generated
    
    def enable(self):
        """Habilita la detección"""
        self._enabled = True
        logger.info("PatternDetector habilitado")
    
    def disable(self):
        """Deshabilita la detección"""
        self._enabled = False
        logger.info("PatternDetector deshabilitado")
    
    def reset(self):
        """Resetea todos los detectores"""
        for detector in self._detectors:
            detector.reset()
        
        with self._lock:
            self._stats = {
                "packets_analyzed": 0,
                "alerts_generated": 0,
                "last_alert_time": None
            }
        
        logger.info("PatternDetector reseteado")
    
    def get_stats(self) -> dict:
        """Obtiene estadísticas del detector"""
        with self._lock:
            return {
                **self._stats,
                "enabled": self._enabled,
                "detectors_count": len(self._detectors),
                "detectors": [d.__class__.__name__ for d in self._detectors]
            }
    
    @property
    def is_enabled(self) -> bool:
        return self._enabled


# Instancia global singleton
pattern_detector = PatternDetector()
