/**
 * TerminalContext - Maneja el estado global de la terminal
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { WS_TERMINAL_URL } from "../config";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

interface TerminalContextType {
  isOpen: boolean;
  isConnected: boolean;
  isMinimized: boolean;
  lines: TerminalLine[];
  currentDirectory: string;
  toggleTerminal: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  minimizeTerminal: () => void;
  maximizeTerminal: () => void;
  sendCommand: (command: string) => void;
  interrupt: () => void;
  clear: () => void;
  panelHeight: number;
  setPanelHeight: (height: number) => void;
}

const TerminalContext = createContext<TerminalContextType | null>(null);

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
}

interface TerminalProviderProps {
  children: React.ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState("~");
  const [panelHeight, setPanelHeight] = useState(300);

  const wsRef = useRef<WebSocket | null>(null);
  const lineIdRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLine = useCallback((type: TerminalLine["type"], content: string) => {
    const newLine: TerminalLine = {
      id: lineIdRef.current++,
      type,
      content,
      timestamp: new Date(),
    };
    setLines((prev) => [...prev.slice(-500), newLine]); // Mantener últimas 500 líneas
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = WS_TERMINAL_URL;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        addLine("system", "✓ Terminal conectada");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              if (data.cwd) {
                setCurrentDirectory(data.cwd);
              }
              break;
            case "output":
              if (data.data) {
                // Dividir por líneas y agregar cada una
                const outputLines = data.data.split("\n");
                outputLines.forEach((line: string, index: number) => {
                  if (line || index < outputLines.length - 1) {
                    addLine("output", line);
                  }
                });
              }
              break;
            case "error":
              addLine("error", data.message || data.data);
              break;
            case "prompt":
              if (data.cwd) {
                setCurrentDirectory(data.cwd);
              }
              break;
            case "exit":
              // Comando completado
              break;
          }
        } catch (e) {
          console.error("Error parsing terminal message:", e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        addLine("system", "⚠ Terminal desconectada");

        // Reconectar después de 3 segundos si está abierta
        if (isOpen && !isMinimized) {
          reconnectTimeoutRef.current = setTimeout(() => {
            addLine("system", "↻ Reconectando...");
            connect();
          }, 3000);
        }
      };

      wsRef.current.onerror = () => {
        addLine("error", "Error de conexión con la terminal");
      };
    } catch (error) {
      addLine("error", `Error al conectar: ${error}`);
    }
  }, [addLine, isOpen, isMinimized]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const openTerminal = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsOpen(false);
    disconnect();
  }, [disconnect]);

  const toggleTerminal = useCallback(() => {
    if (isOpen) {
      closeTerminal();
    } else {
      openTerminal();
    }
  }, [isOpen, closeTerminal, openTerminal]);

  const minimizeTerminal = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeTerminal = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const sendCommand = useCallback(
    (command: string) => {
      if (!isConnected || !wsRef.current) {
        addLine("error", "Terminal no conectada");
        return;
      }

      // Mostrar el comando en el historial
      const shortDir = currentDirectory.replace(/^\/Users\/[^/]+/, "~");
      addLine("input", `${shortDir} $ ${command}`);

      // Enviar al servidor
      wsRef.current.send(
        JSON.stringify({
          type: "command",
          command,
        }),
      );
    },
    [isConnected, currentDirectory, addLine],
  );

  const interrupt = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }));
    }
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    addLine("system", "Terminal limpiada");
  }, [addLine]);

  // Conectar cuando se abre la terminal
  useEffect(() => {
    if (isOpen && !isMinimized) {
      connect();
    }
    return () => {
      if (!isOpen) {
        disconnect();
      }
    };
  }, [isOpen, isMinimized, connect, disconnect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <TerminalContext.Provider
      value={{
        isOpen,
        isConnected,
        isMinimized,
        lines,
        currentDirectory,
        toggleTerminal,
        openTerminal,
        closeTerminal,
        minimizeTerminal,
        maximizeTerminal,
        sendCommand,
        interrupt,
        clear,
        panelHeight,
        setPanelHeight,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}
