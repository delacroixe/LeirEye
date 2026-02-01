/**
 * ChatContext - Contexto global para el chat con IA
 *
 * Proporciona:
 * - Estado de mensajes y streaming
 * - Función para enviar mensajes con contexto de página
 * - Hook usePageContext para extraer datos de la página actual
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  ChatMessage,
  PageContext,
  sendChatMessage,
} from "../services/chatService";
import { useAI } from "./AIContext";
import { useAlerts } from "./AlertsContext";
import { useCaptureContext } from "./CaptureContext";

// ============ Tipos ============

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  panelWidth: number;
}

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  openChat: () => void;
  clearHistory: () => void;
  cancelStream: () => void;
  setPanelWidth: (width: number) => void;
  pageContext: PageContext;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============ Configuración de páginas ============

const PAGE_CONFIG: Record<string, { name: string; description: string }> = {
  "/capture": {
    name: "Captura de Paquetes",
    description: "Monitor de tráfico de red en tiempo real",
  },
  "/statistics": {
    name: "Estadísticas",
    description: "Análisis estadístico del tráfico de red",
  },
  "/network-map": {
    name: "Mapa de Red",
    description: "Visualización de conexiones y topología",
  },
  "/alerts": {
    name: "Alertas",
    description: "Centro de alertas de seguridad",
  },
  "/dns": {
    name: "DNS Monitor",
    description: "Análisis de consultas DNS",
  },
  "/wifi": {
    name: "WiFi Analyzer",
    description: "Análisis del entorno WiFi",
  },
  "/packet-builder": {
    name: "Packet Builder",
    description: "Constructor de paquetes de red",
  },
  "/system": {
    name: "Sistema",
    description: "Información del sistema y procesos",
  },
  "/settings": {
    name: "Configuración",
    description: "Ajustes de la aplicación",
  },
  "/profile": {
    name: "Perfil",
    description: "Perfil del usuario",
  },
};

// ============ Hook usePageContext ============

function usePageContext(): PageContext {
  const location = useLocation();
  const { packets, isCapturing } = useCaptureContext();
  const { alerts, stats: alertStats } = useAlerts();

  const pageId = location.pathname.replace("/", "") || "capture";
  const config = PAGE_CONFIG[location.pathname] || {
    name: "Página",
    description: "",
  };

  // Construir resumen según la página
  let summary = "";
  let data: Record<string, unknown> = {};

  switch (location.pathname) {
    case "/capture":
      summary = `${isCapturing ? "Capturando" : "Detenido"}. ${packets.length} paquetes capturados.`;

      // Resumen de protocolos
      const protocols: Record<string, number> = {};
      const topIps: Record<string, number> = {};

      packets.slice(0, 100).forEach((p) => {
        protocols[p.protocol] = (protocols[p.protocol] || 0) + 1;
        topIps[p.dst_ip] = (topIps[p.dst_ip] || 0) + 1;
      });

      data = {
        isCapturing,
        packetCount: packets.length,
        protocols,
        topDestinations: Object.entries(topIps)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ip, count]) => ({ ip, count })),
        recentPackets: packets.slice(0, 10).map((p) => ({
          protocol: p.protocol,
          src: p.src_ip,
          dst: p.dst_ip,
          port: p.dst_port,
          process: p.process_name,
        })),
      };
      break;

    case "/alerts":
      const critical = alerts.filter((a) => a.severity === "critical").length;
      const high = alerts.filter((a) => a.severity === "high").length;
      summary = `${alerts.length} alertas. ${critical} críticas, ${high} altas.`;

      data = {
        totalAlerts: alerts.length,
        stats: alertStats,
        recentAlerts: alerts.slice(0, 10).map((a) => ({
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          acknowledged: a.acknowledged,
        })),
        unacknowledged: alerts.filter((a) => !a.acknowledged).length,
      };
      break;

    case "/statistics":
      summary = `Estadísticas basadas en ${packets.length} paquetes.`;
      // Cálculos básicos para estadísticas
      const protoStats: Record<string, number> = {};
      packets.forEach((p) => {
        protoStats[p.protocol] = (protoStats[p.protocol] || 0) + 1;
      });

      data = {
        totalPackets: packets.length,
        protocolDistribution: protoStats,
      };
      break;

    case "/network-map":
      summary = "Visualizando topología de red.";
      // Extraer IPs únicas
      const uniqueIps = new Set<string>();
      packets.forEach((p) => {
        uniqueIps.add(p.src_ip);
        uniqueIps.add(p.dst_ip);
      });

      data = {
        uniqueNodes: uniqueIps.size,
        connectionCount: packets.length,
      };
      break;

    case "/dns":
      const dnsPackets = packets.filter((p) => p.dns_domain);
      summary = `${dnsPackets.length} consultas DNS registradas.`;

      data = {
        dnsQueryCount: dnsPackets.length,
        recentQueries: dnsPackets.slice(0, 10).map((p) => ({
          domain: p.dns_domain,
          src: p.src_ip,
        })),
      };
      break;

    case "/wifi":
      summary = "Análisis del entorno WiFi.";
      data = { available: true };
      break;

    case "/packet-builder":
      summary = "Constructor de paquetes personalizado.";
      data = { mode: "builder" };
      break;

    case "/system":
      summary = "Información del sistema y procesos activos.";
      // Extraer procesos únicos de los paquetes
      const processes = new Set<string>();
      packets.forEach((p) => {
        if (p.process_name) processes.add(p.process_name);
      });

      data = {
        activeProcesses: Array.from(processes).slice(0, 20),
      };
      break;

    default:
      summary = config.description;
      data = {};
  }

  return {
    pageId,
    pageName: config.name,
    summary,
    data,
  };
}

// ============ Provider ============

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [panelWidth, setPanelWidthState] = useState(() => {
    const saved = localStorage.getItem("chat_panel_width");
    return saved ? parseInt(saved, 10) : 380;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef("");
  const pageContext = usePageContext();
  const { status: aiStatus } = useAI();

  const setPanelWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(300, Math.min(600, width));
    setPanelWidthState(clampedWidth);
    localStorage.setItem("chat_panel_width", String(clampedWidth));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Verificar disponibilidad de IA
      if (!aiStatus?.available) {
        setError(
          "El servicio de IA no está disponible. Verifica que Ollama esté ejecutándose.",
        );
        return;
      }

      setError(null);

      // Agregar mensaje del usuario
      const userMessage: ChatMessage = {
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Iniciar streaming
      setIsStreaming(true);
      setStreamingContent("");
      streamingContentRef.current = "";

      abortControllerRef.current = new AbortController();

      await sendChatMessage(
        {
          message: content,
          context: pageContext,
          history: messages.slice(-10), // Últimos 10 mensajes
        },
        // onChunk
        (chunk) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
        },
        // onComplete
        () => {
          const finalContent = streamingContentRef.current;
          if (finalContent) {
            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: finalContent,
              timestamp: new Date(),
            };
            setMessages((msgs) => [...msgs, assistantMessage]);
          }
          setStreamingContent("");
          streamingContentRef.current = "";
          setIsStreaming(false);
        },
        // onError
        (err) => {
          setError(err.message);
          setIsStreaming(false);
          setStreamingContent("");
        },
        abortControllerRef.current.signal,
      );
    },
    [isStreaming, pageContext, messages, aiStatus],
  );

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isStreaming,
        streamingContent,
        error,
        panelWidth,
        sendMessage,
        toggleChat,
        closeChat,
        openChat,
        clearHistory,
        cancelStream,
        setPanelWidth,
        pageContext,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ============ Hook ============

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
