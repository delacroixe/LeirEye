import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './ProcessPacketStats.css';

interface ProcessPacketStat {
  name: string;
  packets: number;
  connections: number;
  pid: number;
  fullName?: string;
}

interface ProcessPacketStatsProps {
  packets: any[];
  processes: any[];
}

const ProcessPacketStats: React.FC<ProcessPacketStatsProps> = ({ packets, processes }) => {
  const [chartData, setChartData] = useState<ProcessPacketStat[]>([]);
  const [protocolData, setProtocolData] = useState<any[]>([]);

  useEffect(() => {
    // Agrupar paquetes por proceso
    const processMap = new Map<string, { packets: number; connections: number; pid: number }>();

    packets.forEach(packet => {
      const processName = packet.process_name || 'Desconocido';
      const pid = packet.pid || 0;
      
      if (!processMap.has(processName)) {
        processMap.set(processName, { packets: 0, connections: 0, pid });
      }
      
      const data = processMap.get(processName)!;
      data.packets += 1;
    });

    // Agregar conexiones de procesos
    processes.forEach(proc => {
      if (!processMap.has(proc.name)) {
        processMap.set(proc.name, { packets: 0, connections: proc.connection_count, pid: proc.pid });
      } else {
        const data = processMap.get(proc.name)!;
        data.connections = proc.connection_count;
      }
    });

    // Convertir a array y ordenar por paquetes
    const data = Array.from(processMap.entries())
      .map(([name, stats]) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        packets: stats.packets,
        connections: stats.connections,
        pid: stats.pid,
        fullName: name
      }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);

    setChartData(data);

    // Calcular protocolo
    const protocolCount = new Map<string, number>();
    packets.forEach(packet => {
      const protocol = packet.protocol || 'UNKNOWN';
      protocolCount.set(protocol, (protocolCount.get(protocol) || 0) + 1);
    });

    const protocolData = Array.from(protocolCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setProtocolData(protocolData);
  }, [packets, processes]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6'];

  if (chartData.length === 0) {
    return (
      <div className="stats-placeholder">
        <p>No hay datos de procesos y paquetes</p>
      </div>
    );
  }

  return (
    <div className="process-packet-stats">
      <h3>📊 Estadísticas de Procesos vs Paquetes</h3>

      <div className="charts-container">
        {/* Gráfico de barras - Procesos por paquetes */}
        <div className="chart-wrapper">
          <h4>Procesos más activos</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f5a" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#8892b0', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#8892b0', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1f3a',
                  border: '1px solid #2a2f5a',
                  borderRadius: '6px'
                }}
                cursor={{ fill: 'rgba(100, 200, 255, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="packets" fill="#3b82f6" name="Paquetes" />
              <Bar dataKey="connections" fill="#22c55e" name="Conexiones" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pastel - Protocolos */}
        {protocolData.length > 0 && (
          <div className="chart-wrapper">
            <h4>Distribución de protocolos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1a1f3a',
                    border: '1px solid #2a2f5a',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabla de resumen */}
      <div className="summary-table">
        <h4>Resumen por proceso</h4>
        <table>
          <thead>
            <tr>
              <th>Proceso</th>
              <th>Paquetes</th>
              <th>Conexiones</th>
              <th>% Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((proc, idx) => {
              const totalPackets = chartData.reduce((sum, p) => sum + p.packets, 0);
              const percentage = totalPackets > 0 ? ((proc.packets / totalPackets) * 100).toFixed(1) : '0';
              
              return (
                <tr key={idx}>
                  <td>
                    <span className="process-name" title={proc.fullName}>
                      {proc.name}
                    </span>
                  </td>
                  <td>{proc.packets}</td>
                  <td>{proc.connections}</td>
                  <td>
                    <span className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[idx % colors.length]
                        }}
                      />
                      <span className="percentage-text">{percentage}%</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessPacketStats;
