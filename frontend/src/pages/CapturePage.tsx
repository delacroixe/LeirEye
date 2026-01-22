import React, { useMemo } from "react";
import ActivityTimeline from "../components/ActivityTimeline";
import PacketTable from "../components/PacketTable";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import ProcessTraffic from "../components/ProcessTraffic";
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
    <div className="capture-page">
      <div className="page-header">
        <h2>📦 Captura de Paquetes</h2>
        <p className="page-description">
          {globalFilter
            ? `Mostrando ${filteredPackets.length} de ${packets.length} paquetes`
            : "Visualiza el tráfico de red en tiempo real"}
        </p>
      </div>

      <PageHelp content={PAGE_HELP.capture} />

      <div className="capture-page-content">
        <ActivityTimeline packets={filteredPackets} />
        <ProcessTraffic refreshTrigger={filteredPackets.length} />
        <PacketTable packets={filteredPackets} loading={isCapturing} />
      </div>
    </div>
  );
};

export default CapturePage;
