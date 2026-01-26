/**
 * TopIPsTable - Tabla de top 5 IPs origen
 */
import React, { useMemo } from 'react';
import { StatsData } from '../../services/api';

interface TopIPsTableProps {
  stats: StatsData;
}

const TopIPsTable: React.FC<TopIPsTableProps> = ({ stats }) => {
  const ipsData = useMemo(() => {
    return Object.entries(stats.top_src_ips || {})
      .map(([ip, count]) => ({
        name: ip,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats.top_src_ips]);

  const totalPackets = stats.total_packets || 1;

  if (ipsData.length === 0) {
    return (
      <div className="stat-widget">
        <h3 className="widget-title">Top 5 IPs Origen</h3>
        <div className="empty-message small">
          Sin registros de telemetría IP
        </div>
      </div>
    );
  }

  return (
    <div className="stat-widget">
      <h3 className="widget-title">Principales Orígenes IP</h3>
      <div className="table-responsive">
        <table className="premium-mini-table">
          <thead>
            <tr>
              <th>Nodo Source</th>
              <th className="text-right">Volumen</th>
              <th className="text-right">% Tráfico</th>
            </tr>
          </thead>
          <tbody>
            {ipsData.map((row, idx) => (
              <tr key={idx} className="premium-mini-row">
                <td className="col-ip-addr">{row.name}</td>
                <td className="text-right">{row.count}</td>
                <td className="text-right col-percent">
                  {((row.count / totalPackets) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopIPsTable;
