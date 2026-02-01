import React from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import Statistics from "../components/Statistics";
import { useCaptureContext } from "../contexts/CaptureContext";
import "./StatisticsPage.css";

const StatisticsPage: React.FC = () => {
  const { packets } = useCaptureContext();

  return (
    <div className="view-container statistics-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">📈</span> Análisis de Tráfico
          </h1>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.statistics} pageId="statistics" />
        </div>
      </header>

      <div className="view-content">
        <div className="statistics-dashboard glass-card">
          <Statistics packets={packets} />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
