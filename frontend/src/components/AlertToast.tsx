import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertData, useAlerts } from "../contexts/AlertsContext";
import { explainAlert } from "../services/api";
import "./AlertToast.css";

const severityIcons: Record<string, React.ElementType> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
};

const severityColors: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#2563eb",
  info: "#6b7280",
};

export const AlertToast: React.FC = () => {
  const { notifications, dismissNotification, acknowledgeAlert } = useAlerts();
  const navigate = useNavigate();
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );

  const handleExplainAlert = async (alertId: string, alert: AlertData) => {
    if (explanations[alertId]) {
      // Toggle: si ya tiene explicación, la oculta
      setExplanations((prev) => {
        const copy = { ...prev };
        delete copy[alertId];
        return copy;
      });
      return;
    }

    setLoadingExplanation(alertId);
    try {
      const explanation = await explainAlert({
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        source_ip: alert.source.src_ip,
        dest_ip: alert.source.dst_ip,
        domain: alert.source.domain,
        process_name: alert.source.process_name,
      });
      setExplanations((prev) => ({
        ...prev,
        [alertId]: explanation,
      }));
    } catch (error) {
      setExplanations((prev) => ({
        ...prev,
        [alertId]:
          "No se pudo obtener explicación. Verifica que el servicio de IA esté activo.",
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="alert-toast-container">
      {notifications.map((alert) => {
        const Icon = severityIcons[alert.severity] || Bell;
        const color = severityColors[alert.severity] || "#64c8ff";
        const hasExplanation = explanations[alert.id];
        const isLoading = loadingExplanation === alert.id;

        return (
          <div
            key={alert.id}
            className={`alert-toast alert-toast-${alert.severity} ${hasExplanation ? "expanded" : ""}`}
            style={{ "--severity-color": color } as React.CSSProperties}
          >
            <div className="toast-icon" style={{ color }}>
              <Icon size={20} />
            </div>

            <div className="toast-content">
              <div className="toast-header">
                <span className="toast-severity">
                  {alert.severity.toUpperCase()}
                </span>
                <span className="toast-type">
                  {alert.type.replace(/_/g, " ")}
                </span>
                {alert.count && alert.count > 1 && (
                  <span
                    className="toast-count"
                    title={`${alert.count} alertas similares agrupadas`}
                  >
                    ×{alert.count}
                  </span>
                )}
              </div>
              <h4 className="toast-title">{alert.title}</h4>
              <p className="toast-description">
                {alert.description.slice(0, 120)}...
              </p>

              {hasExplanation && (
                <div className="toast-explanation">
                  <span className="explanation-label">🤖 IA explica:</span>
                  <p>{explanations[alert.id]}</p>
                </div>
              )}

              {alert.source.process_name && (
                <span className="toast-process">
                  📦 {alert.source.process_name}
                </span>
              )}
            </div>

            <div className="toast-actions">
              <button
                className="toast-action view-all"
                onClick={() => navigate("/alerts")}
                title="Ver todas las alertas"
              >
                <ExternalLink size={14} />
              </button>
              <button
                className={`toast-action explain ${hasExplanation ? "active" : ""}`}
                onClick={() => handleExplainAlert(alert.id, alert)}
                disabled={isLoading}
                title="¿Por qué es importante?"
              >
                {isLoading ? (
                  <Loader2 size={14} className="spinner" />
                ) : (
                  <HelpCircle size={14} />
                )}
              </button>
              <button
                className="toast-action acknowledge"
                onClick={() => {
                  acknowledgeAlert(alert.id);
                  dismissNotification(alert.id);
                }}
                title="Reconocer"
              >
                ✓
              </button>
              <button
                className="toast-action dismiss"
                onClick={() => dismissNotification(alert.id)}
                title="Descartar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="toast-progress" />
          </div>
        );
      })}
    </div>
  );
};

export default AlertToast;
