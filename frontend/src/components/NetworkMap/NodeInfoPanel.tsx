/**
 * Panel de información del nodo seleccionado
 */
import React from 'react';
import { NetworkMapNode } from '../../services/api';

interface NodeInfoPanelProps {
  node: NetworkMapNode;
  onClose: () => void;
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ node, onClose }) => {
  return (
    <div className="node-panel">
      <div className="panel-header">
        <span className="panel-icon">{node.isLocal ? '🏠' : '🌐'}</span>
        <span className="panel-title">{node.label}</span>
        <button className="panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="panel-content">
        <div className="panel-section">
          <div className="panel-row">
            <span className="row-label">Tipo de red</span>
            <span className="row-value">
              <span className={`type-badge ${node.isLocal ? 'local' : 'external'}`}>
                {node.networkType}
              </span>
            </span>
          </div>

          <div className="panel-row">
            <span className="row-label">Paquetes</span>
            <span className="row-value highlight">{node.traffic.toLocaleString()}</span>
          </div>
        </div>

        {node.geo && !node.isLocal && (
          <div className="panel-section geo-section">
            <div className="section-title">📍 Ubicación</div>

            <div className="panel-row">
              <span className="row-label">País</span>
              <span className="row-value">
                {node.geo.countryCode} {node.geo.country}
              </span>
            </div>

            <div className="panel-row">
              <span className="row-label">Ciudad</span>
              <span className="row-value">{node.geo.city}</span>
            </div>

            <div className="panel-row">
              <span className="row-label">ISP</span>
              <span className="row-value">{node.geo.isp}</span>
            </div>

            <div className="panel-row">
              <span className="row-label">Coordenadas</span>
              <span className="row-value mono">
                {node.geo.lat.toFixed(3)}, {node.geo.lon.toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeInfoPanel;
