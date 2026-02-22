import { Brain, Globe } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useSync } from "../contexts/SyncContext";
import { PacketData } from "../services/api";
import InfoTooltip, { TOOLTIP_CONTENT } from "./InfoTooltip";
import PacketExplainer from "./PacketExplainer";
import "./PacketTable.css";

interface PacketTableProps {
  packets: PacketData[];
  loading?: boolean;
}

const PacketTable: React.FC<PacketTableProps> = ({
  packets,
  loading = false,
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPacket, setSelectedPacket] = useState<PacketData | null>(null);
  const { activeProcessPid } = useSync();

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedRow(expandedRow === index ? null : index);
    },
    [expandedRow],
  );

  const handleExplain = useCallback(
    (packet: PacketData, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedPacket(packet);
    },
    [],
  );

  // Filtrar paquetes por búsqueda
  const filteredPackets = packets.filter((packet) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      packet.src_ip.toLowerCase().includes(searchLower) ||
      packet.dst_ip.toLowerCase().includes(searchLower) ||
      packet.protocol.toLowerCase().includes(searchLower) ||
      packet.src_port?.toString().includes(searchLower) ||
      packet.dst_port?.toString().includes(searchLower) ||
      packet.process_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const exportToCSV = () => {
    if (filteredPackets.length === 0) {
      alert("No hay paquetes para exportar");
      return;
    }

    // Headers CSV
    const headers = [
      "Hora",
      "IP Origen",
      "IP Destino",
      "Protocolo",
      "Puerto Src",
      "Puerto Dst",
      "Proceso",
      "Tamaño (bytes)",
      "Payload",
    ];

    // Convertir datos a CSV
    const rows = filteredPackets.map((packet) => [
      new Date(packet.timestamp).toLocaleString(),
      packet.src_ip,
      packet.dst_ip,
      packet.protocol,
      packet.src_port || "-",
      packet.dst_port || "-",
      packet.process_name || "-",
      packet.length,
      packet.payload_preview || "-",
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escapar comas y comillas
            const str = String(cell).replace(/"/g, '""');
            return str.includes(",") ? `"${str}"` : str;
          })
          .join(","),
      ),
    ].join("\n");

    // Descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packets_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    link.click();
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case "TCP":
        return "#10b981";
      case "UDP":
        return "#f59e0b";
      case "DNS":
        return "#3b82f6";
      case "ICMP":
        return "#ef4444";
      default:
        return "#0ea5e9";
    }
  };

  return (
    <div className="packet-inspector glass-card">
      <div className="inspector-header">
        <div className="header-meta">
          <h2 className="header-title">
            Flujo de Datos ({filteredPackets.length})
          </h2>
          <InfoTooltip content={TOOLTIP_CONTENT.packetTable} size="sm" />
        </div>

        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Filtro rápido (IP, Protocolo, Puertos...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-control"
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredPackets.length === 0}
            className="action-btn-outline"
            title="Exportar registros a CSV"
          >
            📥 Exportar
          </button>
        </div>
      </div>

      {loading && (
        <div className="fetching-indicator">Cargando unidades de datos...</div>
      )}

      <div className="inspector-table-view">
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Protocolo</th>
              <th>P.Src</th>
              <th>P.Dst</th>
              <th>Proceso</th>
              <th>Tamaño</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.length === 0 ? (
              <tr>
                <td colSpan={9} className="placeholder-row">
                  {searchTerm
                    ? "Sin registros coincidentes."
                    : "Esperando flujo de datos entrante..."}
                </td>
              </tr>
            ) : (
              filteredPackets.map((packet, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`data-row ${activeProcessPid && packet.pid === activeProcessPid ? "highlighted" : ""}`}
                    onClick={() => toggleExpand(index)}
                    style={{
                      borderLeft: `3px solid ${getProtocolColor(packet.protocol)}`,
                    }}
                  >
                    <td className="col-time">{formatTime(packet.timestamp)}</td>
                    <td className="col-ip">{packet.src_ip}</td>
                    <td className="col-ip">{packet.dst_ip}</td>
                    <td className="col-protocol">
                      <span
                        className="protocol-chip"
                        style={{
                          backgroundColor: `${getProtocolColor(packet.protocol)}20`,
                          color: getProtocolColor(packet.protocol),
                          borderColor: `${getProtocolColor(packet.protocol)}40`,
                        }}
                      >
                        {packet.protocol}
                      </span>
                      {packet.dns_domain && (
                        <span title={`DNS: ${packet.dns_domain}`}>
                          <Globe size={12} className="meta-icon" />
                        </span>
                      )}
                    </td>
                    <td className="col-port">{packet.src_port || "—"}</td>
                    <td className="col-port">{packet.dst_port || "—"}</td>
                    <td className="col-process">
                      <span
                        className={`process-chip ${!packet.process_name ? "unknown" : ""}`}
                      >
                        {packet.process_name || "kernel/init"}
                      </span>
                    </td>
                    <td className="col-size">{packet.length} B</td>
                    <td className="col-actions">
                      <button
                        className="academy-btn ai-enhance"
                        onClick={(e) => handleExplain(packet, e)}
                        title="IA: Analizar Unidad"
                      >
                        <Brain size={14} />
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr className="detail-panel-row">
                      <td colSpan={9}>
                        <div className="detail-panel glass-card">
                          <div className="grid-details">
                            <div className="detail-entry">
                              <span className="entry-label">Origen:</span>
                              <span className="entry-value">
                                {packet.src_ip}:{packet.src_port || "—"}
                              </span>
                            </div>
                            <div className="detail-entry">
                              <span className="entry-label">Destino:</span>
                              <span className="entry-value">
                                {packet.dst_ip}:{packet.dst_port || "—"}
                              </span>
                            </div>
                            <div className="detail-entry">
                              <span className="entry-label">Protocolo:</span>
                              <span className="entry-value">
                                {packet.protocol}
                              </span>
                            </div>

                            {packet.dns_domain && (
                              <div className="detail-entry dns-highlight">
                                <Globe size={14} className="entry-icon" />
                                <span className="entry-label">
                                  Dominio DNS:
                                </span>
                                <span className="entry-value domain">
                                  {packet.dns_domain}
                                </span>
                                {packet.dns_query_id && (
                                  <a
                                    href={`/dns?query_id=${packet.dns_query_id}`}
                                    className="cyber-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Trazar →
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="detail-entry">
                              <span className="entry-label">Entidad:</span>
                              <span className="entry-value">
                                {packet.process_name || "Desconocida"} (PID:{" "}
                                {packet.pid || "—"})
                              </span>
                            </div>

                            {packet.flags && (
                              <div className="detail-entry">
                                <span className="entry-label">
                                  Control Flags:
                                </span>
                                <span className="entry-value flags">
                                  {packet.flags}
                                </span>
                              </div>
                            )}

                            <div className="detail-entry">
                              <span className="entry-label">
                                Sincronización:
                              </span>
                              <span className="entry-value">
                                {packet.timestamp}
                              </span>
                            </div>
                          </div>

                          {packet.payload_preview && (
                            <div className="payload-viewer">
                              <span className="entry-label">
                                Data Payload Preview (Hexdump):
                              </span>
                              <div className="hex-viewer">
                                {packet.payload_preview}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPacket && (
        <PacketExplainer
          packet={selectedPacket}
          onClose={() => setSelectedPacket(null)}
        />
      )}
    </div>
  );
};

export default PacketTable;
