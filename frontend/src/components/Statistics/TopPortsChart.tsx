/**
 * TopPortsChart - Gráfico de barras de top 10 puertos destino
 */
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
      <div className="stat-widget">
        <h3 className="widget-title">Distribución de Puertos L4</h3>
        <div className="empty-message small">
          Sin telemetría de sockets detectada
        </div>
      </div>
    );
  }

  return (
    <div className="stat-widget">
      <h3 className="widget-title">Vector de Puertos Críticos</h3>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={portsData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              stroke="#475569"
              tick={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'white'
              }}
              formatter={(value) => [`${value} Unidades`, 'Volumen']}
            />
            <Bar
              dataKey="count"
              fill="var(--color-warning)"
              radius={[0, 4, 4, 0]}
              barSize={12}
            >
              <div className="glow-bar" style={{ filter: 'blur(8px)', opacity: 0.5 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopPortsChart;
