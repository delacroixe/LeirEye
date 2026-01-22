import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Filter,
  Info,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import { API_BASE_URL } from "../config";
import "./AlertsPage.css";

interface AlertSource {
  process_name?: string;
  pid?: number;
  src_ip?: string;
  dst_ip?: string;
  domain?: string;
}

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source: AlertSource;
  metadata: Record<string, any>;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

interface AlertStats {
  total: number;
  unacknowledged: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  recent_24h: number;
}

const severityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  critical: { icon: AlertOctagon, color: "#dc2626", bgColor: "#fef2f2" },
  high: { icon: AlertTriangle, color: "#ea580c", bgColor: "#fff7ed" },
  medium: { icon: AlertTriangle, color: "#ca8a04", bgColor: "#fefce8" },
  low: { icon: Info, color: "#2563eb", bgColor: "#eff6ff" },
  info: { icon: Info, color: "#6b7280", bgColor: "#f9fafb" },
};

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    severity?: string;
    type?: string;
    acknowledged?: boolean;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.severity) params.append("severity", filter.severity);
      if (filter.type) params.append("alert_type", filter.type);
      if (filter.acknowledged !== undefined)
        params.append("acknowledged", String(filter.acknowledged));

      const url = `${API_BASE_URL}/alerts?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar alertas");
      const data = await response.json();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/stats`);
      if (!response.ok) throw new Error("Error al cargar estadísticas");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAlerts(), fetchStats()]);
    setLoading(false);
  }, [fetchAlerts, fetchStats]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/alerts/${alertId}/acknowledge`,
        {
          method: "POST",
        },
      );
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  const acknowledgeAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/acknowledge-all`, {
        method: "POST",
      });
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error acknowledging all alerts:", err);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  const clearAllAlerts = async () => {
    if (!window.confirm("¿Estás seguro de eliminar todas las alertas?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error clearing alerts:", err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSeverityDisplay = (severity: string) => {
    const config =
      severityConfig[severity.toLowerCase()] || severityConfig.info;
    const Icon = config.icon;
    return (
      <span
        className="severity-badge"
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        <Icon size={14} />
        {severity.toUpperCase()}
      </span>
    );
  };

  const getTypeDisplay = (type: string) => {
    const typeLabels: Record<string, string> = {
      DNS_TUNNELING: "🔗 DNS Tunneling",
      DNS_UNUSUAL: "📡 DNS Inusual",
      PORT_SCAN: "🔍 Port Scan",
      NEW_CONNECTION: "🔌 Nueva Conexión",
      GEO_UNUSUAL: "🌍 Geo Inusual",
      HIGH_TRAFFIC: "📊 Alto Tráfico",
      UNENCRYPTED_DATA: "🔓 Datos Sin Cifrar",
      SUSPICIOUS_PROCESS: "⚠️ Proceso Sospechoso",
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="alerts-page">
      <header className="alerts-header">
        <div className="header-title">
          <Bell size={24} />
          <h1>Centro de Alertas</h1>
          {stats && stats.unacknowledged > 0 && (
            <span className="unread-badge">{stats.unacknowledged}</span>
          )}
        </div>
        <div className="header-actions">
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
          {stats && stats.unacknowledged > 0 && (
            <button className="btn-secondary" onClick={acknowledgeAll}>
              <Check size={16} />
              Marcar todas leídas
            </button>
          )}
          {alerts.length > 0 && (
            <button className="btn-danger" onClick={clearAllAlerts}>
              <Trash2 size={16} />
              Limpiar
            </button>
          )}
        </div>
      </header>

      <PageHelp content={PAGE_HELP.alerts} />

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card critical">
            <span className="stat-value">
              {stats.by_severity?.critical || 0}
            </span>
            <span className="stat-label">Críticas</span>
          </div>
          <div className="stat-card high">
            <span className="stat-value">{stats.by_severity?.high || 0}</span>
            <span className="stat-label">Altas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.recent_24h}</span>
            <span className="stat-label">Últimas 24h</span>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Severidad</label>
            <select
              value={filter.severity || ""}
              onChange={(e) =>
                setFilter({ ...filter, severity: e.target.value || undefined })
              }
            >
              <option value="">Todas</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={
                filter.acknowledged === undefined
                  ? ""
                  : String(filter.acknowledged)
              }
              onChange={(e) =>
                setFilter({
                  ...filter,
                  acknowledged:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
            >
              <option value="">Todas</option>
              <option value="false">No leídas</option>
              <option value="true">Leídas</option>
            </select>
          </div>
          <button className="btn-clear" onClick={() => setFilter({})}>
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

      <div className="alerts-list">
        {loading && alerts.length === 0 ? (
          <div className="loading-state">Cargando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <h3>Sin alertas</h3>
            <p>No hay alertas que mostrar</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item ${alert.acknowledged ? "acknowledged" : "unread"}`}
            >
              <div className="alert-main">
                <div className="alert-header">
                  {getSeverityDisplay(alert.severity)}
                  <span className="alert-type">
                    {getTypeDisplay(alert.type)}
                  </span>
                  <span className="alert-time">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
                <h3 className="alert-title">{alert.title}</h3>
                <p className="alert-description">{alert.description}</p>

                {(alert.source.process_name ||
                  alert.source.src_ip ||
                  alert.source.domain) && (
                  <div className="alert-source">
                    {alert.source.process_name && (
                      <span className="source-tag">
                        📦 {alert.source.process_name}
                        {alert.source.pid && ` (PID: ${alert.source.pid})`}
                      </span>
                    )}
                    {alert.source.src_ip && (
                      <span className="source-tag">
                        📍 {alert.source.src_ip}
                      </span>
                    )}
                    {alert.source.domain && (
                      <span className="source-tag">
                        🌐 {alert.source.domain}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="alert-actions">
                {!alert.acknowledged && (
                  <button
                    className="btn-action"
                    onClick={() => acknowledgeAlert(alert.id)}
                    title="Marcar como leída"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  className="btn-action delete"
                  onClick={() => deleteAlert(alert.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
