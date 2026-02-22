import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./ProcessPacketStats.css";

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

const ProcessPacketStats: React.FC<ProcessPacketStatsProps> = ({
  packets,
  processes,
}) => {
  const [chartData, setChartData] = useState<ProcessPacketStat[]>([]);
  const [protocolData, setProtocolData] = useState<any[]>([]);

  useEffect(() => {
    // Validar que packets y processes sean arrays antes de operar
    if (!Array.isArray(packets) || !Array.isArray(processes)) {
      console.warn("ProcessPacketStats: packets o processes no son arrays", {
        packets,
        processes,
      });
      return;
    }

    // Agrupar paquetes por proceso
    const processMap = new Map<
      string,
      { packets: number; connections: number; pid: number }
    >();

    packets.forEach((packet) => {
      const processName = packet.process_name || "Desconocido";
      const pid = packet.pid || 0;

      if (!processMap.has(processName)) {
        processMap.set(processName, { packets: 0, connections: 0, pid });
      }

      const data = processMap.get(processName)!;
      data.packets += 1;
    });

    // Agregar conexiones de procesos
    processes.forEach((proc) => {
      if (!processMap.has(proc.name)) {
        processMap.set(proc.name, {
          packets: 0,
          connections: proc.connection_count,
          pid: proc.pid,
        });
      } else {
        const data = processMap.get(proc.name)!;
        data.connections = proc.connection_count;
      }
    });

    // Convertir a array y ordenar por paquetes
    const data = Array.from(processMap.entries())
      .map(([name, stats]) => ({
        name: name,
        packets: stats.packets,
        connections: stats.connections,
        pid: stats.pid,
        fullName: name,
      }))
      .filter((item) => item.packets > 0)
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);

    setChartData(data);

    // Calcular protocolo
    const protocolCount = new Map<string, number>();
    packets.forEach((packet) => {
      const protocol = packet.protocol || "UNKNOWN";
      protocolCount.set(protocol, (protocolCount.get(protocol) || 0) + 1);
    });

    const protocolData = Array.from(protocolCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setProtocolData(protocolData);
  }, [packets, processes]);

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#06b6d4",
    "#ec4899",
    "#f97316",
    "#6366f1",
    "#14b8a6",
  ];

  if (chartData.length === 0) {
    return (
      <div className="stat-widget full-span">
        <h3 className="widget-title">Correlación Proceso/Paquete</h3>
        <div className="empty-message">
          No hay flujos de datos suficientes para establecer correlación
          estadística.
        </div>
      </div>
    );
  }

  return (
    <div className="stat-widget correlation-widget full-span">
      <div className="widget-header">
        <h3 className="widget-title">
          Análisis de Correlación: Proceso vs Tráfico
        </h3>
        <div className="header-legend">
          <span className="legend-dot packets">Paquetes</span>
          <span className="legend-dot sockets">Sockets</span>
        </div>
      </div>

      <div className="correlation-grid">
        {/* Active Processes Chart */}
        <div className="viz-block">
          <h4 className="viz-title">Impacto por Proceso (Top 10)</h4>
          <div className="viz-canvas">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#475569", fontSize: 10, fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#475569", fontSize: 10, fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                />
                <Bar
                  dataKey="packets"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="connections"
                  fill="var(--color-success)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution */}
        {protocolData.length > 0 && (
          <div className="viz-block donut-block">
            <h4 className="viz-title">Composición de Protocolos</h4>
            <div className="viz-canvas">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {protocolData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="donut-label">TOTAL</span>
                <span className="donut-val">{packets.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics List */}
      <div className="analytics-table-wrapper">
        <h4 className="viz-title">Matriz de Rendimiento por Entidad</h4>
        <table className="premium-mini-table">
          <thead>
            <tr>
              <th>Identificador de Proceso</th>
              <th className="text-right" style={{ width: "100px" }}>
                Paquetes
              </th>
              <th className="text-right" style={{ width: "100px" }}>
                Sockets
              </th>
              <th className="text-right" style={{ width: "180px" }}>
                % Tráfico
              </th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((proc, idx) => {
              const totalPackets = chartData.reduce(
                (sum, p) => sum + p.packets,
                0,
              );
              const percentage =
                totalPackets > 0
                  ? ((proc.packets / totalPackets) * 100).toFixed(1)
                  : "0";

              return (
                <tr key={idx} className="premium-mini-row">
                  <td>
                    <div className="proc-entry">
                      <span className="proc-name" title={proc.fullName}>
                        {proc.name}
                      </span>
                      <span className="proc-pid">PID: {proc.pid}</span>
                    </div>
                  </td>
                  <td className="text-right">{proc.packets}</td>
                  <td className="text-right">{proc.connections}</td>
                  <td className="text-right">
                    <div className="percentage-track">
                      <div
                        className="percentage-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[idx % colors.length],
                        }}
                      />
                      <span className="percentage-num">{percentage}%</span>
                    </div>
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
