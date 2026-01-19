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
      <div className="chart-container full-width">
        <h3>Top 5 IPs Origen</h3>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          Sin datos de IPs
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container full-width">
      <h3>Top 5 IPs Origen</h3>
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
    </div>
  );
};

export default TopIPsTable;
