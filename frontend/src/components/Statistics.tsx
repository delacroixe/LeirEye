import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import apiService, { StatsData } from '../services/api';
import ProcessPacketStats from './ProcessPacketStats';
import './Statistics.css';

interface StatisticsProps {
  refreshTrigger?: number;
  packets?: any[];
  processes?: any[];
}

const Statistics: React.FC<StatisticsProps> = ({ refreshTrigger = 0, packets = [], processes = [] }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [prevStats, setPrevStats] = useState<StatsData | null>(null);
  const [protocolData, setProtocolData] = useState<any[]>([]);
  const [ipsData, setIpsData] = useState<any[]>([]);
  const [portsData, setPortsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];

  const getChangeIndicator = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    const change = current - previous;
    if (change > 0) return <span className="change-up">↑ +{change}</span>;
    if (change < 0) return <span className="change-down">↓ {change}</span>;
    return null;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getStatsSummary();
        setPrevStats(stats);
        setStats(data);

        // Preparar datos de protocolos
        setProtocolData([
          { name: 'TCP', value: data.tcp },
          { name: 'UDP', value: data.udp },
          { name: 'ICMP', value: data.icmp },
          { name: 'Otros', value: data.other },
        ]);

        // Preparar datos de IPs (mezclar origen y destino)
        const ipsArray = Object.entries(data.top_src_ips || {})
          .map(([ip, count]) => ({
            name: ip,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setIpsData(ipsArray);

        // Preparar datos de puertos (ordenados por cantidad)
        const portsArray = Object.entries(data.top_ports || {})
          .map(([port, count]) => ({
            name: port,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setPortsData(portsArray);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  if (loading && !stats) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="empty-message">No hay datos de estadísticas disponibles</div>;
  }

  const totalPackets = stats.total_packets || 1;

  return (
    <div className="statistics-container">
      <h2>Estadísticas en Tiempo Real</h2>

      {/* Resumen General */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-label">Total Paquetes</div>
          <div className="stat-value">{stats.total_packets}</div>
          {getChangeIndicator(stats.total_packets, prevStats?.total_packets)}
        </div>
        <div className="stat-card tcp-card">
          <div className="stat-label">TCP</div>
          <div className="stat-value">{stats.tcp}</div>
          <div className="stat-percent">
            {((stats.tcp / totalPackets) * 100).toFixed(1)}%
          </div>
          {getChangeIndicator(stats.tcp, prevStats?.tcp)}
        </div>
        <div className="stat-card udp-card">
          <div className="stat-label">UDP</div>
          <div className="stat-value">{stats.udp}</div>
          <div className="stat-percent">
            {((stats.udp / totalPackets) * 100).toFixed(1)}%
          </div>
          {getChangeIndicator(stats.udp, prevStats?.udp)}
        </div>
        <div className="stat-card icmp-card">
          <div className="stat-label">ICMP</div>
          <div className="stat-value">{stats.icmp}</div>
          <div className="stat-percent">
            {((stats.icmp / totalPackets) * 100).toFixed(1)}%
          </div>
          {getChangeIndicator(stats.icmp, prevStats?.icmp)}
        </div>
        <div className="stat-card other-card">
          <div className="stat-label">Otros</div>
          <div className="stat-value">{stats.other}</div>
          <div className="stat-percent">
            {((stats.other / totalPackets) * 100).toFixed(1)}%
          </div>
          {getChangeIndicator(stats.other, prevStats?.other)}
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de procesos vs paquetes */}
        {(packets.length > 0 || processes.length > 0) && (
          <ProcessPacketStats packets={packets} processes={processes} />
        )}

        {/* Top IPs - Tabla */}
        <div className="chart-container full-width">
          <h3>Top 5 IPs Origen</h3>
          {ipsData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              Sin datos de IPs
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: '#cbd5e1'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(100, 200, 255, 0.3)', backgroundColor: 'rgba(10, 14, 39, 0.8)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64c8ff', fontWeight: '600' }}>IP Origen</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64c8ff', fontWeight: '600' }}>Paquetes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64c8ff', fontWeight: '600' }}>% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ipsData.map((row, idx) => (
                    <tr 
                      key={idx}
                      style={{ 
                        borderBottom: '1px solid rgba(100, 200, 255, 0.1)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(100, 200, 255, 0.03)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#0ea5e9', fontFamily: 'monospace' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500' }}>
                        {row.count}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#a0aec0' }}>
                        {((row.count / totalPackets) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Puertos */}
        <div className="chart-container full-width">
          <h3>Top 10 Puertos Destino</h3>
          {portsData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              Sin datos de puertos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={portsData} 
                layout="vertical"
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 200, 255, 0.1)" />
                <XAxis type="number" stroke="#a0aec0" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={55} 
                  stroke="#a0aec0"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => `${value} paquetes`}
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(100, 200, 255, 0.2)', borderRadius: '6px' }} 
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
};

export default Statistics;
