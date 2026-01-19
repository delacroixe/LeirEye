/**
 * TopPortsChart - Gráfico de barras de top 10 puertos destino
 */
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsData } from '../../services/api';

interface TopPortsChartProps {
  stats: StatsData;
}

const TopPortsChart: React.FC<TopPortsChartProps> = ({ stats }) => {
  const portsData = useMemo(() => {
    return Object.entries(stats.top_ports || {})
      .map(([port, count]) => ({
        name: port,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats.top_ports]);

  if (portsData.length === 0) {
    return (
      <div className="chart-container full-width">
        <h3>Top 10 Puertos Destino</h3>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          Sin datos de puertos
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container full-width">
      <h3>Top 10 Puertos Destino</h3>
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
    </div>
  );
};

export default TopPortsChart;
