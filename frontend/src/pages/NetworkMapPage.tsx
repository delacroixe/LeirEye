import React from "react";
import NetworkMap from "../components/NetworkMap";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import "./NetworkMapPage.css";

const NetworkMapPage: React.FC = () => {
  return (
    <div className="view-container network-map-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">🗺️</span> Mapa de Infraestructura
          </h1>
          <p className="view-subtitle">
            Representación topológica de nodos, flujos de tráfico y geolocalización de entidades remotas.
          </p>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.networkMap} />
        </div>
      </header>

      <div className="view-content full-height">
        <div className="map-container glass-card">
          <NetworkMap />
        </div>
      </div>
    </div>
  );
};

export default NetworkMapPage;
