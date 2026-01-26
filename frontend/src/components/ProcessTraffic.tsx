import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import "./ProcessTraffic.css";

interface ProcessStats {
  count: number;
  bytes: number;
  protocols: Record<string, number>;
  ports: number[];
  ips: string[];
}

interface ProcessTrafficProps {
  refreshTrigger?: number;
}

export const ProcessTraffic: React.FC<ProcessTrafficProps> = ({
  refreshTrigger = 0,
}) => {
  const [processes, setProcesses] = useState<Record<string, ProcessStats>>({});
  const [loading, setLoading] = useState(false);
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);

  const fetchProcessTraffic = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/capture/packets-by-process`,
      );
      const data = await response.json();
      setProcesses(data);
    } catch (error) {
      console.error("Error fetching process traffic:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessTraffic();
    const interval = setInterval(fetchProcessTraffic, 2000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getProtocolColor = (protocol: string): string => {
    switch (protocol) {
      case "TCP":
        return "#10b981";
      case "UDP":
        return "#f59e0b";
      case "ICMP":
        return "#ef4444";
      default:
        return "#0ea5e9";
    }
  };

  const sortedProcesses = Object.entries(processes).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  return (
    <div className="process-monitor glass-card">
      <div className="monitor-header">
        <h3 className="monitor-title">📊 Flujo por Entidad</h3>
        <button
          onClick={fetchProcessTraffic}
          disabled={loading}
          className="refresh-control"
          title="Sincronizar entidades"
        >
          {loading ? "..." : "Sincronizar"}
        </button>
      </div>

      {sortedProcesses.length === 0 ? (
        <div className="monitor-empty">
          <p>Esperando telemetría de procesos activos...</p>
        </div>
      ) : (
        <div className="entities-list">
          {sortedProcesses.map(([processName, stats]) => (
            <div key={processName} className={`entity-item ${expandedProcess === processName ? "expanded" : ""}`}>
              <div
                className="entity-header"
                onClick={() =>
                  setExpandedProcess(
                    expandedProcess === processName ? null : processName,
                  )
                }
              >
                <div className="entity-main-info">
                  <span className="entity-name">
                    {processName}
                  </span>
                  <div className="entity-metrics">
                    <span className="metric-tag">{stats.count} PKTS</span>
                    <span className="metric-tag secondary">{formatBytes(stats.bytes)}</span>
                  </div>
                </div>
                <span className="expand-icon">{expandedProcess === processName ? "−" : "+"}</span>
              </div>

              {expandedProcess === processName && (
                <div className="entity-details">
                  <div className="detail-row">
                    <span className="detail-label">Protocolos:</span>
                    <div className="chip-group">
                      {Object.entries(stats.protocols).map(
                        ([protocol, count]) => (
                          <div key={protocol} className="protocol-mini-chip">
                            <span
                              className="chip-dot"
                              style={{ backgroundColor: getProtocolColor(protocol) }}
                            />
                            <span className="chip-label">{protocol}: {count}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Puertos Interactivos ({stats.ports.length}):</span>
                    <div className="chip-group">
                      {stats.ports.slice(0, 8).map((port) => (
                        <span key={port} className="port-mini-chip">
                          {port}
                        </span>
                      ))}
                      {stats.ports.length > 8 && (
                        <span className="more-chip">
                          +{stats.ports.length - 8}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">IPs de Comunicación ({stats.ips.length}):</span>
                    <div className="chip-group">
                      {stats.ips.slice(0, 3).map((ip) => (
                        <span key={ip} className="ip-mini-chip">
                          {ip}
                        </span>
                      ))}
                      {stats.ips.length > 3 && (
                        <span className="more-chip">
                          +{stats.ips.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessTraffic;
