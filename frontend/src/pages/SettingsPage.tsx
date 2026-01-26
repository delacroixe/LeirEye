import { Bell, Database, Monitor, Wifi } from "lucide-react";
import React, { useState } from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import { useCaptureContext } from "../contexts/CaptureContext";
import "./SettingsPage.css";

interface SettingsState {
  maxPackets: number;
  autoRefresh: boolean;
  refreshInterval: number;
  darkMode: boolean;
  notifications: boolean;
  soundAlerts: boolean;
  notificationSeverityFilter: "all" | "critical-high" | "critical";
  maxToasts: number;
  toastDuration: number;
  alertDeduplicationWindow: number;
}

const SettingsPage: React.FC = () => {
  const { maxPackets, setMaxPackets } = useCaptureContext();

  // Cargar configuración desde localStorage
  const loadSettings = (): SettingsState => {
    const saved = localStorage.getItem("netmentor_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error al cargar configuración:", e);
      }
    }
    return {
      maxPackets: maxPackets,
      autoRefresh: true,
      refreshInterval: 5,
      darkMode: true,
      notifications: false,
      soundAlerts: false,
      notificationSeverityFilter: "critical-high",
      maxToasts: 3,
      toastDuration: 5,
      alertDeduplicationWindow: 30,
    };
  };

  const [settings, setSettings] = useState<SettingsState>(loadSettings());

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Aplicar cambios específicos
    if (key === "maxPackets") {
      setMaxPackets(value);
    }
  };

  const handleSave = () => {
    localStorage.setItem("netmentor_settings", JSON.stringify(settings));
    // Disparar evento para que otros componentes se actualicen
    window.dispatchEvent(
      new CustomEvent("settings-updated", { detail: settings }),
    );
    alert("Configuración guardada exitosamente");
  };

  return (
    <div className="view-container settings-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">⚙️</span> Centro de Control
          </h1>
          <p className="view-subtitle">
            Ajustes globales del motor de captura, visualización de telemetría y protocolos de notificación.
          </p>
        </div>
        <div className="header-actions">
          <button className="premium-btn primary" onClick={handleSave}>
            Sincronizar Cambios
          </button>
        </div>
      </header>

      <PageHelp content={PAGE_HELP.settings} />

      <div className="view-content">
        <div className="settings-grid">
          {/* Engineering Panel */}
          <section className="settings-panel glass-card">
            <div className="panel-header">
              <Wifi size={18} className="panel-icon" />
              <h3 className="panel-title">Parámetros de Captura</h3>
            </div>
            <div className="panel-body">
              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Buffer de Paquetes</span>
                  <p className="config-desc">Dimensión máxima de la cola de retención por sesión activa.</p>
                </div>
                <div className="config-control">
                  <input
                    type="number"
                    className="cyber-input small"
                    value={settings.maxPackets}
                    onChange={(e) =>
                      handleChange("maxPackets", Number(e.target.value))
                    }
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Interface Panel */}
          <section className="settings-panel glass-card">
            <div className="panel-header">
              <Monitor size={18} className="panel-icon" />
              <h3 className="panel-title">Visualización & Telemetría</h3>
            </div>
            <div className="panel-body">
              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Auto-Streaming de Datos</span>
                  <p className="config-desc">Habilita la actualización automática de métricas en tiempo real.</p>
                </div>
                <div className="config-control">
                  <label className="cyber-toggle">
                    <input
                      type="checkbox"
                      checked={settings.autoRefresh}
                      onChange={(e) =>
                        handleChange("autoRefresh", e.target.checked)
                      }
                    />
                    <span className="toggle-track"></span>
                  </label>
                </div>
              </div>

              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Frecuencia de Muestreo</span>
                  <p className="config-desc">Intervalo de tiempo entre ciclos de sincronización.</p>
                </div>
                <div className="config-control">
                  <select
                    className="cyber-select"
                    value={settings.refreshInterval}
                    onChange={(e) =>
                      handleChange("refreshInterval", Number(e.target.value))
                    }
                    disabled={!settings.autoRefresh}
                  >
                    <option value={1}>1.0s (Crónico)</option>
                    <option value={5}>5.0s (Estándar)</option>
                    <option value={10}>10s (Bajo impacto)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Intelligence & Notifications */}
          <section className="settings-panel glass-card">
            <div className="panel-header">
              <Bell size={18} className="panel-icon" />
              <h3 className="panel-title">Protocolos de Alerta</h3>
            </div>
            <div className="panel-body">
              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Notificaciones de Kernel (Toast)</span>
                  <p className="config-desc">Alertas visuales instantáneas para eventos del sistema.</p>
                </div>
                <div className="config-control">
                  <label className="cyber-toggle">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        handleChange("notifications", e.target.checked)
                      }
                    />
                    <span className="toggle-track"></span>
                  </label>
                </div>
              </div>

              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Feedback Acústico</span>
                  <p className="config-desc">Señales sonoras para alertas críticas de seguridad.</p>
                </div>
                <div className="config-control">
                  <label className="cyber-toggle">
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={(e) =>
                        handleChange("soundAlerts", e.target.checked)
                      }
                    />
                    <span className="toggle-track"></span>
                  </label>
                </div>
              </div>

              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Filtro SISC (Severidad)</span>
                  <p className="config-desc">Ubral de severidad mínimo para disparo de notificaciones.</p>
                </div>
                <div className="config-control">
                  <select
                    className="cyber-select"
                    value={settings.notificationSeverityFilter}
                    onChange={(e) =>
                      handleChange("notificationSeverityFilter", e.target.value)
                    }
                    disabled={!settings.notifications}
                  >
                    <option value="all">Nivel: Traza+</option>
                    <option value="critical-high">Nivel: Alta+</option>
                    <option value="critical">Nivel: Crítica</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Storage Management */}
          <section className="settings-panel glass-card danger-zone">
            <div className="panel-header">
              <Database size={18} className="panel-icon" />
              <h3 className="panel-title">Persistencia de Datos</h3>
            </div>
            <div className="panel-body">
              <div className="config-row">
                <div className="config-info">
                  <span className="config-label">Purgar Configuración Local</span>
                  <p className="config-desc">Resetea el estado de la aplicación a valores de fábrica.</p>
                </div>
                <div className="config-control">
                  <button
                    className="premium-btn danger outline"
                    onClick={() => {
                      localStorage.clear();
                      alert("Persistencia eliminada. Reiniciando terminal...");
                      window.location.reload();
                    }}
                  >
                    Purgar Datos
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
