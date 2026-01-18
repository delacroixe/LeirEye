import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NetworkStats {
  tcp_connections: number;
  udp_connections: number;
  unique_processes: number;
  active_connections: number;
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
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProcessPid, setActiveProcessPid] = useState<number | null>(null);
  const [activeConnection, setActiveConnection] = useState<{ ip: string; port: number } | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [highlightedPacketPid, setHighlightedPacketPid] = useState<number | null>(null);

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
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync debe ser usado dentro de SyncProvider');
  }
  return context;
};
