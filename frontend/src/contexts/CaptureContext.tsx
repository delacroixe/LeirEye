import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import apiService, { PacketData } from "../services/api";
import websocketService from "../services/websocket";

interface CaptureState {
  isCapturing: boolean;
  packets: PacketData[];
  wsConnected: boolean;
  networkInterface: string;
  filter: string;
  maxPackets: number;
  interfaces: string[];
  loading: boolean;
  error: string | null;
}

interface CaptureContextType extends CaptureState {
  startCapture: () => Promise<void>;
  stopCapture: () => Promise<void>;
  resetCapture: () => Promise<void>;
  setNetworkInterface: (iface: string) => void;
  setFilter: (filter: string) => void;
  setMaxPackets: (max: number) => void;
  clearPackets: () => void;
}

const CaptureContext = createContext<CaptureContextType | undefined>(undefined);

export const useCaptureContext = (): CaptureContextType => {
  const context = useContext(CaptureContext);
  if (!context) {
    throw new Error("useCaptureContext debe usarse dentro de CaptureProvider");
  }
  return context;
};

interface CaptureProviderProps {
  children: ReactNode;
}

export const CaptureProvider: React.FC<CaptureProviderProps> = ({
  children,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [networkInterface, setNetworkInterface] = useState("");
  const [filter, setFilter] = useState("");
  const [maxPackets, setMaxPackets] = useState(1000);
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsConnectedRef = useRef(false);
  const startAttemptRef = useRef(false);

  // Conectar WebSocket al montar
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await websocketService.connect();
        wsConnectedRef.current = true;
        setWsConnected(true);
        console.log("✓ WebSocket conectado correctamente");
      } catch (error) {
        console.error("Error conectando WebSocket:", error);
        wsConnectedRef.current = false;
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Escuchar eventos WebSocket
  useEffect(() => {
    const handlePacket = (packetData: PacketData) => {
      setPackets((prev) => [packetData, ...prev.slice(0, 199)]);
    };

    const handleStatus = (statusData: any) => {
      setIsCapturing(statusData.is_running);
    };

    const handleError = (err: any) => {
      console.error("WebSocket error:", err);
    };

    websocketService.on("packet", handlePacket);
    websocketService.on("status", handleStatus);
    websocketService.on("error", handleError);

    return () => {
      websocketService.off("packet", handlePacket);
      websocketService.off("status", handleStatus);
      websocketService.off("error", handleError);
    };
  }, []);

  // Monitorear conexión WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      const isConnected = websocketService.isConnected();
      if (isConnected !== wsConnectedRef.current) {
        wsConnectedRef.current = isConnected;
        setWsConnected(isConnected);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sincronizar estado y cargar interfaces
  useEffect(() => {
    const init = async () => {
      try {
        const [status, availableInterfaces] = await Promise.all([
          apiService.getStatus(),
          apiService.getInterfaces(),
        ]);

        setIsCapturing(status.is_running);
        setInterfaces(availableInterfaces);

        if (availableInterfaces.length > 0) {
          setNetworkInterface((current) => current || availableInterfaces[0]);
        }
      } catch (err) {
        console.error("Error inicializando captura:", err);
      }
    };

    init();
  }, []);

  const startCapture = useCallback(async () => {
    if (startAttemptRef.current || isCapturing || loading) {
      return;
    }

    startAttemptRef.current = true;
    try {
      setLoading(true);
      setError(null);
      setPackets([]);
      await apiService.startCapture(
        networkInterface || undefined,
        filter || undefined,
        maxPackets,
      );
      setIsCapturing(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error iniciando captura");
    } finally {
      setLoading(false);
      startAttemptRef.current = false;
    }
  }, [networkInterface, filter, maxPackets, isCapturing, loading]);

  const stopCapture = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      await apiService.stopCapture();
      setIsCapturing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error deteniendo captura");
      setIsCapturing(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const resetCapture = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetch("http://localhost:8000/api/capture/reset", {
        method: "POST",
      });
      setIsCapturing(false);
      setPackets([]);
    } catch (err: any) {
      setError("Error reseteando estado");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPackets = useCallback(() => {
    setPackets([]);
  }, []);

  const value: CaptureContextType = {
    isCapturing,
    packets,
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
    clearPackets,
  };

  return (
    <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>
  );
};

export default CaptureContext;
