import {
  Bell,
  Check,
  ExternalLink,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertData, useAlerts } from "../contexts/AlertsContext";
import { explainAlert } from "../services/api";
import "./AlertToast.css";

export const AlertToast: React.FC = () => {
  const { notifications, dismissNotification, acknowledgeAlert } = useAlerts();
  const navigate = useNavigate();
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );

  const handleExplainAlert = async (alertId: string, alert: AlertData) => {
    if (explanations[alertId]) {
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
    <div className="toast-stack">
      {notifications.map((alert) => {
        const hasExplanation = explanations[alert.id];
        const isLoading = loadingExplanation === alert.id;

        return (
          <div
            key={alert.id}
            className={`toast-item glass-card ${alert.severity}`}
          >
            <div className="toast-head">
              <div className="toast-main">
                <div className="toast-icon">
                  <Bell size={20} />
                </div>
                <div className="toast-content">
                  <div className="toast-meta">
                    <span className="toast-severity">{alert.severity}</span>
                    <span className="toast-type">
                      {alert.type.replace(/_/g, " ")}
                    </span>
                    {alert.count && alert.count > 1 && (
                      <span className="toast-count">×{alert.count}</span>
                    )}
                  </div>
                  <h4 className="toast-title">{alert.title}</h4>
                  <p className="toast-desc">{alert.description.slice(0, 120)}...</p>
                </div>
              </div>

              <div className="toast-actions">
                <button
                  className="toast-btn"
                  onClick={() => navigate("/alerts")}
                  title="Ver todas las alertas"
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  className={`toast-btn ${hasExplanation ? "active" : ""}`}
                  onClick={() => handleExplainAlert(alert.id, alert)}
                  disabled={isLoading}
                  title="Consultar Inteligencia"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="spinning" />
                  ) : (
                    <HelpCircle size={14} />
                  )}
                </button>
                <button
                  className="toast-btn success"
                  onClick={() => {
                    acknowledgeAlert(alert.id);
                    dismissNotification(alert.id);
                  }}
                  title="Reconocer"
                >
                  <Check size={14} />
                </button>
                <button
                  className="toast-btn danger"
                  onClick={() => dismissNotification(alert.id)}
                  title="Descartar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {hasExplanation && (
              <div className="ai-insight">
                <span className="ai-label">🤖 Inteligencia de Nodo:</span>
                <p className="ai-text">{explanations[alert.id]}</p>
              </div>
            )}

            <div className="toast-timer" style={{ animationDuration: '10s', animationName: 'shrink', animationTimingFunction: 'linear', animationFillMode: 'forwards' }} />
          </div>
        );
      })}
    </div>
  );
};

export default AlertToast;
