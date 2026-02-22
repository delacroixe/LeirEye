import React, { useMemo } from "react";
import ActivityTimeline from "../components/ActivityTimeline";
import PacketTable from "../components/PacketTable";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import { useCaptureContext } from "../contexts/CaptureContext";
import { useSync } from "../contexts/SyncContext";
import "./CapturePage.css";

const CapturePage: React.FC = () => {
  const { packets, isCapturing } = useCaptureContext();
  const { globalFilter, selectedDnsQueryId } = useSync();

  // Filtrar paquetes según el filtro global
  const filteredPackets = useMemo(() => {
    if (!globalFilter && !selectedDnsQueryId) return packets;

    return packets.filter((packet) => {
      // Filtrar por DNS query ID
      if (selectedDnsQueryId && packet.dns_query_id === selectedDnsQueryId) {
        return true;
      }

      if (!globalFilter) return !selectedDnsQueryId;

      switch (globalFilter.type) {
        case "ip":
          return (
            packet.src_ip === globalFilter.value ||
            packet.dst_ip === globalFilter.value
          );
        case "domain":
          return packet.dns_domain
            ?.toLowerCase()
            .includes(globalFilter.value.toLowerCase());
        case "process":
          return packet.process_name
            ?.toLowerCase()
            .includes(globalFilter.value.toLowerCase());
        case "protocol":
          return packet.protocol === globalFilter.value;
        case "port":
          const port = parseInt(globalFilter.value);
          return packet.src_port === port || packet.dst_port === port;
        case "dns_query":
          return packet.dns_query_id === globalFilter.value;
        default:
          return true;
      }
    });
  }, [packets, globalFilter, selectedDnsQueryId]);

  return (
    <div className="view-container capture-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">📦</span> Sincronización de Paquetes
          </h1>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.capture} pageId="capture" />
        </div>
      </header>

      <div className="view-content">
        <div className="dashboard-grid single-column">
          <div className="grid-span-full">
            <ActivityTimeline packets={filteredPackets} />
          </div>
          <div className="grid-span-full">
            <PacketTable packets={filteredPackets} loading={isCapturing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapturePage;
