import { Filter, Globe, Monitor, Network, Server, X } from "lucide-react";
import React from "react";
import { useSync } from "../contexts/SyncContext";
import "./GlobalFilterBadge.css";

const GlobalFilterBadge: React.FC = () => {
  const { globalFilter, clearFilter, crossNavigation } = useSync();

  if (!globalFilter) return null;

  const getIcon = () => {
    switch (globalFilter.type) {
      case "ip":
        return <Server size={14} />;
      case "domain":
        return <Globe size={14} />;
      case "process":
        return <Monitor size={14} />;
      case "protocol":
        return <Network size={14} />;
      default:
        return <Filter size={14} />;
    }
  };

  const getTypeLabel = () => {
    switch (globalFilter.type) {
      case "ip":
        return "IP";
      case "domain":
        return "Dominio";
      case "process":
        return "Proceso";
      case "protocol":
        return "Protocolo";
      case "port":
        return "Puerto";
      case "dns_query":
        return "Query DNS";
      default:
        return "Filtro";
    }
  };

  return (
    <div className="global-filter-badge">
      <div className="filter-content">
        {getIcon()}
        <span className="filter-type">{getTypeLabel()}:</span>
        <span className="filter-value">{globalFilter.value}</span>
        {crossNavigation && (
          <span className="filter-origin">desde {crossNavigation.from}</span>
        )}
      </div>
      <button
        className="clear-filter-btn"
        onClick={clearFilter}
        title="Limpiar filtro"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default GlobalFilterBadge;
