import React, { useCallback, useEffect, useState } from 'react';
import { useSync } from '../contexts/SyncContext';
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
    <div className="system-monitor">
      {/* Tab Navigation */}
      <div className="monitor-tabs">
        <button
          className={`tab-btn ${activeSection === 'device' ? 'active' : ''}`}
          onClick={() => setActiveSection('device')}
        >
          <span className="tab-icon">🖥️</span>
          <span className="tab-label">Hardware & Red</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveSection('processes')}
        >
          <span className="tab-icon">📡</span>
          <span className="tab-label">Procesos Activos ({processes.length})</span>
        </button>

        <div className="tab-actions">
          <label className="sync-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-label">Auto-Sinc</span>
          </label>
          <button onClick={fetchData} className="action-circle" title="Refrescar manual">
            🔄
          </button>
          {lastUpdate && (
            <span className="timestamp">
              SYNC: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="monitor-viewport">
        {activeSection === 'device' && deviceInfo && (
          <div className="hardware-grid">
            {/* System Specs */}
            <div className="hardware-panel glass-card">
              <div className="panel-header">
                <h3 className="panel-title">Especificaciones del Sistema</h3>
              </div>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Hostname</span>
                  <span className="spec-value highlight">{deviceInfo.system.hostname}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Kernel / OS</span>
                  <span className="spec-value">{deviceInfo.system.os} {deviceInfo.system.os_version}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Arquitectura</span>
                  <span className="spec-value">{deviceInfo.system.architecture}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Tiempo de Actividad</span>
                  <span className="spec-value">{formatUptime(deviceInfo.system.uptime_hours)}</span>
                </div>
              </div>

              {/* Real-time Load */}
              <div className="load-meters">
                <div className="load-meter">
                  <div className="meter-info">
                    <span className="meter-label">CPU ({deviceInfo.system.cpu_count} Núcleos)</span>
                    <span className="meter-val">{deviceInfo.system.cpu_percent.toFixed(1)}%</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${deviceInfo.system.cpu_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.cpu_percent)
                      }}
                    />
                  </div>
                </div>

                <div className="load-meter">
                  <div className="meter-info">
                    <span className="meter-label">Memoria ({deviceInfo.system.memory_used_gb.toFixed(1)} / {deviceInfo.system.memory_total_gb.toFixed(1)} GB)</span>
                    <span className="meter-val">{deviceInfo.system.memory_percent.toFixed(1)}%</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${deviceInfo.system.memory_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.memory_percent)
                      }}
                    />
                  </div>
                </div>

                <div className="load-meter">
                  <div className="meter-info">
                    <span className="meter-label">Disco Principal</span>
                    <span className="meter-val">{deviceInfo.system.disk_percent.toFixed(1)}%</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${deviceInfo.system.disk_percent}%`,
                        backgroundColor: getUsageColor(deviceInfo.system.disk_percent)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Network Stack */}
            <div className="hardware-panel glass-card">
              <div className="panel-header">
                <h3 className="panel-title">Stack de Conectividad</h3>
              </div>
              <div className="network-summary">
                <div className="network-box primary">
                  <span className="box-label">IPv4 Privada</span>
                  <span className="box-value">{deviceInfo.private_ip}</span>
                </div>
                <div className="network-box warning">
                  <span className="box-label">IPv4 Pública</span>
                  <span className="box-value">{deviceInfo.public_ip || 'No detectada'}</span>
                </div>
                <div className="network-box secondary">
                  <span className="box-label">Puerta de Enlace</span>
                  <span className="box-value">{deviceInfo.gateway || '—'}</span>
                </div>
              </div>

              {deviceInfo.geolocation && (
                <div className="geolocation-panel glass-card">
                  <div className="geo-header">
                    <span className="geo-icon">📍</span>
                    <span className="geo-title">Geolocalización de Red</span>
                  </div>
                  <div className="geo-data">
                    <p className="geo-location">{deviceInfo.geolocation.city}, {deviceInfo.geolocation.region}, {deviceInfo.geolocation.country}</p>
                    <p className="geo-provider">Proveedor: {deviceInfo.geolocation.isp}</p>
                  </div>
                </div>
              )}

              <div className="interfaces-section">
                <span className="section-subtitle">Interfaces Activas</span>
                <div className="interfaces-grid">
                  {deviceInfo.interfaces.filter(i => i.is_up || i.ipv4).map((iface, idx) => (
                    <div key={idx} className={`iface-mini-card ${iface.is_up ? 'active' : ''}`}>
                      <div className="iface-head">
                        <span className="iface-status"></span>
                        <span className="iface-name">{iface.name}</span>
                      </div>
                      <div className="iface-body">
                        <span>{iface.ipv4 || 'Sin IP'}</span>
                        <span className="mac">{iface.mac || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'processes' && (
          <div className="processes-viewport">
            {processes.length === 0 ? (
              <div className="empty-viewport glass-card">
                <p>No se han detectado procesos con sockets de red abiertos.</p>
                <div className="hint-block">
                  <span className="hint-icon">💡</span>
                  <p>Inicie el servicio con privilegios de administrador para ver la tabla completa de procesos del kernel.</p>
                </div>
              </div>
            ) : (
              <div className="processes-table-view">
                {processes.map(proc => (
                  <div key={proc.pid} className={`process-entry glass-card ${expandedPids.has(proc.pid) ? 'expanded' : ''}`}>
                    <div
                      className="entry-header"
                      onClick={() => toggleExpand(proc.pid)}
                    >
                      <div className="entry-main">
                        <span className="entry-arrow">
                          {expandedPids.has(proc.pid) ? '−' : '+'}
                        </span>
                        <span className="entry-name">{proc.name}</span>
                        <span className="entry-pid">PID: {proc.pid}</span>
                      </div>

                      <div className="entry-metrics">
                        <div className="metric">
                          <span className="m-label">CPU</span>
                          <span className="m-val">{proc.cpu_percent.toFixed(1)}%</span>
                        </div>
                        <div className="metric">
                          <span className="m-label">RAM</span>
                          <span className="m-val">{proc.memory_mb.toFixed(0)}MB</span>
                        </div>
                        <span className="conn-count">{proc.connection_count} Sockets</span>
                      </div>
                    </div>

                    {expandedPids.has(proc.pid) && (
                      <div className="entry-details">
                        <div className="connections-grid">
                          <div className="table-wrapper">
                            <table className="mini-table">
                              <thead>
                                <tr>
                                  <th>Protocolo</th>
                                  <th>Local Endpoint</th>
                                  <th>Remote Endpoint</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proc.connections.map((conn, idx) => (
                                  <tr key={idx}>
                                    <td><span className={`proto-tag ${conn.protocol.toLowerCase()}`}>{conn.protocol}</span></td>
                                    <td>{conn.local_ip}:{conn.local_port}</td>
                                    <td className="remote-addr">{conn.remote_ip || '—'}:{conn.remote_port || '—'}</td>
                                    <td>
                                      <span
                                        className="status-chip"
                                        style={{ color: getStatusColor(conn.status) }}
                                      >
                                        {conn.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {proc.executable && (
                          <div className="binary-path">
                            <span className="path-label">Binary Path:</span>
                            <code className="path-value">{proc.executable}</code>
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
