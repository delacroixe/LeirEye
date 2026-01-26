import React, { useState } from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import Statistics from "../components/Statistics";
import { useCaptureContext } from "../contexts/CaptureContext";
import "./StatisticsPage.css";

const StatisticsPage: React.FC = () => {
  const { packets } = useCaptureContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="view-container statistics-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">📈</span> Análisis Estocástico
          </h1>
          <p className="view-subtitle">
            Métricas agregadas, distribución de protocolos y volumetría de tráfico en tiempo real.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="premium-btn primary">
            Sincronizar Datos
          </button>
          <PageHelp content={PAGE_HELP.statistics} />
        </div>
      </header>

      <div className="view-content">
        <div className="statistics-dashboard glass-card">
          <Statistics
            refreshTrigger={refreshTrigger}
            packets={packets}
            processes={[]}
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
