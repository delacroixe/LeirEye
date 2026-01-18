import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      <div className="activity-timeline">
        <h3>Actividad en Tiempo Real</h3>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          Sin datos de actividad
        </div>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      <h3>Actividad en Tiempo Real (Paquetes/Segundo)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 200, 255, 0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="#a0aec0" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#a0aec0" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1f3a', 
              border: '1px solid rgba(100, 200, 255, 0.2)', 
              borderRadius: '6px' 
            }}
            formatter={(value) => `${value} paquetes`}
          />
          <Line 
            type="monotone" 
            dataKey="tcp" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="TCP"
          />
          <Line 
            type="monotone" 
            dataKey="udp" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            name="UDP"
          />
          <Line 
            type="monotone" 
            dataKey="icmp" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name="ICMP"
          />
          <Line 
            type="monotone" 
            dataKey="other" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={false}
            name="Otros"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityTimeline;
