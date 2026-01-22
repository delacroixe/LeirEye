import { Bell, Database, Monitor, Palette, Wifi } from "lucide-react";
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
    <div className="settings-page">
      <div className="page-header">
        <h2>⚙️ Configuración</h2>
        <p className="page-description">
          Personaliza el comportamiento de NetMentor
        </p>
      </div>

      <PageHelp content={PAGE_HELP.settings} />

      <div className="settings-content">
        {/* Capture Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Wifi size={20} />
            <h3>Captura de Red</h3>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Máximo de paquetes</label>
                <p>Número máximo de paquetes a capturar por sesión</p>
              </div>
              <input
                type="number"
                value={settings.maxPackets}
                onChange={(e) =>
                  handleChange("maxPackets", Number(e.target.value))
                }
                min="100"
                max="10000"
                step="100"
                className="setting-input"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Monitor size={20} />
            <h3>Visualización</h3>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Auto-refrescar estadísticas</label>
                <p>Actualizar automáticamente las estadísticas</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) =>
                    handleChange("autoRefresh", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Intervalo de refresco</label>
                <p>Segundos entre actualizaciones automáticas</p>
              </div>
              <select
                value={settings.refreshInterval}
                onChange={(e) =>
                  handleChange("refreshInterval", Number(e.target.value))
                }
                className="setting-select"
                disabled={!settings.autoRefresh}
              >
                <option value={1}>1 segundo</option>
                <option value={5}>5 segundos</option>
                <option value={10}>10 segundos</option>
                <option value={30}>30 segundos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Palette size={20} />
            <h3>Apariencia</h3>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Modo oscuro</label>
                <p>Usar tema oscuro (recomendado)</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleChange("darkMode", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Bell size={20} />
            <h3>Notificaciones</h3>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Notificaciones del navegador</label>
                <p>Recibir alertas cuando se detecte actividad sospechosa</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) =>
                    handleChange("notifications", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Alertas de sonido</label>
                <p>Reproducir sonido en eventos importantes</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={(e) =>
                    handleChange("soundAlerts", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Filtro de severidad para toasts</label>
                <p>Solo mostrar notificaciones toast de cierta severidad</p>
              </div>
              <select
                value={settings.notificationSeverityFilter}
                onChange={(e) =>
                  handleChange("notificationSeverityFilter", e.target.value)
                }
                className="setting-select"
                disabled={!settings.notifications}
              >
                <option value="all">Todas las severidades</option>
                <option value="critical-high">Crítica y Alta</option>
                <option value="critical">Solo Crítica</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Máximo de toasts simultáneos</label>
                <p>Número máximo de notificaciones visibles al mismo tiempo</p>
              </div>
              <input
                type="number"
                value={settings.maxToasts}
                onChange={(e) =>
                  handleChange("maxToasts", Number(e.target.value))
                }
                min="1"
                max="10"
                className="setting-input"
                disabled={!settings.notifications}
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Duración de toasts (segundos)</label>
                <p>Tiempo que permanecen visibles las notificaciones</p>
              </div>
              <select
                value={settings.toastDuration}
                onChange={(e) =>
                  handleChange("toastDuration", Number(e.target.value))
                }
                className="setting-select"
                disabled={!settings.notifications}
              >
                <option value={3}>3 segundos</option>
                <option value={5}>5 segundos</option>
                <option value={8}>8 segundos</option>
                <option value={10}>10 segundos</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Ventana de deduplicación (segundos)</label>
                <p>Tiempo para agrupar alertas similares y evitar spam</p>
              </div>
              <select
                value={settings.alertDeduplicationWindow}
                onChange={(e) =>
                  handleChange(
                    "alertDeduplicationWindow",
                    Number(e.target.value),
                  )
                }
                className="setting-select"
              >
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>60 segundos</option>
                <option value={120}>2 minutos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button className="save-settings-btn" onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>

        {/* Data Management */}
        <div className="settings-section danger-section">
          <div className="settings-section-header">
            <Database size={20} />
            <h3>Gestión de Datos</h3>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Limpiar datos locales</label>
                <p>Eliminar configuración guardada y caché local</p>
              </div>
              <button
                className="danger-btn"
                onClick={() => {
                  localStorage.clear();
                  alert("Datos locales eliminados");
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
