import React, { useState, useEffect, useCallback, useRef } from 'react';
import CaptureControls from '../components/CaptureControls';
import PacketTable from '../components/PacketTable';
import Statistics from '../components/Statistics';
import NetworkMap from '../components/NetworkMap';
import ActivityTimeline from '../components/ActivityTimeline';
import DeviceInfo from '../components/DeviceInfo';
import { PacketData } from '../services/api';
import websocketService from '../services/websocket';
import './Dashboard.css';

interface DashboardProps {
  initialTab?: 'capture' | 'stats' | 'map' | 'system';
}

function Dashboard({ initialTab = 'capture' }: DashboardProps) {
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [refreshStats, setRefreshStats] = useState(0);
  const [activeTab, setActiveTab] = useState<'capture' | 'stats' | 'map' | 'system'>(initialTab);
  const [wsConnected, setWsConnected] = useState(false);
  const wsConnectedRef = useRef(false);

  // Cambiar tab cuando initialTab cambia
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    // Conectar WebSocket
    const connectWebSocket = async () => {
      try {
        await websocketService.connect();
        wsConnectedRef.current = true;
        setWsConnected(true);
        console.log('✓ WebSocket conectado correctamente');
      } catch (error) {
        console.error('Error conectando WebSocket:', error);
        wsConnectedRef.current = false;
        setWsConnected(false);
        // Reintentar cada 5 segundos
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Escuchar paquetes (separado para mantener listeners activos)
  useEffect(() => {
    const handlePacket = (packetData: PacketData) => {
      console.log('Nuevo paquete recibido:', packetData);
      setPackets((prev) => [packetData, ...prev.slice(0, 199)]);
    };

    const handleStatus = (statusData: any) => {
      console.log('Status actualizado:', statusData);
      setIsCapturing(statusData.is_running);
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
    };

    // Registrar listeners
    websocketService.on('packet', handlePacket);
    websocketService.on('status', handleStatus);
    websocketService.on('error', handleError);

    return () => {
      // Limpiar listeners
      websocketService.off('packet', handlePacket);
      websocketService.off('status', handleStatus);
      websocketService.off('error', handleError);
    };
  }, []);

  // Monitorear estado de WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      const isConnected = websocketService.isConnected();
      if (isConnected !== wsConnectedRef.current) {
        wsConnectedRef.current = isConnected;
        setWsConnected(isConnected);
        console.log(`WebSocket ${isConnected ? '✓ Conectado' : '✗ Desconectado'}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCaptureStart = useCallback(() => {
    setIsCapturing(true);
    setPackets([]);
    setRefreshStats((prev) => prev + 1);
  }, []);

  const handleCaptureStop = useCallback(() => {
    setIsCapturing(false);
    setRefreshStats((prev) => prev + 1);
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔍 NetMentor</h1>
          <div className="connection-status">
            <span className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {wsConnected ? 'WS Conectado' : 'WS Desconectado'}
            </span>
          </div>
        </div>
      </header>

      <section className="dashboard-content">
        {/* Controles siempre visibles */}
        <CaptureControls
          onCaptureStart={handleCaptureStart}
          onCaptureStop={handleCaptureStop}
        />

        {/* Tabs para contenido */}
        <div className="tabs-container">
          <div className="tabs-header">
            <div className="tabs-buttons">
              <button 
                className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
                onClick={() => setActiveTab('capture')}
              >
                📦 Paquetes
              </button>
              <button 
                className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                📈 Estadísticas
              </button>
              <button 
                className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                🗺️ Red
              </button>
              <button 
                className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                🖥️ Sistema
              </button>
            </div>
          </div>

          <div className="tabs-content">
            {/* Tab: Paquetes */}
            {activeTab === 'capture' && (
              <div className="tab-pane">
                <ActivityTimeline packets={packets} />
                <PacketTable packets={packets} loading={isCapturing} />
              </div>
            )}

            {/* Tab: Estadísticas */}
            {activeTab === 'stats' && (
              <div className="tab-pane">
                <Statistics refreshTrigger={refreshStats} packets={packets} processes={[]} />
              </div>
            )}

            {/* Tab: Mapa de Red */}
            {activeTab === 'map' && (
              <div className="tab-pane">
                <NetworkMap />
              </div>
            )}

            {/* Tab: Sistema */}
            {activeTab === 'system' && (
              <div className="tab-pane">
                <DeviceInfo />
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>NetMentor v2.0.0 | Aprende mientras capturas | Análisis educativo de tráfico de red</p>
      </footer>
    </div>
  );
}

export default Dashboard;
