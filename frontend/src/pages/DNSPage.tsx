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
      fractionalSecondDigits: 2,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#dc2626";
    if (score >= 40) return "#ea580c";
    if (score >= 20) return "#ca8a04";
    return "#22c55e";
  };

  return (
    <div className="dns-page">
      <header className="dns-header">
        <div className="header-title">
          <Globe size={24} />
          <h1>DNS Tracker</h1>
          {stats && stats.suspicious_queries > 0 && (
            <span className="suspicious-badge">
              <AlertTriangle size={14} />
              {stats.suspicious_queries} sospechosas
            </span>
          )}
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar dominio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            className="btn-icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <Filter size={18} />
          </button>
          <button className="btn-icon" onClick={loadData} title="Actualizar">
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
          </button>
          {records.length > 0 && (
            <button className="btn-danger" onClick={clearHistory}>
              <Trash2 size={16} />
              Limpiar
            </button>
          )}
        </div>
      </header>

      <PageHelp content={PAGE_HELP.dns} />

      <div className="dns-overview">
        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card">
            <Activity size={20} />
            <div className="stat-info">
              <span className="stat-value">{stats?.total_queries || 0}</span>
              <span className="stat-label">Queries totales</span>
            </div>
          </div>
          <div className="stat-card">
            <Globe size={20} />
            <div className="stat-info">
              <span className="stat-value">{stats?.unique_domains || 0}</span>
              <span className="stat-label">Dominios únicos</span>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={20} />
            <div className="stat-info">
              <span className="stat-value">
                {stats?.queries_per_minute.toFixed(1) || 0}
              </span>
              <span className="stat-label">Queries/min</span>
            </div>
          </div>
          <div className="stat-card warning">
            <AlertTriangle size={20} />
            <div className="stat-info">
              <span className="stat-value">{stats?.failed_queries || 0}</span>
              <span className="stat-label">Fallidas</span>
            </div>
          </div>
        </div>

        {/* Tunneling Score */}
        {indicators && (
          <div className="tunneling-panel">
            <div className="tunneling-header">
              <Shield size={20} />
              <span>Indicadores de DNS Tunneling</span>
            </div>
            <div className="tunneling-content">
              <div
                className="score-circle"
                style={{ borderColor: getScoreColor(indicators.score) }}
              >
                <span
                  className="score-value"
                  style={{ color: getScoreColor(indicators.score) }}
                >
                  {indicators.score}
                </span>
                <span className="score-label">Score</span>
              </div>
              <div className="indicators-list">
                <div className="indicator">
                  <span className="indicator-label">Queries largos</span>
                  <span className="indicator-value">
                    {indicators.long_queries}
                  </span>
                </div>
                <div className="indicator">
                  <span className="indicator-label">Alta entropía</span>
                  <span className="indicator-value">
                    {indicators.high_entropy_queries}
                  </span>
                </div>
                <div className="indicator">
                  <span className="indicator-label">Muchos subdominios</span>
                  <span className="indicator-value">
                    {indicators.many_subdomains}
                  </span>
                </div>
                <div className="indicator">
                  <span className="indicator-label">Tipos inusuales</span>
                  <span className="indicator-value">
                    {indicators.unusual_types}
                  </span>
                </div>
                <div className="indicator">
                  <span className="indicator-label">Alta frecuencia</span>
                  <span
                    className={`indicator-value ${indicators.high_frequency ? "warning" : ""}`}
                  >
                    {indicators.high_frequency ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Proceso</label>
            <input
              type="text"
              placeholder="Nombre del proceso"
              value={filter.process_name || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  process_name: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filter.suspicious_only}
                onChange={(e) =>
                  setFilter({ ...filter, suspicious_only: e.target.checked })
                }
              />
              Solo sospechosas
            </label>
          </div>
          <button
            className="btn-clear"
            onClick={() => setFilter({ suspicious_only: false })}
          >
            <X size={14} /> Limpiar filtros
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Top Domains */}
      {stats && stats.top_domains.length > 0 && (
        <div className="top-section">
          <h3>Top Dominios</h3>
          <div className="top-list">
            {stats.top_domains.slice(0, 8).map((item, index) => (
              <div key={index} className="top-item">
                <span className="top-rank">#{index + 1}</span>
                <span className="top-domain">{item.domain}</span>
                <span className="top-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queries List */}
      <div className="queries-section">
        <h3>Queries Recientes</h3>
        <div className="queries-table">
          <div className="table-header">
            <span></span>
            <span>Hora</span>
            <span>Dominio</span>
            <span>Tipo</span>
            <span>Proceso</span>
            <span>Respuesta</span>
            <span>Estado</span>
          </div>
          {loading && records.length === 0 ? (
            <div className="loading-state">Cargando queries...</div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <Globe size={32} />
              <p>No hay queries DNS</p>
            </div>
          ) : (
            records.map((record) => (
              <React.Fragment key={record.query.id}>
                <div
                  className={`table-row clickable ${record.query.is_suspicious ? "suspicious" : ""} ${expandedQuery === record.query.id ? "expanded" : ""}`}
                  onClick={() => fetchRelatedPackets(record.query.id)}
                >
                  <span className="cell-expand">
                    {expandedQuery === record.query.id ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                  <span className="cell-time">
                    {formatTimestamp(record.query.timestamp)}
                  </span>
                  <span className="cell-domain" title={record.query.query_name}>
                    {record.query.query_name.length > 40
                      ? `${record.query.query_name.substring(0, 40)}...`
                      : record.query.query_name}
                  </span>
                  <span className="cell-type">{record.query.query_type}</span>
                  <span className="cell-process">
                    {record.query.process_name || "-"}
                  </span>
                  <span className="cell-answers">
                    {record.response?.answers.length
                      ? record.response.answers.slice(0, 2).join(", ")
                      : "-"}
                  </span>
                  <span className="cell-status">
                    {record.query.is_suspicious ? (
                      <span
                        className="status-badge suspicious"
                        title={record.query.suspicion_reasons.join(", ")}
                      >
                        <AlertTriangle size={12} /> Sospechoso
                      </span>
                    ) : record.resolved ? (
                      <span className="status-badge ok">OK</span>
                    ) : record.response?.response_code ? (
                      <span className="status-badge error">
                        {record.response.response_code}
                      </span>
                    ) : (
                      <span className="status-badge pending">Pendiente</span>
                    )}
                  </span>
                </div>

                {/* Panel de paquetes relacionados */}
                {expandedQuery === record.query.id && (
                  <div className="related-packets-panel">
                    <div className="packets-header">
                      <Package size={16} />
                      <span>Paquetes relacionados con esta query</span>
                    </div>
                    {loadingPackets ? (
                      <div className="packets-loading">
                        Cargando paquetes...
                      </div>
                    ) : relatedPackets.length === 0 ? (
                      <div className="packets-empty">
                        No se encontraron paquetes capturados para esta query.
                        <br />
                        <small>
                          La captura debe estar activa para vincular paquetes.
                        </small>
                      </div>
                    ) : (
                      <div className="packets-list">
                        {relatedPackets.map((packet, idx) => (
                          <div key={idx} className="packet-item">
                            <span className="packet-time">
                              {new Date(packet.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="packet-flow">
                              {packet.src_ip}:{packet.src_port || "*"} →{" "}
                              {packet.dst_ip}:{packet.dst_port || "*"}
                            </span>
                            <span className="packet-protocol">
                              {packet.protocol}
                            </span>
                            <span className="packet-length">
                              {packet.length} bytes
                            </span>
                          </div>
                        ))}
                        <button
                          className="view-all-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewInCapture(
                              record.query.id,
                              record.query.query_name,
                            );
                          }}
                        >
                          <ExternalLink size={14} />
                          Ver en captura
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DNSPage;
