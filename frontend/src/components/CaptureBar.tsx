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

  return (
    <div className="capture-bar">
      <div className="capture-bar-main">
        {/* Status Indicators */}
        <div className="capture-bar-status">
          <span
            className={`status-dot ${wsConnected ? "connected" : "disconnected"}`}
          />
          <span
            className={`capture-badge ${isCapturing ? "active" : "inactive"}`}
          >
            {isCapturing ? "● Capturando" : "○ Inactivo"}
          </span>
        </div>

        {/* Controls Row */}
        <div className="capture-bar-controls">
          <select
            value={networkInterface}
            onChange={(e) => setNetworkInterface(e.target.value)}
            disabled={isCapturing}
            className="capture-select"
            title="Interfaz de red"
          >
            <option value="">Todas las interfaces</option>
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>
                {iface}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtro BPF (ej: tcp port 80)"
            disabled={isCapturing}
            className="capture-input"
          />

          <input
            type="number"
            value={maxPackets}
            onChange={(e) => setMaxPackets(Number(e.target.value))}
            min="1"
            max="10000"
            disabled={isCapturing}
            className="capture-input capture-input-small"
            title="Máx. paquetes"
          />

          <div className="capture-bar-buttons">
            <button
              onClick={startCapture}
              disabled={isCapturing || loading}
              className="capture-btn capture-btn-start"
              title="Iniciar captura"
            >
              {loading && !isCapturing ? "..." : "▶"}
            </button>
            <button
              onClick={stopCapture}
              disabled={!isCapturing && !loading}
              className="capture-btn capture-btn-stop"
              title="Detener captura"
            >
              ■
            </button>
            <button
              onClick={resetCapture}
              disabled={loading}
              className="capture-btn capture-btn-reset"
              title="Resetear"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="capture-bar-filters">
          <button
            onClick={() => setFilter("tcp")}
            disabled={isCapturing}
            className="filter-chip"
          >
            TCP
          </button>
          <button
            onClick={() => setFilter("udp")}
            disabled={isCapturing}
            className="filter-chip"
          >
            UDP
          </button>
          <button
            onClick={() => setFilter("icmp")}
            disabled={isCapturing}
            className="filter-chip"
          >
            ICMP
          </button>
          <button
            onClick={() => setFilter("tcp port 80 or tcp port 443")}
            disabled={isCapturing}
            className="filter-chip"
          >
            HTTP/S
          </button>
          <button
            onClick={() => setFilter("tcp port 53 or udp port 53")}
            disabled={isCapturing}
            className="filter-chip"
          >
            DNS
          </button>
          <button
            onClick={() => setFilter("")}
            disabled={isCapturing}
            className="filter-chip filter-chip-clear"
          >
            ✕
          </button>
        </div>
      </div>

      {error && <div className="capture-bar-error">{error}</div>}
    </div>
  );
};

export default CaptureBar;
