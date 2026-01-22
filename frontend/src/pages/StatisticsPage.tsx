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
    <div className="statistics-page">
      <div className="page-header">
        <h2>📈 Estadísticas</h2>
        <p className="page-description">
          Análisis del tráfico de red capturado
        </p>
        <button onClick={handleRefresh} className="refresh-btn">
          ↻ Actualizar
        </button>
      </div>

      <PageHelp content={PAGE_HELP.statistics} />

      <div className="statistics-page-content">
        <Statistics
          refreshTrigger={refreshTrigger}
          packets={packets}
          processes={[]}
        />
      </div>
    </div>
  );
};

export default StatisticsPage;
