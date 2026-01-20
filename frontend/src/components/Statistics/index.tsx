/**
 * Statistics - Componente principal refactorizado
 * 
 * Muestra estadísticas en tiempo real del tráfico de red:
 * - Resumen general de protocolos
 * - Top IPs origen
 * - Top puertos destino
 * - Estadísticas de procesos
 */
import React, { useEffect, useState } from 'react';
import apiService, { StatsData } from '../../services/api';
import StatsCards from './StatsCards';
import TopIPsTable from './TopIPsTable';
import TopPortsChart from './TopPortsChart';
import ProcessPacketStats from '../ProcessPacketStats';
import './Statistics.css';

interface StatisticsProps {
  refreshTrigger?: number;
  packets?: any[];
  processes?: any[];
}

const Statistics: React.FC<StatisticsProps> = ({ refreshTrigger = 0, packets = [], processes = [] }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [prevStats, setPrevStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getStatsSummary();
        setPrevStats(stats);
        setStats(data);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [refreshTrigger, stats]);

  if (loading && !stats) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="empty-message">No hay datos de estadísticas disponibles</div>;
  }

  return (
    <div className="statistics-container">
      <h2>Estadísticas en Tiempo Real</h2>

      <StatsCards stats={stats} prevStats={prevStats} />

      <div className="charts-grid">
        {(packets.length > 0 || processes.length > 0) && (
          <ProcessPacketStats packets={packets} processes={processes} />
        )}

        <TopIPsTable stats={stats} />
        
        <TopPortsChart stats={stats} />
      </div>
    </div>
  );
};

export default Statistics;
