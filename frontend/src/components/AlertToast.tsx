import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

const severityIcons: Record<string, React.ElementType> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
};

const severityColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  critical: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/30",
  },
  high: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/30",
  },
  medium: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    border: "border-yellow-500/30",
  },
  low: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/30",
  },
  info: {
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    border: "border-gray-500/30",
  },
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
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-3 max-w-md w-full">
      {notifications.map((alert) => {
        const Icon = severityIcons[alert.severity] || Bell;
        const colors = severityColors[alert.severity] || severityColors.info;
        const hasExplanation = explanations[alert.id];
        const isLoading = loadingExplanation === alert.id;

        return (
          <Card
            key={alert.id}
            className={cn(
              "relative overflow-hidden animate-in slide-in-from-right-full duration-300",
              "bg-bg-secondary border p-4",
              colors.border,
              hasExplanation && "pb-6",
            )}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={cn("shrink-0 mt-0.5", colors.text)}>
                <Icon size={20} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs uppercase font-semibold",
                      colors.text,
                      colors.border,
                    )}
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-text-secondary">
                    {alert.type.replace(/_/g, " ")}
                  </span>
                  {alert.count && alert.count > 1 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-accent/20 text-accent"
                    >
                      ×{alert.count}
                    </Badge>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-text-primary">
                  {alert.title}
                </h4>
                <p className="text-xs text-text-secondary line-clamp-2">
                  {alert.description.slice(0, 120)}...
                </p>

                {hasExplanation && (
                  <div className="mt-3 p-3 bg-accent/5 rounded-md border-l-2 border-accent">
                    <span className="text-xs font-medium text-accent">
                      🤖 IA explica:
                    </span>
                    <p className="text-xs text-text-secondary mt-1">
                      {explanations[alert.id]}
                    </p>
                  </div>
                )}

                {alert.source.process_name && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    📦 {alert.source.process_name}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-secondary hover:text-accent"
                  onClick={() => navigate("/alerts")}
                  title="Ver todas las alertas"
                >
                  <ExternalLink size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    hasExplanation
                      ? "text-accent"
                      : "text-text-secondary hover:text-accent",
                  )}
                  onClick={() => handleExplainAlert(alert.id, alert)}
                  disabled={isLoading}
                  title="¿Por qué es importante?"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <HelpCircle size={14} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                  onClick={() => {
                    acknowledgeAlert(alert.id);
                    dismissNotification(alert.id);
                  }}
                  title="Reconocer"
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-secondary hover:text-error hover:bg-error/10"
                  onClick={() => dismissNotification(alert.id)}
                  title="Descartar"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div
              className={cn(
                "absolute bottom-0 left-0 h-1 animate-[shrink_10s_linear_forwards]",
                colors.bg.replace("/10", ""),
              )}
              style={{ width: "100%" }}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default AlertToast;
