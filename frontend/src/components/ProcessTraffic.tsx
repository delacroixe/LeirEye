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
    <div className="process-traffic-container">
      <div className="process-header">
        <h3>📊 Tráfico por Proceso</h3>
        <button
          onClick={fetchProcessTraffic}
          disabled={loading}
          className="refresh-btn"
        >
          {loading ? "⟳" : "🔄"}
        </button>
      </div>

      {sortedProcesses.length === 0 ? (
        <div className="empty-state">
          <p>Inicia una captura para ver el tráfico por proceso</p>
        </div>
      ) : (
        <div className="processes-list">
          {sortedProcesses.map(([processName, stats]) => (
            <div key={processName} className="process-item">
              <div
                className="process-header-row"
                onClick={() =>
                  setExpandedProcess(
                    expandedProcess === processName ? null : processName,
                  )
                }
              >
                <div className="process-info">
                  <span className="process-name">
                    {expandedProcess === processName ? "▼" : "▶"} {processName}
                  </span>
                  <span className="process-stats">
                    {stats.count} paquetes • {formatBytes(stats.bytes)}
                  </span>
                </div>
              </div>

              {expandedProcess === processName && (
                <div className="process-details">
                  <div className="detail-section">
                    <h4>Protocolos</h4>
                    <div className="protocols">
                      {Object.entries(stats.protocols).map(
                        ([protocol, count]) => (
                          <div key={protocol} className="protocol-item">
                            <span
                              className="protocol-badge"
                              style={{
                                backgroundColor: getProtocolColor(protocol),
                              }}
                            >
                              {protocol}
                            </span>
                            <span className="protocol-count">{count}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Puertos ({stats.ports.length})</h4>
                    <div className="ports">
                      {stats.ports.slice(0, 10).map((port) => (
                        <span key={port} className="port-badge">
                          {port}
                        </span>
                      ))}
                      {stats.ports.length > 10 && (
                        <span className="more-badge">
                          +{stats.ports.length - 10}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>IPs ({stats.ips.length})</h4>
                    <div className="ips">
                      {stats.ips.slice(0, 5).map((ip) => (
                        <span key={ip} className="ip-badge">
                          {ip}
                        </span>
                      ))}
                      {stats.ips.length > 5 && (
                        <span className="more-badge">
                          +{stats.ips.length - 5}
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
