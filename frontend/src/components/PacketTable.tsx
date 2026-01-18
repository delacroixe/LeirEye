import React, { useState, useCallback } from 'react';
import { PacketData } from '../services/api';
import { useSync } from '../context/SyncContext';
import PacketExplainer from './PacketExplainer';
import './PacketTable.css';

interface PacketTableProps {
  packets: PacketData[];
  loading?: boolean;
}

const PacketTable: React.FC<PacketTableProps> = ({ packets, loading = false }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<PacketData | null>(null);
  const { activeProcessPid } = useSync();

  const toggleExpand = useCallback((index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  }, [expandedRow]);

  const handleExplain = useCallback((packet: PacketData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPacket(packet);
  }, []);

  // Filtrar paquetes por búsqueda
  const filteredPackets = packets.filter((packet) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      packet.src_ip.toLowerCase().includes(searchLower) ||
      packet.dst_ip.toLowerCase().includes(searchLower) ||
      packet.protocol.toLowerCase().includes(searchLower) ||
      (packet.src_port?.toString().includes(searchLower)) ||
      (packet.dst_port?.toString().includes(searchLower)) ||
      (packet.process_name?.toLowerCase().includes(searchLower))
    );
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatPayload = (payload: string | null) => {
    if (!payload) return 'N/A';
    return payload.substring(0, 20) + (payload.length > 20 ? '...' : '');
  };

  const exportToCSV = () => {
    if (filteredPackets.length === 0) {
      alert('No hay paquetes para exportar');
      return;
    }

    // Headers CSV
    const headers = ['Hora', 'IP Origen', 'IP Destino', 'Protocolo', 'Puerto Src', 'Puerto Dst', 'Proceso', 'Tamaño (bytes)', 'Payload'];
    
    // Convertir datos a CSV
    const rows = filteredPackets.map(packet => [
      new Date(packet.timestamp).toLocaleString(),
      packet.src_ip,
      packet.dst_ip,
      packet.protocol,
      packet.src_port || '-',
      packet.dst_port || '-',
      packet.process_name || '-',
      packet.length,
      packet.payload_preview || '-'
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escapar comas y comillas
          const str = String(cell).replace(/"/g, '""');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `packets_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP':
        return '#10b981';
      case 'UDP':
        return '#f59e0b';
      case 'ICMP':
        return '#ef4444';
      default:
        return '#0ea5e9';
    }
  };

  return (
    <div className="packet-table-container">
      <div className="table-header">
        <h2>Paquetes Capturados ({filteredPackets.length})</h2>
        <div className="header-controls">
          <input
            type="text"
            placeholder="🔍 Buscar por IP, protocolo o puerto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={exportToCSV}
            disabled={filteredPackets.length === 0}
            className="export-btn"
            title="Descargar como CSV"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>
      
      {loading && <div className="loading">Cargando paquetes...</div>}

      <div className="table-wrapper">
        <table className="packet-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>IP Origen</th>
              <th>IP Destino</th>
              <th>Protocolo</th>
              <th>Puerto Src</th>
              <th>Puerto Dst</th>
              <th>Proceso</th>
              <th>Tamaño</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-message">
                  {searchTerm ? 'No hay paquetes que coincidan con la búsqueda.' : 'No hay paquetes capturados. Inicia una captura para comenzar.'}
                </td>
              </tr>
            ) : (
              filteredPackets.map((packet, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`packet-row ${activeProcessPid && packet.pid === activeProcessPid ? 'highlighted' : ''}`}
                    onClick={() => toggleExpand(index)}
                    style={{
                      borderLeft: `4px solid ${getProtocolColor(packet.protocol)}`,
                    }}
                  >
                    <td>{formatTime(packet.timestamp)}</td>
                    <td className="ip-addr">{packet.src_ip}</td>
                    <td className="ip-addr">{packet.dst_ip}</td>
                    <td>
                      <span className="protocol-badge" style={{
                        backgroundColor: getProtocolColor(packet.protocol)
                      }}>
                        {packet.protocol}
                      </span>
                    </td>
                    <td>{packet.src_port || '-'}</td>
                    <td>{packet.dst_port || '-'}</td>
                    <td>
                      {packet.process_name ? (
                        <span className="process-badge">{packet.process_name}</span>
                      ) : (
                        <span className="process-badge unknown">Desconocido</span>
                      )}
                    </td>
                    <td>{packet.length}b</td>
                    <td>
                      <button 
                        className="explain-btn"
                        onClick={(e) => handleExplain(packet, e)}
                        title="¿Qué es esto?"
                      >
                        🎓
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr className="expanded-row">
                      <td colSpan={9}>
                        <div className="packet-details">
                          <div className="detail-item">
                            <strong>IP Origen:</strong> {packet.src_ip}
                          </div>
                          <div className="detail-item">
                            <strong>IP Destino:</strong> {packet.dst_ip}
                          </div>
                          <div className="detail-item">
                            <strong>Protocolo:</strong> {packet.protocol}
                          </div>
                          {packet.src_port && (
                            <div className="detail-item">
                              <strong>Puerto Origen:</strong> {packet.src_port}
                            </div>
                          )}
                          {packet.dst_port && (
                            <div className="detail-item">
                              <strong>Puerto Destino:</strong> {packet.dst_port}
                            </div>
                          )}
                          {packet.process_name && (
                            <div className="detail-item">
                              <strong>Proceso:</strong> {packet.process_name} (PID: {packet.pid})
                            </div>
                          )}
                          {packet.flags && (
                            <div className="detail-item">
                              <strong>Flags TCP:</strong> {packet.flags}
                            </div>
                          )}
                          <div className="detail-item">
                            <strong>Tamaño:</strong> {packet.length} bytes
                          </div>
                          {packet.payload_preview && (
                            <div className="detail-item">
                              <strong>Payload (hex):</strong>
                              <div className="payload-hex">{packet.payload_preview}</div>
                            </div>
                          )}
                          <div className="detail-item">
                            <strong>Timestamp:</strong> {packet.timestamp}
                          </div>
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

      {/* Modal de explicación */}
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
