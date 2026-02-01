import {
  Activity,
  Brain,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import { useAI } from "../contexts/AIContext";
import apiService, { WiFiNetwork } from "../services/api";
import "./WiFiPage.css";

export const WiFiPage: React.FC = () => {
  const { status: aiStatus } = useAI();
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string;
    security_score?: number;
    security_findings?: string[];
    optimization_tips?: string[];
    crowded_channels?: number[];
    error?: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchWiFiData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getWiFiAnalysis();
      setPrivacyMode(data.privacy_mode_active);
      const sorted = data.available_networks.sort(
        (a, b) => b.signal_quality - a.signal_quality,
      );
      setNetworks(sorted);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWiFiData();
    const interval = setInterval(fetchWiFiData, 15000);
    return () => clearInterval(interval);
  }, [fetchWiFiData]);

  const getSignalIcon = (quality: number) => {
    if (quality > 75)
      return <SignalHigh size={20} className="signal-level high" />;
    if (quality > 50)
      return <SignalMedium size={20} className="signal-level medium" />;
    if (quality > 25)
      return <SignalLow size={20} className="signal-level low" />;
    return <Signal size={20} className="signal-level none" />;
  };

  const getSecurityIcon = (security: string) => {
    const s = security.toLowerCase();
    if (s.includes("open") || s === "none")
      return <ShieldAlert size={16} className="sec-icon open" />;
    if (s.includes("wpa3"))
      return <ShieldCheck size={16} className="sec-icon wpa3" />;
    return <Shield size={16} className="sec-icon secure" />;
  };

  const calculateDistance = (rssi: number) => {
    const p0 = -35;
    const n = 2.5;
    const distance = Math.pow(10, (p0 - rssi) / (10 * n));
    return distance.toFixed(1);
  };

  return (
    <div className="view-container wifi-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">📡</span> Analizador de Espectro WiFi
          </h1>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.wifi} pageId="wifi" />
          <button
            className="action-icon-btn"
            onClick={fetchWiFiData}
            title="Escanear Aire"
          >
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
          </button>
          {aiStatus?.available && (
            <button
              className="action-icon-btn ai-btn"
              onClick={async () => {
                setAiLoading(true);
                try {
                  const result = await apiService.analyzeWiFiWithAI(networks);
                  setAiAnalysis(result);
                } catch (e) {
                  setAiAnalysis({ error: "Error obteniendo análisis IA" });
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading || networks.length === 0}
              title="Auditoría IA del espectro"
            >
              <Sparkles size={18} className={aiLoading ? "spinning" : ""} />
              <span className="btn-label">AI Audit</span>
            </button>
          )}
        </div>
      </header>

      <div className="view-content">
        {privacyMode && (
          <div className="privacy-warning-banner glass-card">
            <ShieldAlert size={20} className="warning-icon" />
            <div className="warning-text">
              <strong>Privacidad de macOS Activa:</strong> Los nombres de red
              (SSID) y BSSIDs reales están ocultos por el sistema. Se han
              generado identificadores virtuales para permitir el análisis.
            </div>
          </div>
        )}

        {aiAnalysis && (
          <div className="ai-analysis-panel glass-card">
            <div className="ai-panel-header">
              <Brain size={20} className="ai-icon" />
              <h3>Análisis de IA</h3>
              <button className="close-btn" onClick={() => setAiAnalysis(null)}>
                ×
              </button>
            </div>
            {aiAnalysis.error ? (
              <p className="ai-error">{aiAnalysis.error}</p>
            ) : (
              <div className="ai-content">
                <p className="ai-summary">{aiAnalysis.summary}</p>
                {aiAnalysis.security_score !== undefined && (
                  <div className="ai-score">
                    <span className="score-label">
                      Puntuación de Seguridad:
                    </span>
                    <span
                      className={`score-value ${aiAnalysis.security_score > 70 ? "good" : aiAnalysis.security_score > 40 ? "medium" : "bad"}`}
                    >
                      {aiAnalysis.security_score}/100
                    </span>
                  </div>
                )}
                {aiAnalysis.security_findings &&
                  aiAnalysis.security_findings.length > 0 && (
                    <div className="ai-section">
                      <h4>Hallazgos de Seguridad</h4>
                      <ul>
                        {aiAnalysis.security_findings.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {aiAnalysis.optimization_tips &&
                  aiAnalysis.optimization_tips.length > 0 && (
                    <div className="ai-section">
                      <h4>Tips de Optimización</h4>
                      <ul>
                        {aiAnalysis.optimization_tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        <div className="wifi-dashboard-grid">
          <div className="stats-strip grid-span-full">
            <div className="mini-stat-card glass-card">
              <Radio size={18} className="m-icon" />
              <div className="m-info">
                <span className="m-label">Redes Visibles</span>
                <span className="m-val">{networks.length}</span>
              </div>
            </div>
            <div className="mini-stat-card glass-card">
              <ShieldCheck size={18} className="m-icon secure" />
              <div className="m-info">
                <span className="m-label">Redes Seguras</span>
                <span className="m-val">
                  {
                    networks.filter(
                      (n) => !n.security.toLowerCase().includes("open"),
                    ).length
                  }
                </span>
              </div>
            </div>
            <div className="mini-stat-card glass-card">
              <Activity size={18} className="m-icon" />
              <div className="m-info">
                <span className="m-label">Vendors Únicos</span>
                <span className="m-val">
                  {new Set(networks.map((n) => n.vendor)).size}
                </span>
              </div>
            </div>
          </div>

          <div className="wifi-list-panel glass-card grid-span-full">
            <div className="panel-header">
              <h3 className="panel-title">
                Lista de Estaciones Base (RSSI Sorted)
              </h3>
            </div>
            <div className="premium-table-view">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Calidad</th>
                    <th>SSID / Red</th>
                    <th>Fabricante (OUI)</th>
                    <th>Relación Signal/Noise</th>
                    <th>Canal / Banda</th>
                    <th>PHY</th>
                    <th>Dist. Est.</th>
                    <th>BSSID</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && networks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="placeholder-row">
                        Escaneando espectro radioeléctrico...
                      </td>
                    </tr>
                  ) : networks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="placeholder-row">
                        No se encontraron redes WiFi disponibles.
                      </td>
                    </tr>
                  ) : (
                    networks.map((net, idx) => (
                      <tr key={`${net.bssid}-${idx}`} className="premium-row">
                        <td className="cell-signal">
                          <div className="quality-bar-container">
                            {getSignalIcon(net.signal_quality)}
                            <div className="quality-meter">
                              <div
                                className="quality-fill"
                                style={{ width: `${net.signal_quality}%` }}
                              />
                            </div>
                            <span className="quality-text">
                              {net.signal_quality}%
                            </span>
                          </div>
                        </td>
                        <td className="cell-ssid">
                          <div className="ssid-box">
                            <span className="ssid-name">
                              {net.ssid || "<Oculto>"}
                            </span>
                            <div className="sec-badge">
                              {getSecurityIcon(net.security)}
                              <span>{net.security.split(" ")[0]}</span>
                            </div>
                          </div>
                        </td>
                        <td className="cell-vendor">
                          <span className="vendor-tag">
                            {net.vendor || "Generic"}
                          </span>
                        </td>
                        <td className="cell-rssi">
                          <div className="rssi-metrics">
                            <span className="r-label">PWR:</span>
                            <span className="r-val">{net.rssi} dBm</span>
                            <span className="r-label noise">NS:</span>
                            <span className="r-val">{net.noise} dBm</span>
                          </div>
                        </td>
                        <td className="cell-chan">
                          <span className="chan-chip">{net.channel}</span>
                          <span className="band-label">{net.band}</span>
                        </td>
                        <td className="cell-proto">
                          <span className="proto-tag">{net.protocol}</span>
                        </td>
                        <td className="cell-dist">
                          <span className="dist-val">
                            {calculateDistance(net.rssi)}m
                          </span>
                        </td>
                        <td className="cell-bssid">
                          <code>{net.bssid}</code>
                        </td>
                      </tr>
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

export default WiFiPage;
