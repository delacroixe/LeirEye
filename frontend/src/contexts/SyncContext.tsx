import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface NetworkStats {
  tcp_connections: number;
  udp_connections: number;
  unique_processes: number;
  active_connections: number;
}

// Filtro global que se puede aplicar a múltiples vistas
interface GlobalFilter {
  type: "ip" | "domain" | "process" | "protocol" | "port" | "dns_query";
  value: string;
  label: string;
}

// Navegación cruzada entre páginas
interface CrossNavigation {
  from: string; // Página de origen
  to: string; // Página destino
  filter?: GlobalFilter;
  timestamp: number;
}

// Elemento resaltado globalmente
interface HighlightedElement {
  type: "ip" | "domain" | "process" | "packet" | "alert";
  id: string;
  source: string; // Qué vista originó el resaltado
}

interface SyncContextType {
  // Estado de sincronización entre pestañas
  activeProcessPid: number | null;
  setActiveProcessPid: (pid: number | null) => void;

  activeConnection: { ip: string; port: number } | null;
  setActiveConnection: (conn: { ip: string; port: number } | null) => void;

  networkStats: NetworkStats | null;
  setNetworkStats: (stats: NetworkStats) => void;

  highlightedPacketPid: number | null;
  setHighlightedPacketPid: (pid: number | null) => void;

  // Nuevas funciones de sincronización global

  // Filtro global
  globalFilter: GlobalFilter | null;
  setGlobalFilter: (filter: GlobalFilter | null) => void;
  applyFilter: (
    type: GlobalFilter["type"],
    value: string,
    label?: string,
  ) => void;
  clearFilter: () => void;

  // Elemento resaltado
  highlightedElement: HighlightedElement | null;
  highlightElement: (
    type: HighlightedElement["type"],
    id: string,
    source: string,
  ) => void;
  clearHighlight: () => void;
  isHighlighted: (type: HighlightedElement["type"], id: string) => boolean;

  // Navegación cruzada
  crossNavigation: CrossNavigation | null;
  navigateTo: (to: string, from: string, filter?: GlobalFilter) => void;
  clearCrossNavigation: () => void;

  // IP/Dominio seleccionado para resaltar en múltiples vistas
  selectedIP: string | null;
  setSelectedIP: (ip: string | null) => void;

  selectedDomain: string | null;
  setSelectedDomain: (domain: string | null) => void;

  // DNS Query ID para cruzar con captura
  selectedDnsQueryId: string | null;
  setSelectedDnsQueryId: (queryId: string | null) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeProcessPid, setActiveProcessPid] = useState<number | null>(null);
  const [activeConnection, setActiveConnection] = useState<{
    ip: string;
    port: number;
  } | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [highlightedPacketPid, setHighlightedPacketPid] = useState<
    number | null
  >(null);

  // Nuevos estados
  const [globalFilter, setGlobalFilter] = useState<GlobalFilter | null>(null);
  const [highlightedElement, setHighlightedElement] =
    useState<HighlightedElement | null>(null);
  const [crossNavigation, setCrossNavigation] =
    useState<CrossNavigation | null>(null);
  const [selectedIP, setSelectedIP] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedDnsQueryId, setSelectedDnsQueryId] = useState<string | null>(
    null,
  );

  // Funciones de filtro global
  const applyFilter = useCallback(
    (type: GlobalFilter["type"], value: string, label?: string) => {
      setGlobalFilter({
        type,
        value,
        label: label || `${type}: ${value}`,
      });
    },
    [],
  );

  const clearFilter = useCallback(() => {
    setGlobalFilter(null);
  }, []);

  // Funciones de resaltado
  const highlightElement = useCallback(
    (type: HighlightedElement["type"], id: string, source: string) => {
      setHighlightedElement({ type, id, source });

      // Auto-limpiar después de 5 segundos
      setTimeout(() => {
        setHighlightedElement(null);
      }, 5000);
    },
    [],
  );

  const clearHighlight = useCallback(() => {
    setHighlightedElement(null);
  }, []);

  const isHighlighted = useCallback(
    (type: HighlightedElement["type"], id: string) => {
      return highlightedElement?.type === type && highlightedElement?.id === id;
    },
    [highlightedElement],
  );

  // Funciones de navegación cruzada
  const navigateTo = useCallback(
    (to: string, from: string, filter?: GlobalFilter) => {
      setCrossNavigation({
        from,
        to,
        filter,
        timestamp: Date.now(),
      });
      if (filter) {
        setGlobalFilter(filter);
      }
    },
    [],
  );

  const clearCrossNavigation = useCallback(() => {
    setCrossNavigation(null);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        activeProcessPid,
        setActiveProcessPid,
        activeConnection,
        setActiveConnection,
        networkStats,
        setNetworkStats,
        highlightedPacketPid,
        setHighlightedPacketPid,

        // Nuevas propiedades
        globalFilter,
        setGlobalFilter,
        applyFilter,
        clearFilter,

        highlightedElement,
        highlightElement,
        clearHighlight,
        isHighlighted,

        crossNavigation,
        navigateTo,
        clearCrossNavigation,

        selectedIP,
        setSelectedIP,
        selectedDomain,
        setSelectedDomain,
        selectedDnsQueryId,
        setSelectedDnsQueryId,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync debe ser usado dentro de SyncProvider");
  }
  return context;
};
