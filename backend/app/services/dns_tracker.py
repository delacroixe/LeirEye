"""
Servicio de DNS Tracking
Captura y analiza consultas DNS, detecta tunneling
"""

import logging
import math
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from threading import Lock
from typing import Dict, List, Optional

from ..schemas.alerts import AlertSeverity, AlertSource, AlertType
from ..schemas.dns import (
    DNSProcessStats,
    DNSQuery,
    DNSRecord,
    DNSResponse,
    DNSStats,
    DNSTunnelingIndicators,
)
from .alerts import alert_manager

logger = logging.getLogger(__name__)


# Mapeo de tipos DNS
DNS_TYPE_MAP = {
    1: "A",
    2: "NS", 
    5: "CNAME",
    6: "SOA",
    12: "PTR",
    15: "MX",
    16: "TXT",
    28: "AAAA",
    33: "SRV",
    35: "NAPTR",
    43: "DS",
    46: "RRSIG",
    47: "NSEC",
    48: "DNSKEY",
    255: "ANY",
    256: "URI",
}

# Códigos de respuesta DNS
DNS_RCODE_MAP = {
    0: "NOERROR",
    1: "FORMERR",
    2: "SERVFAIL",
    3: "NXDOMAIN",
    4: "NOTIMP",
    5: "REFUSED",
}


