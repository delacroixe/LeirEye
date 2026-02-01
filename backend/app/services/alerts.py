"""
Servicio de Gestión de Alertas
Sistema centralizado para todas las alertas de seguridad
"""

import logging
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from threading import Lock
from typing import Callable, Dict, List, Optional

from ..schemas.alerts import Alert, AlertSeverity, AlertSource, AlertStats, AlertType

logger = logging.getLogger(__name__)


class AlertManager:
    """
    Gestor centralizado de alertas.
    Almacena en memoria con límite configurable.
    Singleton para acceso global.
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
            
        self._alerts: Dict[str, Alert] = {}
        self._max_alerts = 1000  # Límite de alertas en memoria
        self._lock = Lock()
        self._on_alert_callback: Optional[Callable] = None
        self._initialized = True
        logger.info("AlertManager inicializado")
    
    def set_on_alert_callback(self, callback: Callable):
        """Establece un callback que se ejecuta cuando se crea una alerta"""
        self._on_alert_callback = callback
    
    def add_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        description: str,
        source: Optional[AlertSource] = None,
        metadata: dict = None
    ) -> Alert:
        """Crea y almacena una nueva alerta"""
        
        alert_id = str(uuid.uuid4())[:8]
        
        alert = Alert(
            id=alert_id,
            timestamp=datetime.now(),
            type=alert_type,
            severity=severity,
            title=title,
            description=description,
            source=source or AlertSource(),
            metadata=metadata or {},
            acknowledged=False
        )
        
        with self._lock:
            # Si excedemos el límite, eliminar las más antiguas ya reconocidas
            if len(self._alerts) >= self._max_alerts:
                self._cleanup_old_alerts()
            
            self._alerts[alert_id] = alert
        
        logger.info(f"Nueva alerta [{severity.value}] {alert_type.value}: {title}")
        
        # Notificar a suscriptores (WebSocket)
        if self._on_alert_callback:
            try:
                self._on_alert_callback(alert)
            except Exception as e:
                logger.debug(f"Error en callback de alerta: {e}")
        
        return alert
    
    def _cleanup_old_alerts(self):
        """Elimina alertas antiguas reconocidas"""
        # Primero eliminar reconocidas antiguas
        acknowledged = [
            (aid, a) for aid, a in self._alerts.items() 
            if a.acknowledged
        ]
        acknowledged.sort(key=lambda x: x[1].timestamp)
        
        # Eliminar el 20% más antiguas reconocidas
        to_remove = len(acknowledged) // 5 or 1
        for aid, _ in acknowledged[:to_remove]:
            del self._alerts[aid]
    
    def get_alert(self, alert_id: str) -> Optional[Alert]:
        """Obtiene una alerta por ID"""
        return self._alerts.get(alert_id)
    
    def get_alerts(
        self,
        types: Optional[List[AlertType]] = None,
        severities: Optional[List[AlertSeverity]] = None,
        acknowledged: Optional[bool] = None,
        process_name: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Alert]:
        """Obtiene alertas con filtros opcionales"""
        
        alerts = list(self._alerts.values())
        
        # Aplicar filtros
        if types:
            alerts = [a for a in alerts if a.type in types]
        
        if severities:
            alerts = [a for a in alerts if a.severity in severities]
        
        if acknowledged is not None:
            alerts = [a for a in alerts if a.acknowledged == acknowledged]
        
        if process_name:
            alerts = [
                a for a in alerts 
                if a.source.process_name and 
                   process_name.lower() in a.source.process_name.lower()
            ]
        
        if since:
            alerts = [a for a in alerts if a.timestamp >= since]
        
        # Ordenar por timestamp descendente (más recientes primero)
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return alerts[:limit]
    
    def acknowledge(self, alert_id: str, user: str = "system") -> Optional[Alert]:
        """Marca una alerta como reconocida"""
        alert = self._alerts.get(alert_id)
        if alert:
            alert.acknowledged = True
            alert.acknowledged_at = datetime.now()
            alert.acknowledged_by = user
            return alert
        return None
    
    def acknowledge_all(self, user: str = "system") -> int:
        """Reconoce todas las alertas pendientes"""
        count = 0
        now = datetime.now()
        for alert in self._alerts.values():
            if not alert.acknowledged:
                alert.acknowledged = True
                alert.acknowledged_at = now
                alert.acknowledged_by = user
                count += 1
        return count
    
    def delete_alert(self, alert_id: str) -> bool:
        """Elimina una alerta"""
        if alert_id in self._alerts:
            del self._alerts[alert_id]
            return True
        return False
    
    def clear_all(self) -> int:
        """Elimina todas las alertas"""
        count = len(self._alerts)
        self._alerts.clear()
        return count
    
    def get_stats(self) -> AlertStats:
        """Obtiene estadísticas de alertas"""
        alerts = list(self._alerts.values())
        now = datetime.now()
        day_ago = now - timedelta(hours=24)
        
        by_severity = defaultdict(int)
        by_type = defaultdict(int)
        unack = 0
        recent = 0
        
        for alert in alerts:
            by_severity[alert.severity.value] += 1
            by_type[alert.type.value] += 1
            if not alert.acknowledged:
                unack += 1
            if alert.timestamp >= day_ago:
                recent += 1
        
        return AlertStats(
            total=len(alerts),
            unacknowledged=unack,
            by_severity=dict(by_severity),
            by_type=dict(by_type),
            recent_24h=recent
        )
    
    def get_unacknowledged_count(self) -> int:
        """Cuenta rápida de alertas sin reconocer"""
        return sum(1 for a in self._alerts.values() if not a.acknowledged)


# Instancia global singleton
alert_manager = AlertManager()
