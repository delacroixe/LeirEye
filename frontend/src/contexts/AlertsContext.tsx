import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { WS_BASE_URL } from "../config";

export interface AlertData {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source: {
    process_name?: string;
    pid?: number;
    src_ip?: string;
    dst_ip?: string;
    domain?: string;
  };
  metadata: Record<string, any>;
  acknowledged: boolean;
  count?: number; // Para alertas agrupadas
}

export interface AlertStats {
  total: number;
  unacknowledged: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  recent_24h: number;
}

interface AlertsContextType {
  // Estado
  alerts: AlertData[];
  stats: AlertStats | null;
  isConnected: boolean;
  unreadCount: number;

  // Notificaciones
  notifications: AlertData[];
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Acciones
  acknowledgeAlert: (id: string) => void;
  refreshAlerts: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertsProvider");
  }
  return context;
};

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AlertData[]>([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("netmentor_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      notifications: false,
      notificationSeverityFilter: "critical-high",
      maxToasts: 3,
      toastDuration: 5,
      alertDeduplicationWindow: 30,
    };
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const alertGroupMapRef = useRef<
    Map<string, { alert: AlertData; timer: NodeJS.Timeout }>
  >(new Map());

  // Calcular alertas no leídas
  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  // Escuchar cambios en settings
  useEffect(() => {
    const handleSettingsUpdate = (e: CustomEvent) => {
      setSettings(e.detail);
    };
    window.addEventListener(
      "settings-updated",
      handleSettingsUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "settings-updated",
        handleSettingsUpdate as EventListener,
      );
    };
  }, []);

  // Función para generar clave de agrupación
  const getAlertGroupKey = (alert: AlertData): string => {
    return `${alert.type}-${alert.severity}`;
  };

  // Función para verificar si debe mostrar toast según filtro de severidad
  const shouldShowToast = (alert: AlertData): boolean => {
    if (!settings.notifications) return false;

    const severity = alert.severity.toLowerCase();

    switch (settings.notificationSeverityFilter) {
      case "critical":
        return severity === "critical";
      case "critical-high":
        return severity === "critical" || severity === "high";
      case "all":
      default:
        return true;
    }
  };

  // Función para agregar o actualizar notificación agrupada
  const handleNotification = useCallback(
    (alert: AlertData) => {
      if (!shouldShowToast(alert)) return;

      const groupKey = getAlertGroupKey(alert);
      const existing = alertGroupMapRef.current.get(groupKey);

      if (existing) {
        // Ya existe una alerta similar, incrementar contador
        clearTimeout(existing.timer);
        const updatedAlert = {
          ...existing.alert,
          count: (existing.alert.count || 1) + 1,
          timestamp: alert.timestamp, // Actualizar timestamp al más reciente
        };

        setNotifications((prev) =>
          prev.map((n) =>
            getAlertGroupKey(n) === groupKey ? updatedAlert : n,
          ),
        );

        // Nuevo timer
        const timer = setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => getAlertGroupKey(n) !== groupKey),
          );
          alertGroupMapRef.current.delete(groupKey);
        }, settings.toastDuration * 1000);

        alertGroupMapRef.current.set(groupKey, { alert: updatedAlert, timer });
      } else {
        // Nueva alerta, agregar si hay espacio
        setNotifications((prev) => {
          const newAlert = { ...alert, count: 1 };
          const updated = [...prev, newAlert];

          // Limitar al máximo configurado
          if (updated.length > settings.maxToasts) {
            // Remover la más antigua
            const removed = updated.shift();
            if (removed) {
              const removedKey = getAlertGroupKey(removed);
              const removedEntry = alertGroupMapRef.current.get(removedKey);
              if (removedEntry) {
                clearTimeout(removedEntry.timer);
                alertGroupMapRef.current.delete(removedKey);
              }
            }
          }

          return updated;
        });

        const timer = setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => getAlertGroupKey(n) !== groupKey),
          );
          alertGroupMapRef.current.delete(groupKey);
        }, settings.toastDuration * 1000);

        alertGroupMapRef.current.set(groupKey, {
          alert: { ...alert, count: 1 },
          timer,
        });
      }
    },
    [
      settings.notifications,
      settings.notificationSeverityFilter,
      settings.maxToasts,
      settings.toastDuration,
    ],
  );

  // Conectar WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${WS_BASE_URL}/alerts/ws`;
    console.log("🔔 Conectando a WebSocket de alertas:", wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket de alertas conectado");
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "alert") {
            const alert = message.data as AlertData;

            // Agregar a la lista de alertas
            setAlerts((prev) => {
              // Evitar duplicados
              if (prev.some((a) => a.id === alert.id)) return prev;
              return [alert, ...prev].slice(0, 100); // Mantener últimas 100
            });

            // Manejar notificación con agrupación y límites
            handleNotification(alert);

            console.log("🚨 Nueva alerta:", alert.title);
          } else if (message.type === "stats") {
            setStats(message.data as AlertStats);
          } else if (message.type === "acknowledged") {
            // Marcar alerta como reconocida localmente
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === message.data.alert_id
                  ? { ...a, acknowledged: true }
                  : a,
              ),
            );
          }
        } catch (err) {
          console.error("Error procesando mensaje de alertas:", err);
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔴 WebSocket de alertas desconectado");
        setIsConnected(false);

        // Reconectar después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Intentando reconectar WebSocket de alertas...");
          connect();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error("Error en WebSocket de alertas:", error);
      };
    } catch (err) {
      console.error("Error creando WebSocket de alertas:", err);
    }
  }, []);

  // Reconocer alerta
  const acknowledgeAlert = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "acknowledge",
          alert_id: id,
        }),
      );
    }

    // Actualizar localmente de forma optimista
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
  }, []);

  // Descartar notificación
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Limpiar todas las notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Refrescar alertas (solicitar stats)
  const refreshAlerts = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "stats" }));
    }
  }, []);

  // Conectar al montar
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Limpiar timers de notificaciones
      alertGroupMapRef.current.forEach((entry) => {
        clearTimeout(entry.timer);
      });
      alertGroupMapRef.current.clear();
    };
  }, [connect, handleNotification]);

  const value: AlertsContextType = {
    alerts,
    stats,
    isConnected,
    unreadCount,
    notifications,
    dismissNotification,
    clearNotifications,
    acknowledgeAlert,
    refreshAlerts,
  };

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
};

export default AlertsContext;