class DNSTracker:
    """
    Tracker de consultas DNS.
    Almacena historial y detecta anomalías.
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
        
        self._queries: Dict[str, DNSRecord] = {}
        self._max_queries = 5000
        self._lock = Lock()
        
        # Configuración de detección de tunneling
        self.tunneling_config = {
            "max_query_length": 50,  # Caracteres
            "max_subdomains": 4,
            "high_entropy_threshold": 3.5,
            "suspicious_types": ["TXT", "NULL", "CNAME"],
            "queries_per_minute_threshold": 60,
        }
        
        # Contadores para rate limiting
        self._query_times: List[datetime] = []
        
        # Cooldown para alertas de DNS tunneling (evitar spam)
        self._alert_cooldown: Dict[str, datetime] = {}
        self.cooldown_seconds = 60  # 60 segundos por dominio
        
        self._initialized = True
        logger.info("DNSTracker inicializado")
    
    def _calculate_entropy(self, text: str) -> float:
        """Calcula la entropía de Shannon de un texto"""
        if not text:
            return 0.0
        
        freq = defaultdict(int)
        for char in text.lower():
            freq[char] += 1
        
        length = len(text)
        entropy = 0.0
        for count in freq.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        
        return round(entropy, 2)
    
    def _count_subdomains(self, domain: str) -> int:
        """Cuenta la cantidad de subdominios"""
        parts = domain.rstrip('.').split('.')
        return max(0, len(parts) - 2)  # Excluir dominio y TLD
    
    def _check_tunneling(self, query: DNSQuery) -> List[str]:
        """Verifica indicadores de DNS tunneling"""
        reasons = []
        
        domain = query.query_name.rstrip('.')
        
        # Query muy largo
        if len(domain) > self.tunneling_config["max_query_length"]:
            reasons.append(f"Query muy largo ({len(domain)} chars)")
        
        # Muchos subdominios
        subdomain_count = self._count_subdomains(domain)
        if subdomain_count > self.tunneling_config["max_subdomains"]:
            reasons.append(f"Muchos subdominios ({subdomain_count})")
        
        # Alta entropía (datos codificados)
        # Solo analizar el subdominio más largo
        parts = domain.split('.')
        if parts:
            longest_part = max(parts, key=len)
            entropy = self._calculate_entropy(longest_part)
            if entropy > self.tunneling_config["high_entropy_threshold"]:
                reasons.append(f"Alta entropía ({entropy})")
        
        # Tipo sospechoso
        if query.query_type in self.tunneling_config["suspicious_types"]:
            reasons.append(f"Tipo sospechoso ({query.query_type})")
        
        return reasons
    
    def _check_rate_limit(self) -> bool:
        """Verifica si hay demasiadas queries por minuto"""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        # Limpiar queries antiguas
        self._query_times = [t for t in self._query_times if t >= minute_ago]
        
        return len(self._query_times) > self.tunneling_config["queries_per_minute_threshold"]
    
    def process_dns_packet(
        self,
        query_name: str,
        query_type: int,
        src_ip: str,
        dst_ip: str,
        is_response: bool = False,
        response_code: int = 0,
        answers: List[str] = None,
        ttl: int = None,
        process_name: str = None,
        pid: int = None
    ) -> Optional[DNSQuery]:
        """Procesa un paquete DNS capturado"""
        
        query_type_str = DNS_TYPE_MAP.get(query_type, f"TYPE{query_type}")
        query_id = str(uuid.uuid4())[:8]
        
        # Crear query
        domain = query_name.rstrip('.')
        subdomain_count = self._count_subdomains(domain)
        entropy = self._calculate_entropy(domain.split('.')[0] if '.' in domain else domain)
        
        query = DNSQuery(
            id=query_id,
            timestamp=datetime.now(),
            query_name=domain,
            query_type=query_type_str,
            src_ip=src_ip,
            dst_ip=dst_ip,
            process_name=process_name,
            pid=pid,
            query_length=len(domain),
            subdomain_count=subdomain_count,
            entropy=entropy,
            is_suspicious=False,
            suspicion_reasons=[]
        )
        
        # Verificar tunneling
        reasons = self._check_tunneling(query)
        if reasons:
            query.is_suspicious = True
            query.suspicion_reasons = reasons
            
            # Generar alerta
            self._generate_tunneling_alert(query, reasons)
        
        # Crear registro
        record = DNSRecord(query=query, resolved=False)
        
        # Si es respuesta, intentar asociar
        if is_response and answers:
            rcode = DNS_RCODE_MAP.get(response_code, f"RCODE{response_code}")
            record.response = DNSResponse(
                query_id=query_id,
                timestamp=datetime.now(),
                response_code=rcode,
                answers=answers or [],
                ttl=ttl
            )
            record.resolved = response_code == 0
        
        # Almacenar
        with self._lock:
            if len(self._queries) >= self._max_queries:
                self._cleanup_old_queries()
            
            self._queries[query_id] = record
            self._query_times.append(datetime.now())
        
        # Verificar rate limit
        if self._check_rate_limit():
            self._generate_rate_alert()
        
        return query
    
    def _generate_tunneling_alert(self, query: DNSQuery, reasons: List[str]):
        """Genera alerta de posible DNS tunneling"""
        # Verificar cooldown por dominio para evitar spam
        domain_key = query.query_name.lower()
        now = datetime.now()
        
        last_alert = self._alert_cooldown.get(domain_key)
        if last_alert and (now - last_alert).total_seconds() < self.cooldown_seconds:
            # Dentro del cooldown, no generar alerta
            logger.debug(f"DNS tunneling alert en cooldown para {domain_key}")
            return
        
        # Registrar nueva alerta
        self._alert_cooldown[domain_key] = now
        
        severity = AlertSeverity.MEDIUM
        if len(reasons) >= 3:
            severity = AlertSeverity.HIGH
        elif len(reasons) == 1 and "Tipo sospechoso" in reasons[0]:
            severity = AlertSeverity.LOW
        
        alert_manager.add_alert(
            alert_type=AlertType.DNS_TUNNELING,
            severity=severity,
            title=f"Posible DNS Tunneling: {query.query_name[:30]}...",
            description=f"Query sospechoso detectado. Indicadores: {', '.join(reasons)}",
            source=AlertSource(
                process_name=query.process_name,
                pid=query.pid,
                src_ip=query.src_ip,
                dst_ip=query.dst_ip,
                domain=query.query_name
            ),
            metadata={
                "query_length": query.query_length,
                "subdomain_count": query.subdomain_count,
                "entropy": query.entropy,
                "query_type": query.query_type,
                "reasons": reasons
            }
        )
    
    def _generate_rate_alert(self):
        """Genera alerta por alta tasa de queries"""
        alert_manager.add_alert(
            alert_type=AlertType.DNS_UNUSUAL,
            severity=AlertSeverity.MEDIUM,
            title="Alta tasa de queries DNS",
            description=f"Más de {self.tunneling_config['queries_per_minute_threshold']} queries/min",
            source=AlertSource(),
            metadata={"queries_per_minute": len(self._query_times)}
        )
    
    def _cleanup_old_queries(self):
        """Elimina queries antiguas"""
        sorted_queries = sorted(
            self._queries.items(),
            key=lambda x: x[1].query.timestamp
        )
        # Eliminar 20% más antiguas
        to_remove = len(sorted_queries) // 5 or 1
        for qid, _ in sorted_queries[:to_remove]:
            del self._queries[qid]
    
    def get_queries(
        self,
        limit: int = 100,
        process_name: str = None,
        suspicious_only: bool = False,
        domain_filter: str = None
    ) -> List[DNSRecord]:
        """Obtiene historial de queries"""
        records = list(self._queries.values())
        
        if process_name:
            records = [
                r for r in records 
                if r.query.process_name and 
                   process_name.lower() in r.query.process_name.lower()
            ]
        
        if suspicious_only:
            records = [r for r in records if r.query.is_suspicious]
        
        if domain_filter:
            records = [
                r for r in records 
                if domain_filter.lower() in r.query.query_name.lower()
            ]
        
        # Ordenar por timestamp descendente
        records.sort(key=lambda x: x.query.timestamp, reverse=True)
        
        return records[:limit]
    
    def get_query_by_id(self, query_id: str) -> Optional[DNSRecord]:
        """
        Obtiene una query DNS específica por su ID.
        Útil para cruzar con paquetes capturados.
        """
        return self._queries.get(query_id)
    
    def get_stats(self) -> DNSStats:
        """Obtiene estadísticas de DNS"""
        records = list(self._queries.values())
        
        if not records:
            return DNSStats(
                total_queries=0,
                unique_domains=0,
                queries_by_type={},
                top_domains=[],
                top_processes=[],
                suspicious_queries=0,
                failed_queries=0,
                queries_per_minute=0.0
            )
        
        domains = defaultdict(int)
        processes = defaultdict(int)
        types = defaultdict(int)
        suspicious = 0
        failed = 0
        
        for record in records:
            q = record.query
            domains[q.query_name] += 1
            types[q.query_type] += 1
            
            if q.process_name:
                processes[q.process_name] += 1
            
            if q.is_suspicious:
                suspicious += 1
            
            if record.response and record.response.response_code != "NOERROR":
                failed += 1
        
        # Top domains
        top_domains = [
            {"domain": d, "count": c}
            for d, c in sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Top processes
        top_processes = [
            {"process": p, "count": c}
            for p, c in sorted(processes.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Queries por minuto
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        recent = sum(1 for r in records if r.query.timestamp >= minute_ago)
        
        return DNSStats(
            total_queries=len(records),
            unique_domains=len(domains),
            queries_by_type=dict(types),
            top_domains=top_domains,
            top_processes=top_processes,
            suspicious_queries=suspicious,
            failed_queries=failed,
            queries_per_minute=float(recent)
        )
    
    def get_process_stats(self, process_name: str) -> Optional[DNSProcessStats]:
        """Obtiene estadísticas DNS para un proceso específico"""
        records = [
            r for r in self._queries.values()
            if r.query.process_name and 
               process_name.lower() in r.query.process_name.lower()
        ]
        
        if not records:
            return None
        
        domains = set()
        suspicious = 0
        last_query = None
        pid = None
        
        for record in records:
            domains.add(record.query.query_name)
            if record.query.is_suspicious:
                suspicious += 1
            if last_query is None or record.query.timestamp > last_query:
                last_query = record.query.timestamp
                pid = record.query.pid
        
        return DNSProcessStats(
            process_name=process_name,
            pid=pid,
            total_queries=len(records),
            unique_domains=len(domains),
            domains=sorted(list(domains))[:50],  # Limitar a 50
            suspicious_count=suspicious,
            last_query=last_query
        )
    
    def get_tunneling_indicators(self) -> DNSTunnelingIndicators:
        """Obtiene indicadores globales de tunneling"""
        records = list(self._queries.values())
        
        long_queries = sum(
            1 for r in records 
            if r.query.query_length > self.tunneling_config["max_query_length"]
        )
        
        high_entropy = sum(
            1 for r in records 
            if r.query.entropy > self.tunneling_config["high_entropy_threshold"]
        )
        
        many_subdomains = sum(
            1 for r in records 
            if r.query.subdomain_count > self.tunneling_config["max_subdomains"]
        )
        
        unusual_types = sum(
            1 for r in records 
            if r.query.query_type in self.tunneling_config["suspicious_types"]
        )
        
        high_freq = self._check_rate_limit()
        
        # Score de 0-100
        total = len(records) or 1
        score = (
            (long_queries / total) * 25 +
            (high_entropy / total) * 30 +
            (many_subdomains / total) * 20 +
            (unusual_types / total) * 15 +
            (10 if high_freq else 0)
        )
        
        return DNSTunnelingIndicators(
            long_queries=long_queries,
            high_entropy_queries=high_entropy,
            many_subdomains=many_subdomains,
            unusual_types=unusual_types,
            high_frequency=high_freq,
            score=min(100, round(score, 1))
        )
    
    def clear(self):
        """Limpia el historial"""
        with self._lock:
            self._queries.clear()
            self._query_times.clear()


# Instancia global singleton
dns_tracker = DNSTracker()


# Instancia global singleton
dns_tracker = DNSTracker()
