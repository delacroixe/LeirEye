import React, { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PacketData } from '../services/api';
import './ActivityTimeline.css';

interface ActivityTimelineProps {
  packets: PacketData[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ packets }) => {
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    if (packets.length === 0) {
      setTimelineData([]);
      return;
    }

    // Agrupar paquetes por segundo
    const timeline: Record<string, { tcp: number; udp: number; icmp: number; other: number }> = {};

    packets.forEach((packet) => {
      const time = new Date(packet.timestamp);
      const key = time.toLocaleTimeString();

      if (!timeline[key]) {
        timeline[key] = { tcp: 0, udp: 0, icmp: 0, other: 0 };
      }

      if (packet.protocol === 'TCP') timeline[key].tcp++;
      else if (packet.protocol === 'UDP') timeline[key].udp++;
      else if (packet.protocol === 'ICMP') timeline[key].icmp++;
      else timeline[key].other++;
    });

    // Convertir a array y ordenar
    const data = Object.entries(timeline)
      .map(([time, counts]) => ({
        time,
        total: counts.tcp + counts.udp + counts.icmp + counts.other,
        tcp: counts.tcp,
        udp: counts.udp,
        icmp: counts.icmp,
        other: counts.other,
      }))
      .slice(-30); // Últimos 30 segundos

    setTimelineData(data);
  }, [packets]);

  if (timelineData.length === 0) {
    return (
      <div className="activity-view glass-card">
        <div className="view-header">
          <h3 className="view-title">Actividad de Red</h3>
          <span className="view-status">Inactivo</span>
        </div>
        <div className="empty-state">
          <p>Estableciendo flujo de telemetría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-view glass-card">
      <div className="view-header">
        <div className="title-group">
          <h3 className="view-title">Telemetría en Tiempo Real</h3>
          <span className="view-unit">(Paquetes/Unidad de Tiempo)</span>
        </div>
        <div className="legend">
          <span className="legend-item tcp">TCP</span>
          <span className="legend-item udp">UDP</span>
          <span className="legend-item icmp">ICMP</span>
          <span className="legend-item other">Otros</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#475569"
              tick={{ fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'white'
              }}
              itemStyle={{ padding: '0px' }}
              cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="tcp"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
              name="TCP"
            />
            <Line
              type="monotone"
              dataKey="udp"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
              name="UDP"
            />
            <Line
              type="monotone"
              dataKey="icmp"
              stroke="#ef4444"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
              name="ICMP"
            />
            <Line
              type="monotone"
              dataKey="other"
              stroke="#94a3b8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#94a3b8', strokeWidth: 0 }}
              name="Otros"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityTimeline;
