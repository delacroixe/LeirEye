import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe,
  Package,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import { API_BASE_URL } from "../config";
import { useSync } from "../contexts/SyncContext";
import "./DNSPage.css";

interface DNSQuery {
  id: string;
  timestamp: string;
  query_name: string;
  query_type: string;
  src_ip: string;
  dst_ip: string;
  process_name?: string;
  pid?: number;
  query_length: number;
  subdomain_count: number;
  entropy: number;
  is_suspicious: boolean;
  suspicion_reasons: string[];
}

interface DNSResponse {
  query_id: string;
  timestamp: string;
  response_code: string;
  answers: string[];
  ttl?: number;
}

interface DNSRecord {
  query: DNSQuery;
  response?: DNSResponse;
  resolved: boolean;
}

interface RelatedPacket {
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port?: number;
  dst_port?: number;
  protocol: string;
  length: number;
  dns_domain?: string;
}

interface DNSStats {
  total_queries: number;
  unique_domains: number;
  queries_by_type: Record<string, number>;
  top_domains: Array<{ domain: string; count: number }>;
  top_processes: Array<{ process: string; count: number }>;
  suspicious_queries: number;
  failed_queries: number;
  queries_per_minute: number;
}

interface TunnelingIndicators {
  long_queries: number;
  high_entropy_queries: number;
  many_subdomains: number;
  unusual_types: number;
  high_frequency: boolean;
  score: number;
}

