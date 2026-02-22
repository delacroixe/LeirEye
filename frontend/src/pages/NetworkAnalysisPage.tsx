import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Globe,
  HardDrive,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import "./NetworkAnalysisPage.css";

interface PortInfo {
  port: number;
  service: string;
  status: string;
  vulnerability?: string;
  risk_level: string;
}

interface Device {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  ports: PortInfo[];
  risk_score: number;
  last_seen: number;
  is_local?: boolean;
}

const NetworkAnalysisPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>("");
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [expandedIPs, setExpandedIPs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const fetchDevices = async (force = false) => {
    setLoading(true);
    setScanProgress("Iniciando escaneo de red...");

    // Simular progreso mientras esperamos
    const progressMessages = [
      "Descubriendo dispositivos en la red...",
      "Enviando paquetes ARP...",
      "Analizando respuestas...",
      "Escaneando puertos abiertos...",
      "Identificando servicios...",
      "Evaluando vulnerabilidades...",
      "Finalizando análisis...",
    ];

    let progressIndex = 0;
    const progressInterval = setInterval(() => {
      progressIndex = (progressIndex + 1) % progressMessages.length;
      setScanProgress(progressMessages[progressIndex]);
    }, 3000);

    try {
      const response = await fetch(
        `${API_BASE_URL}/analysis/scan${force ? "?force=true" : ""}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        setLastScan(new Date());
        setScanProgress("");
      } else {
        console.error("Error response:", response.status);
        setScanProgress("Error en el escaneo");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      setScanProgress("Error de conexión");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const toggleExpanded = (ip: string) => {
    const newSet = new Set(expandedIPs);
    if (newSet.has(ip)) {
      newSet.delete(ip);
    } else {
      newSet.add(ip);
    }
    setExpandedIPs(newSet);
  };

  const getRiskColor = (score: number) => {
    if (score === 0) return "#10b981";
    if (score < 30) return "#3b82f6";
    if (score < 60) return "#f59e0b";
    if (score < 90) return "#f97316";
    return "#ef4444";
  };

  const getRiskLabel = (score: number) => {
    if (score === 0) return "Seguro";
    if (score < 30) return "Bajo";
    if (score < 60) return "Medio";
    if (score < 90) return "Alto";
    return "Crítico";
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.ip.includes(searchTerm) ||
      device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.mac.includes(searchTerm);

    if (riskFilter === "all") return matchesSearch;
    return (
      matchesSearch &&
      getRiskLabel(device.risk_score).toLowerCase() === riskFilter
    );
  });

  const criticalVulns = devices.reduce(
    (acc, d) => acc + d.ports.filter((p) => p.risk_level === "critical").length,
    0,
  );
  const highVulns = devices.reduce(
    (acc, d) => acc + d.ports.filter((p) => p.risk_level === "high").length,
    0,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="analysis-page">
      {/* Loading Overlay */}
      {loading && (
        <div className="scan-overlay">
          <div className="scan-progress-card">
            <div className="scan-spinner"></div>
            <h3>Escaneando Red</h3>
            <p className="scan-status">{scanProgress}</p>
            <div className="scan-hint">
              Este proceso puede tomar entre 30 segundos y varios minutos
              dependiendo del tamaño de la red
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="header-info">
          <h1 className="page-title">Análisis de Red y Vulnerabilidades</h1>
          <p className="page-subtitle">
            Descubrimiento activo de dispositivos, identificación de servicios y
            evaluación de riesgos
          </p>
        </div>
        <div className="header-actions">
          {lastScan && (
            <span className="last-scan">
              Último escaneo: {lastScan.toLocaleTimeString()}
            </span>
          )}
          <button
            className={`btn-primary ${loading ? "loading" : ""}`}
            onClick={() => fetchDevices(true)}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="spin" size={18} />
            ) : (
              <Zap size={18} />
            )}
            <span>{loading ? "Escaneando..." : "Ejecutar Escaneo"}</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
          >
            <HardDrive size={20} color="#10b981" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{devices.length}</span>
            <span className="stat-label">Dispositivos</span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{criticalVulns}</span>
            <span className="stat-label">Críticas</span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: "rgba(249, 115, 22, 0.1)" }}
          >
            <ShieldAlert size={20} color="#f97316" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{highVulns}</span>
            <span className="stat-label">Altas</span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
          >
            <Wifi size={20} color="#3b82f6" />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {devices.reduce((acc, d) => acc + d.ports.length, 0)}
            </span>
            <span className="stat-label">Servicios</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar IP, hostname, MAC, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los riesgos</option>
            <option value="crítico">Crítico</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
            <option value="seguro">Seguro</option>
          </select>
        </div>

        <div className="result-count">
          {filteredDevices.length} de {devices.length} dispositivos
        </div>
      </div>

      {/* Devices Table */}
      <div className="devices-table-container">
        {filteredDevices.length > 0 ? (
          <table className="devices-table">
            <thead>
              <tr>
                <th className="col-expand"></th>
                <th className="col-ip">Dirección IP</th>
                <th className="col-info">Información del Dispositivo</th>
                <th className="col-mac">MAC Address</th>
                <th className="col-vendor">Vendor</th>
                <th className="col-servicios">Servicios</th>
                <th className="col-riesgo">Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device, idx) => {
                const isExpanded = expandedIPs.has(device.ip);
                const riskLevel = getRiskLabel(device.risk_score);
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`device-row risk-${riskLevel.toLowerCase()}`}
                    >
                      <td className="col-expand">
                        <button
                          className={`expand-btn ${isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpanded(device.ip)}
                          title={isExpanded ? "Contraer" : "Expandir"}
                        >
                          <ChevronDown size={18} />
                        </button>
                      </td>
                      <td className="col-ip">
                        <div className="ip-cell">
                          <Globe size={16} className="ip-icon" />
                          <code>{device.ip}</code>
                          <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(device.ip)}
                            title="Copiar"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="col-info">
                        <div className="info-cell">
                          <span className="hostname">
                            {device.hostname || "—"}
                          </span>
                          <span className="last-seen">
                            Visto:{" "}
                            {new Date(
                              device.last_seen * 1000,
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="col-mac">
                        <code className="mac-addr">{device.mac}</code>
                      </td>
                      <td className="col-vendor">
                        <span className="vendor-tag">
                          {device.vendor || "Desconocido"}
                        </span>
                      </td>
                      <td className="col-servicios">
                        <div className="service-badge">
                          {device.ports.length === 0 ? (
                            <span className="no-services">Cerrado</span>
                          ) : (
                            <>
                              <span className="service-count">
                                {device.ports.length}
                              </span>
                              <span className="service-label">
                                {device.ports.length === 1
                                  ? "servicio"
                                  : "servicios"}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="col-riesgo">
                        <div className="risk-cell">
                          <div
                            className="risk-bar"
                            style={{
                              width: `${device.risk_score}%`,
                              backgroundColor: getRiskColor(device.risk_score),
                            }}
                          />
                          <span className="risk-text">
                            {riskLevel} ({device.risk_score})
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && device.ports.length > 0 && (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          <div className="detail-content">
                            <h4 className="detail-title">
                              Servicios Abiertos Detectados
                            </h4>
                            <div className="services-grid">
                              {device.ports.map((port, pIdx) => (
                                <div
                                  key={pIdx}
                                  className={`service-card risk-${port.risk_level}`}
                                >
                                  <div className="service-header">
                                    <div className="port-circle">
                                      <span className="port-number">
                                        {port.port}
                                      </span>
                                    </div>
                                    <div className="service-info">
                                      <h5>{port.service}</h5>
                                      <span className="status-badge">
                                        {port.status}
                                      </span>
                                    </div>
                                    <div className="service-risk">
                                      <span
                                        className={`risk-badge ${port.risk_level}`}
                                      >
                                        {port.risk_level.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  {port.vulnerability && (
                                    <div className="vuln-alert">
                                      <ShieldAlert size={14} />
                                      <span>{port.vulnerability}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isExpanded && device.ports.length === 0 && (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          <div className="detail-content empty">
                            <ShieldCheck size={32} color="#10b981" />
                            <p>
                              No hay servicios comunes expuestos en este
                              dispositivo
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Search size={48} />
            <h3>
              {searchTerm || riskFilter !== "all"
                ? "No se encontraron dispositivos"
                : "Inicia un escaneo"}
            </h3>
            <p>
              {searchTerm || riskFilter !== "all"
                ? "Intenta con otros criterios de búsqueda o filtro"
                : "Haz clic en 'Ejecutar Escaneo' para descubrir equipos en tu red local"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkAnalysisPage;
