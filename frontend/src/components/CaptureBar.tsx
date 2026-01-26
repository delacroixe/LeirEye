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
        {/* Main Control Strip */}
        <div className="bar-primary">
          {/* Status Diagnostic */}
          <div className="status-diagnostic">
            <div className={`connection-orb ${wsConnected ? "online" : "offline"}`} />
            <div className="status-meta">
              <span className="status-label">ESTADO DEL MOTOR</span>
              <span className={`status-val ${isCapturing ? "active" : ""}`}>
                {isCapturing ? "SISTEMA ARMADO - MONITORIZANDO" : "SISTEMA EN STANDBY"}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* Engine Parameters */}
          <div className="engine-parameters">
            <div className="param-group">
              <label className="param-label">INTERFACE</label>
              <select
                value={networkInterface}
                onChange={(e) => setNetworkInterface(e.target.value)}
                disabled={isCapturing}
                className="param-select"
              >
                <option value="">AUTO-SELECT</option>
                {interfaces.map((iface) => (
                  <option key={iface} value={iface}>
                    {iface}
                  </option>
                ))}
              </select>
            </div>

            <div className="param-group stretch">
              <label className="param-label">FILTRO BPF (KERNEL-LEVEL)</label>
              <Input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="ej: tcp port 80 or udp"
                disabled={isCapturing}
                className="param-input"
              />
            </div>

            <div className="param-group small">
              <label className="param-label">BUFFER</label>
              <Input
                type="number"
                value={maxPackets}
                onChange={(e) => setMaxPackets(Number(e.target.value))}
                min="1"
                max="10000"
                disabled={isCapturing}
                className="param-input text-center"
              />
            </div>
          </div>

          <div className="divider" />

          {/* System Actions */}
          <div className="system-actions">
            {!isCapturing ? (
              <button
                onClick={startCapture}
                disabled={loading}
                className="action-btn primary-action"
              >
                {loading ? <Loader size={16} className="spinning" /> : "DESPLEGAR MOTOR"}
              </button>
            ) : (
              <button
                onClick={stopCapture}
                className="action-btn danger-action"
              >
                DETENER CAPTURA
              </button>
            )}

            <button
              onClick={resetCapture}
              disabled={loading}
              className="action-btn secondary-action"
              title="Borrar buffer local"
            >
              PURGAR
            </button>
          </div>
        </div>

        {/* Quick Filter Matrix */}
        <div className="bar-secondary">
          <div className="matrix-label">MACROS DE FILTRADO:</div>
          <div className="matrix-chips">
            {filterChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setFilter(chip.value)}
                disabled={isCapturing}
                className={`matrix-chip ${filter === chip.value ? "active" : ""}`}
              >
                {chip.label}
              </button>
            ))}
            <button
              onClick={() => setFilter("")}
              disabled={isCapturing}
              className="matrix-chip clear"
            >
              ✕ RESET FILTRO
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
