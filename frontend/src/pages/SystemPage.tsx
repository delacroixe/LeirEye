import React from "react";
import DeviceInfo from "../components/DeviceInfo";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import "./SystemPage.css";

const SystemPage: React.FC = () => {
  return (
    <div className="system-page">
      <div className="page-header">
        <h2>🖥️ Información del Sistema</h2>
        <p className="page-description">
          Estado del sistema y configuración de red
        </p>
      </div>

      <PageHelp content={PAGE_HELP.system} />

      <div className="system-page-content">
        <DeviceInfo />
      </div>
    </div>
  );
};

export default SystemPage;
