import React, { useState, useEffect, useCallback } from 'react';
import { useSync } from '../context/SyncContext';
import './DeviceInfo.css';

// ==================== INTERFACES ====================

interface SystemInfo {
  hostname: string;
  os: string;
  os_version: string;
  architecture: string;
  cpu_count: number;
  cpu_percent: number;
  memory_total_gb: number;
  memory_used_gb: number;
  memory_percent: number;
  disk_total_gb: number;
  disk_used_gb: number;
  disk_percent: number;
  uptime_hours: number;
}

interface NetworkInterface {
  name: string;
  ipv4: string | null;
  ipv6: string | null;
  mac: string | null;
  is_up: boolean;
  speed: number | null;
}

interface Geolocation {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
}

interface DeviceInfoData {
  system: SystemInfo;
  private_ip: string;
  public_ip: string | null;
  geolocation: Geolocation | null;
  interfaces: NetworkInterface[];
  gateway: string | null;
  dns_servers: string[];
}

interface NetworkConnection {
  local_ip: string;
  local_port: number;
  remote_ip: string | null;
  remote_port: number | null;
  status: string;
  protocol: string;
  pid: number | null;
  process_name: string | null;
  process_user: string | null;
  process_cpu: number | null;
  process_memory_mb: number | null;
}

interface ProcessWithConnections {
  pid: number;
  name: string;
  user: string | null;
  cpu_percent: number;
  memory_mb: number;
  executable: string | null;
  connection_count: number;
  connections: NetworkConnection[];
}

// ==================== COMPONENTE PRINCIPAL ====================

