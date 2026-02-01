/**
 * Statistics - Componente principal refactorizado
 *
 * Muestra estadísticas en tiempo real del tráfico de red:
 * - Resumen general de protocolos
 * - Top IPs origen
 * - Top puertos destino
 * - Estadísticas de procesos
 */
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import apiService, { StatsData } from "../../services/api";
import ProcessPacketStats from "../ProcessPacketStats";
import "./Statistics.css";
import StatsCards from "./StatsCards";
import TopIPsTable from "./TopIPsTable";
import TopPortsChart from "./TopPortsChart";

interface StatisticsProps {
  refreshTrigger?: number;
  packets?: any[];
  processes?: any[];
}

const Statistics: React.FC<StatisticsProps> = ({
  refreshTrigger = 0,
  packets: initialPackets = [],
  processes: initialProcesses = [],
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [prevStats, setPrevStats] = useState<StatsData | null>(null);
  const [packets, setPackets] = useState<any[]>(initialPackets);
  const [processes, setProcesses] = useState<any[]>(initialProcesses);
  const [loading, setLoading] = useState(false);

  // Actualizar packets si cambian las props
  useEffect(() => {
    if (initialPackets && initialPackets.length > 0) {
      setPackets(initialPackets);
    }
  }, [initialPackets]);

  useEffect(() => {
    // Obtener intervalo de refresco de la configuración
    const getRefreshInterval = () => {
      const savedSettings = localStorage.getItem("netmentor_settings");
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.autoRefresh === false) return null;
          return (settings.refreshInterval || 5) * 1000;
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      }
      return 5000; // Default 5s
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [statsData, packetsRes, processesData] = await Promise.all([
          apiService.getStatsSummary(),
          initialPackets.length === 0
            ? apiService.getPackets(100)
            : Promise.resolve(null),
          initialProcesses.length === 0
            ? fetch(`${API_BASE_URL}/system/processes-with-connections`)
                .then((r) => r.json())
                .catch(() => [])
            : Promise.resolve(null),
        ]);

        setPrevStats(stats);
        setStats(statsData);

        if (packetsRes && packetsRes.packets) {
          setPackets(packetsRes.packets);
        }

        if (processesData) {
          setProcesses(processesData);
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    const intervalMs = getRefreshInterval();
    if (intervalMs) {
      const interval = setInterval(fetchAllData, intervalMs);
      return () => clearInterval(interval);
    }
  }, [refreshTrigger, initialPackets.length, initialProcesses.length]);

  if (loading && !stats) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (!stats) {
    return (
      <div className="empty-message">
        No hay datos de estadísticas disponibles
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <h2>Estadísticas en Tiempo Real</h2>

      <StatsCards stats={stats} prevStats={prevStats} />

      <div className="charts-grid">
        <ProcessPacketStats packets={packets} processes={processes} />

        <TopIPsTable stats={stats} />

        <TopPortsChart stats={stats} />
      </div>
    </div>
  );
};

export default Statistics;