export const DNSPage: React.FC = () => {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [stats, setStats] = useState<DNSStats | null>(null);
  const [indicators, setIndicators] = useState<TunnelingIndicators | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    domain?: string;
    process_name?: string;
    suspicious_only: boolean;
  }>({ suspicious_only: false });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para paquetes relacionados
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const [relatedPackets, setRelatedPackets] = useState<RelatedPacket[]>([]);
  const [loadingPackets, setLoadingPackets] = useState(false);

  // Sync context para navegación cruzada
  const { navigateTo, setSelectedDnsQueryId, applyFilter } = useSync();
  const navigate = useNavigate();

  // Navegar a captura con filtro DNS
  const viewInCapture = (queryId: string, domain: string) => {
    setSelectedDnsQueryId(queryId);
    navigateTo("/capture", "DNS", {
      type: "dns_query",
      value: queryId,
      label: `DNS: ${domain}`,
    });
    applyFilter("domain", domain, domain);
    navigate("/capture");
  };

  const fetchRelatedPackets = async (queryId: string) => {
    if (expandedQuery === queryId) {
      // Si ya está expandido, colapsar
      setExpandedQuery(null);
      setRelatedPackets([]);
      return;
    }

    setLoadingPackets(true);
    setExpandedQuery(queryId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/capture/packets-by-dns/${queryId}`,
      );
      if (!response.ok) throw new Error("Error al cargar paquetes");
      const data = await response.json();
      setRelatedPackets(data.packets || []);
    } catch (err) {
      console.error("Error fetching related packets:", err);
      setRelatedPackets([]);
    } finally {
      setLoadingPackets(false);
    }
  };

  const fetchQueries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.domain) params.append("domain", filter.domain);
      if (filter.process_name)
        params.append("process_name", filter.process_name);
      if (filter.suspicious_only) params.append("suspicious_only", "true");

      const url = `${API_BASE_URL}/dns/queries?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar queries DNS");
      const data = await response.json();
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dns/stats`);
      if (!response.ok) throw new Error("Error al cargar estadísticas");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const fetchIndicators = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dns/tunneling-indicators`);
      if (!response.ok) throw new Error("Error al cargar indicadores");
      const data = await response.json();
      setIndicators(data);
    } catch (err) {
      console.error("Error fetching indicators:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQueries(), fetchStats(), fetchIndicators()]);
    setLoading(false);
  }, [fetchQueries, fetchStats, fetchIndicators]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const clearHistory = async () => {
    if (!window.confirm("¿Estás seguro de limpiar el historial DNS?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/dns/clear`, {
        method: "POST",
      });
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const handleSearch = () => {
    setFilter({ ...filter, domain: searchTerm || undefined });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#dc2626";
    if (score >= 40) return "#ea580c";
    if (score >= 20) return "#ca8a04";
    return "#22c55e";
  };

  return (
    <div className="view-container dns-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">🌐</span> Rastreador DNS Avanzado
          </h1>
          <p className="view-subtitle">
            Análisis heurístico de resoluciones de nombres, detección de exfiltración y túneles DNS en tiempo real.
          </p>
        </div>
        <div className="header-actions">
          <div className="premium-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Analizar dominio..."
              className="premium-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            className={`action-icon-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros de Análisis"
          >
            <Filter size={18} />
          </button>
          <button className="action-icon-btn" onClick={loadData} title="Sincronizar Datos">
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
          </button>
          {records.length > 0 && (
            <button className="premium-btn danger" onClick={clearHistory}>
              <Trash2 size={16} />
              Purgar Historial
            </button>
          )}
        </div>
      </header>

      <PageHelp content={PAGE_HELP.dns} />

      <div className="view-content">
        <div className="dns-dashboard-grid">
          {/* Main Stats Row */}
          <div className="stats-dashboard-grid grid-span-full">
            <div className="stat-panel glass-card">
              <div className="stat-icon-wrapper"><Activity size={20} /></div>
              <span className="stat-panel-value">{stats?.total_queries || 0}</span>
              <span className="stat-panel-label">Resoluciones Totales</span>
            </div>
            <div className="stat-panel glass-card">
              <div className="stat-icon-wrapper"><Globe size={20} /></div>
              <span className="stat-panel-value">{stats?.unique_domains || 0}</span>
              <span className="stat-panel-label">Dominios Únicos</span>
            </div>
            <div className="stat-panel glass-card">
              <div className="stat-icon-wrapper"><Shield size={20} /></div>
              <span className="stat-panel-value">{stats?.queries_per_minute.toFixed(1) || 0}</span>
              <span className="stat-panel-label">Resoluciones/Min</span>
            </div>
            <div className="stat-panel glass-card critical">
              <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
              <span className="stat-panel-value">{stats?.failed_queries || 0}</span>
              <span className="stat-panel-label">Consultas Fallidas</span>
            </div>
          </div>

          {/* Analysis Panel */}
          {indicators && (
            <div className="tunneling-analysis-panel glass-card grid-span-full">
              <div className="analysis-header">
                <Shield size={20} className="header-icon" />
                <h3 className="analysis-title">Indicadores de Anomalía (Heurística)</h3>
                <div className="analysis-badge">
                  Análisis de Riesgo: <span className="risk-score" style={{ color: getScoreColor(indicators.score) }}>{indicators.score}%</span>
                </div>
              </div>
              <div className="analysis-body">
                <div className="score-meter-container">
                  <div
                    className="score-meter-fill"
                    style={{
                      width: `${indicators.score}%`,
                      backgroundColor: getScoreColor(indicators.score),
                      boxShadow: `0 0 15px ${getScoreColor(indicators.score)}40`
                    }}
                  />
                </div>
                <div className="indicators-grid">
                  <div className="indicator-box">
                    <span className="indicator-name">Longitud Excesiva</span>
                    <span className="indicator-data">{indicators.long_queries}</span>
                  </div>
                  <div className="indicator-box">
                    <span className="indicator-name">Alta Entropía</span>
                    <span className="indicator-data">{indicators.high_entropy_queries}</span>
                  </div>
                  <div className="indicator-box">
                    <span className="indicator-name">Subdominios Inusuales</span>
                    <span className="indicator-data">{indicators.many_subdomains}</span>
                  </div>
                  <div className="indicator-box">
                    <span className="indicator-name">Tipos de Registro Raros</span>
                    <span className="indicator-data">{indicators.unusual_types}</span>
                  </div>
                  <div className="indicator-box">
                    <span className="indicator-name">Frecuencia Crítica</span>
                    <span className={`indicator-data ${indicators.high_frequency ? "warning" : ""}`}>
                      {indicators.high_frequency ? "CRÍTICA" : "NORMAL"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Overlay */}
          {showFilters && (
            <div className="filters-panel glass-card grid-span-full">
              <div className="filter-field">
                <label className="field-label">Filtro por Proceso</label>
                <input
                  type="text"
                  className="control-input"
                  placeholder="Ej: chrome, system..."
                  value={filter.process_name || ""}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      process_name: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="filter-field center">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filter.suspicious_only}
                    onChange={(e) =>
                      setFilter({ ...filter, suspicious_only: e.target.checked })
                    }
                  />
                  <span className="checkbox-label">Solo tráfico sospechoso</span>
                </label>
              </div>
              <button
                className="filter-clear-btn"
                onClick={() => setFilter({ suspicious_only: false })}
              >
                <X size={14} /> Resetear Filtros
              </button>
            </div>
          )}

          {error && (
            <div className="system-error glass-card grid-span-full">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Top Section */}
          <div className="top-entities-row grid-span-full">
            {stats && stats.top_domains.length > 0 && (
              <div className="top-panel glass-card">
                <h3 className="panel-title">Dominios más Consultados</h3>
                <div className="top-list">
                  {stats.top_domains.slice(0, 10).map((item, index) => (
                    <div key={index} className="top-list-item">
                      <span className="item-rank">0{index + 1}</span>
                      <span className="item-key">{item.domain}</span>
                      <span className="item-val">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logs Section */}
          <div className="queries-log-panel glass-card grid-span-full">
            <div className="panel-header">
              <h3 className="panel-title">Registro de Resoluciones (Real-time)</h3>
            </div>
            <div className="premium-table-view">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="col-exp"></th>
                    <th className="col-time">Timestamp</th>
                    <th className="col-domain">Dominio</th>
                    <th className="col-type">Tipo</th>
                    <th className="col-proc">Proceso</th>
                    <th className="col-resp">Resolución</th>
                    <th className="col-stat">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && records.length === 0 ? (
                    <tr><td colSpan={7} className="placeholder-row">Sincronizando flujo DNS...</td></tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="placeholder-row">
                        <Globe size={32} className="empty-icon" />
                        <p>No se han interceptado peticiones DNS en este segmento.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <React.Fragment key={record.query.id}>
                        <tr
                          className={`premium-row clickable ${record.query.is_suspicious ? "suspicious" : ""} ${expandedQuery === record.query.id ? "expanded" : ""}`}
                          onClick={() => fetchRelatedPackets(record.query.id)}
                        >
                          <td className="cell-expand">
                            {expandedQuery === record.query.id ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </td>
                          <td className="cell-time">
                            {formatTimestamp(record.query.timestamp)}
                          </td>
                          <td className="cell-domain" title={record.query.query_name}>
                            {record.query.query_name}
                          </td>
                          <td className="cell-type">
                            <span className="type-chip">{record.query.query_type}</span>
                          </td>
                          <td className="cell-proc">
                            <span className="proc-chip">{record.query.process_name || "—"}</span>
                          </td>
                          <td className="cell-resp">
                            <span className="resp-text">
                              {record.response?.answers.length
                                ? record.response.answers.slice(0, 1).join(", ")
                                : "—"}
                            </span>
                          </td>
                          <td className="cell-stat">
                            {record.query.is_suspicious ? (
                              <span className="status-indicator warning" title={record.query.suspicion_reasons.join(", ")}>
                                <AlertTriangle size={12} /> ALERTA
                              </span>
                            ) : record.resolved ? (
                              <span className="status-indicator success">OK</span>
                            ) : record.response?.response_code ? (
                              <span className="status-indicator error">
                                {record.response.response_code}
                              </span>
                            ) : (
                              <span className="status-indicator pending">PEND</span>
                            )}
                          </td>
                        </tr>

                        {expandedQuery === record.query.id && (
                          <tr className="sub-panel-row">
                            <td colSpan={7}>
                              <div className="related-data-panel">
                                <div className="panel-header">
                                  <Package size={14} />
                                  <span>Trazas de Red Vinculadas</span>
                                </div>

                                {loadingPackets ? (
                                  <div className="panel-loading">Analizando correlación...</div>
                                ) : relatedPackets.length === 0 ? (
                                  <div className="panel-empty">
                                    No se encontraron tramas de datos vinculadas a esta resolución.
                                  </div>
                                ) : (
                                  <div className="traces-list">
                                    <div className="traces-grid-header">
                                      <span>Timestamp</span>
                                      <span>Flujo de Datos</span>
                                      <span>Protocolo</span>
                                      <span>Payload</span>
                                    </div>
                                    {relatedPackets.map((packet, idx) => (
                                      <div key={idx} className="trace-item">
                                        <span className="trace-time">{new Date(packet.timestamp).toLocaleTimeString()}</span>
                                        <span className="trace-flow">
                                          {packet.src_ip} → {packet.dst_ip}
                                        </span>
                                        <span className="trace-prot">{packet.protocol}</span>
                                        <span className="trace-size">{packet.length} B</span>
                                      </div>
                                    ))}
                                    <div className="panel-actions">
                                      <button
                                        className="trace-view-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          viewInCapture(
                                            record.query.id,
                                            record.query.query_name,
                                          );
                                        }}
                                      >
                                        <ExternalLink size={14} /> Abrir en Monitor de Captura
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DNSPage;