const DeviceInfo: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoData | null>(null);
  const [processes, setProcesses] = useState<ProcessWithConnections[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedPids, setExpandedPids] = useState<Set<number>>(new Set());
  const [activeSection, setActiveSection] = useState<'device' | 'processes'>('device');
  const { setActiveProcessPid } = useSync();

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, procRes] = await Promise.all([
        fetch('http://localhost:8000/api/system/info'),
        fetch('http://localhost:8000/api/system/processes-with-connections')
      ]);
      
      if (!infoRes.ok) {
        const errorData = await infoRes.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(errorData.detail || `Error ${infoRes.status}`);
      }
      
      const infoData = await infoRes.json();
      const procData = await procRes.json();
      
      setDeviceInfo(infoData);
      setProcesses(procData);
      setError(null);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Error cargando datos del sistema');
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const toggleExpand = (pid: number) => {
    setExpandedPids(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
        setActiveProcessPid(null);
      } else {
        next.add(pid);
        setActiveProcessPid(pid);
      }
      return next;
    });
  };

  const formatUptime = (hours: number): string => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ESTABLISHED': return '#22c55e';
      case 'TIME_WAIT': return '#eab308';
      case 'CLOSE_WAIT': return '#f97316';
      case 'LISTEN': return '#3b82f6';
      default: return '#64c8ff';
    }
  };

  const getUsageColor = (percent: number): string => {
    if (percent < 50) return '#22c55e';
    if (percent < 80) return '#eab308';
    return '#ef4444';
  };

  if (loading && !deviceInfo) {
    return (
      <div className="device-info-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del sistema...</p>
      </div>
    );
  }

  if (error && !deviceInfo) {
    return (
      <div className="device-info-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="device-info-container">
      {/* Header con controles */}
      <div className="device-info-header">
        <div className="section-tabs">
          <button 
            className={`section-tab ${activeSection === 'device' ? 'active' : ''}`}
            onClick={() => setActiveSection('device')}
          >
            🖥️ Dispositivo
          </button>
          <button 
            className={`section-tab ${activeSection === 'processes' ? 'active' : ''}`}
            onClick={() => setActiveSection('processes')}
          >
            📡 Procesos ({processes.length})
          </button>
        </div>
        
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            <span>Auto-refresh</span>
          </label>
          <button onClick={fetchData} className="refresh-btn" title="Actualizar ahora">
            🔄
          </button>
          {lastUpdate && (
            <span className="last-update">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Contenido según sección activa */}
      <div className="device-info-content">
        {activeSection === 'device' && deviceInfo && (
          <div className="device-section">
            {/* Sistema */}
            <div className="info-card system-card">
              <h3>💻 Sistema</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Hostname</label>
                  <span className="value hostname">{deviceInfo.system.hostname}</span>
                </div>
                <div className="info-item">
                  <label>OS</label>
                  <span className="value">{deviceInfo.system.os} {deviceInfo.system.os_version}</span>
                </div>
                <div className="info-item">
                  <label>Arquitectura</label>
                  <span className="value">{deviceInfo.system.architecture}</span>
                </div>
                <div className="info-item">
                  <label>Uptime</label>
                  <span className="value">{formatUptime(deviceInfo.system.uptime_hours)}</span>
                </div>
              </div>

              {/* Métricas de recursos */}
              <div className="resource-meters">
                <div className="meter">
                  <label>CPU ({deviceInfo.system.cpu_count} cores)</label>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill" 
                      style={{ 
                        width: `${deviceInfo.system.cpu_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.cpu_percent)
                      }}
                    />
                  </div>
                  <span className="meter-value">{deviceInfo.system.cpu_percent.toFixed(1)}%</span>
                </div>
                
                <div className="meter">
                  <label>RAM ({deviceInfo.system.memory_used_gb}/{deviceInfo.system.memory_total_gb} GB)</label>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill" 
                      style={{ 
                        width: `${deviceInfo.system.memory_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.memory_percent)
                      }}
                    />
                  </div>
                  <span className="meter-value">{deviceInfo.system.memory_percent.toFixed(1)}%</span>
                </div>
                
                <div className="meter">
                  <label>Disco ({deviceInfo.system.disk_used_gb}/{deviceInfo.system.disk_total_gb} GB)</label>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill" 
                      style={{ 
                        width: `${deviceInfo.system.disk_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.disk_percent)
                      }}
                    />
                  </div>
                  <span className="meter-value">{deviceInfo.system.disk_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Red */}
            <div className="info-card network-card">
              <h3>🌐 Red</h3>
              <div className="info-grid network-grid">
                <div className="info-item highlight">
                  <label>IP Privada</label>
                  <span className="value ip">{deviceInfo.private_ip}</span>
                </div>
                <div className="info-item highlight">
                  <label>IP Pública</label>
                  <span className="value ip">{deviceInfo.public_ip || 'No disponible'}</span>
                </div>
                <div className="info-item">
                  <label>Gateway</label>
                  <span className="value">{deviceInfo.gateway || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>DNS</label>
                  <span className="value dns">{deviceInfo.dns_servers.join(', ') || 'N/A'}</span>
                </div>
              </div>

              {deviceInfo.geolocation && (
                <div className="geo-info">
                  <span className="geo-badge">📍 {deviceInfo.geolocation.city}, {deviceInfo.geolocation.region}</span>
                  <span className="geo-detail">{deviceInfo.geolocation.country}</span>
                  <span className="geo-isp" title={deviceInfo.geolocation.org}>
                    ISP: {deviceInfo.geolocation.isp}
                  </span>
                </div>
              )}
            </div>

            {/* Interfaces */}
            <div className="info-card interfaces-card">
              <h3>🔌 Interfaces de Red</h3>
              <div className="interfaces-list">
                {deviceInfo.interfaces.filter(i => i.is_up || i.ipv4).map((iface, idx) => (
                  <div key={idx} className={`interface-item ${iface.is_up ? 'active' : 'inactive'}`}>
                    <div className="interface-header">
                      <span className={`status-dot ${iface.is_up ? 'up' : 'down'}`}></span>
                      <span className="interface-name">{iface.name}</span>
                      {iface.speed && <span className="interface-speed">{iface.speed} Mbps</span>}
                    </div>
                    <div className="interface-details">
                      {iface.ipv4 && <span className="interface-ip">IPv4: {iface.ipv4}</span>}
                      {iface.mac && <span className="interface-mac">MAC: {iface.mac}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'processes' && (
          <div className="processes-section">
            {processes.length === 0 ? (
              <div className="no-processes">
                <p>No hay procesos con conexiones de red activas.</p>
                <p className="hint">💡 Ejecutar el backend con <code>sudo</code> para ver todos los procesos.</p>
              </div>
            ) : (
              <div className="processes-list">
                {processes.map(proc => (
                  <div key={proc.pid} className="process-card">
                    <div 
                      className="process-header"
                      onClick={() => toggleExpand(proc.pid)}
                    >
                      <span className="expand-icon">
                        {expandedPids.has(proc.pid) ? '▼' : '▶'}
                      </span>
                      <span className="process-name">{proc.name}</span>
                      <span className="process-pid">PID: {proc.pid}</span>
                      <span className="connection-badge">{proc.connection_count} conexiones</span>
                      <div className="process-stats">
                        <span className="stat cpu">
                          CPU: <strong>{proc.cpu_percent.toFixed(1)}%</strong>
                        </span>
                        <span className="stat memory">
                          RAM: <strong>{proc.memory_mb.toFixed(1)} MB</strong>
                        </span>
                      </div>
                    </div>
                    
                    {expandedPids.has(proc.pid) && (
                      <div className="process-connections">
                        <table className="connections-table">
                          <thead>
                            <tr>
                              <th>Protocolo</th>
                              <th>Local</th>
                              <th>Remoto</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proc.connections.map((conn, idx) => (
                              <tr key={idx}>
                                <td>
                                  <span className={`protocol-badge ${conn.protocol.toLowerCase()}`}>
                                    {conn.protocol}
                                  </span>
                                </td>
                                <td className="connection-addr">
                                  {conn.local_ip}:{conn.local_port}
                                </td>
                                <td className="connection-addr">
                                  {conn.remote_ip}:{conn.remote_port}
                                </td>
                                <td>
                                  <span 
                                    className="status-badge"
                                    style={{ color: getStatusColor(conn.status) }}
                                  >
                                    {conn.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {proc.executable && (
                          <div className="process-executable">
                            <span className="exe-label">Ejecutable:</span>
                            <code>{proc.executable}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceInfo;
