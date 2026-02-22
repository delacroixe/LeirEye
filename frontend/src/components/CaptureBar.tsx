import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import React from "react";
import { useCaptureContext } from "../contexts/CaptureContext";
import "./CaptureBar.css";

export const CaptureBar: React.FC = () => {
  const {
    isCapturing,
    wsConnected,
    networkInterface,
    filter,
    maxPackets,
    interfaces,
    loading,
    error,
    startCapture,
    stopCapture,
    resetCapture,
    setNetworkInterface,
    setFilter,
    setMaxPackets,
  } = useCaptureContext();

  const filterChips = [
    { label: "TCP", value: "tcp" },
    { label: "UDP", value: "udp" },
    { label: "ICMP", value: "icmp" },
    { label: "HTTP/S", value: "tcp port 80 or tcp port 443" },
    { label: "DNS", value: "tcp port 53 or udp port 53" },
  ];

  return (
    <div className="capture-bar-wrapper">
      <div className="capture-bar glass-card">
        {/* Totalmente integrado en una sola fila para ahorrar espacio */}
        <div className="bar-main-row">
          {/* Status Diagnostic - Muy compacto */}
          <div className="status-compact">
            <div
              className={`connection-orb ${wsConnected ? "online" : "offline"}`}
            />
            <div className="status-text">
              <span className={`status-val ${isCapturing ? "active" : ""}`}>
                {isCapturing ? "MONITORIZANDO" : "STANDBY"}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* Engine Parameters */}
          <div className="engine-parameters-compact">
            <div className="param-item">
              <select
                value={networkInterface}
                onChange={(e) => setNetworkInterface(e.target.value)}
                disabled={isCapturing}
                className="param-select-compact"
                title="Interfaz de red"
              >
                <option value="">AUTO</option>
                {interfaces.map((iface) => (
                  <option key={iface} value={iface}>
                    {iface}
                  </option>
                ))}
              </select>
            </div>

            <div className="param-item stretch">
              <Input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtro BPF: ej. tcp port 80"
                disabled={isCapturing}
                className="param-input-compact"
              />
            </div>

            {/* Macros integradas aquí en lugar de otra fila */}
            <div className="macros-inline">
              {filterChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => setFilter(chip.value)}
                  disabled={isCapturing}
                  className={`macro-pill ${filter === chip.value ? "active" : ""}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* System Actions */}
          <div className="system-actions-compact">
            {!isCapturing ? (
              <button
                onClick={startCapture}
                disabled={loading}
                className="action-btn-compact primary"
              >
                {loading ? (
                  <Loader size={14} className="spinning" />
                ) : (
                  "CAPTURAR"
                )}
              </button>
            ) : (
              <button
                onClick={stopCapture}
                className="action-btn-compact danger"
              >
                PARAR
              </button>
            )}

            <button
              onClick={resetCapture}
              disabled={loading}
              className="action-btn-compact secondary"
              title="Purgar datos"
            >
              PURGAR
            </button>
          </div>
        </div>

        {error && (
          <div className="capture-error-overlay">
            <span className="error-icon">⚠️</span>
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptureBar;
