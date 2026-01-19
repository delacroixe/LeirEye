/**
 * StatsCards - Tarjetas de resumen de protocolos
 */
import React from 'react';
import { StatsData } from '../../services/api';

interface StatsCardsProps {
  stats: StatsData;
  prevStats: StatsData | null;
}

const getChangeIndicator = (current: number, previous: number | undefined) => {
  if (!previous) return null;
  const change = current - previous;
  if (change > 0) return <span className="change-up">↑ +{change}</span>;
  if (change < 0) return <span className="change-down">↓ {change}</span>;
  return null;
};

const StatsCards: React.FC<StatsCardsProps> = ({ stats, prevStats }) => {
  const totalPackets = stats.total_packets || 1;

  return (
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
  );
};

export default StatsCards;
