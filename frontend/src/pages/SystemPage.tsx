import React from "react";
import DeviceInfo from "../components/DeviceInfo";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import "./SystemPage.css";

const SystemPage: React.FC = () => {
  return (
    <div className="view-container system-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">🖥️</span> Terminal del Sistema
          </h1>
          <p className="view-subtitle">
            Monitoreo de recursos de hardware, interfaces físicas y tabla de sockets del kernel.
          </p>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.system} />
        </div>
      </header>

      <div className="view-content">
        <DeviceInfo />
      </div>
    </div>
  );
};

export default SystemPage;
