import React from "react";
import NetworkMap from "../components/NetworkMap";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import "./NetworkMapPage.css";

const NetworkMapPage: React.FC = () => {
  return (
    <div className="network-map-page">
      <div className="page-header">
        <h2>🗺️ Mapa de Red</h2>
        <p className="page-description">
          Visualización gráfica de conexiones y nodos de red
        </p>
      </div>

      <PageHelp content={PAGE_HELP.networkMap} />

      <div className="network-map-page-content">
        <NetworkMap />
      </div>
    </div>
  );
};

export default NetworkMapPage;
