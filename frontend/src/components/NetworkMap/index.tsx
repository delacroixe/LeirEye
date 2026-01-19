/**
 * NetworkMap - Componente principal refactorizado
 * 
 * Muestra un mapa de red en dos vistas:
 * - Grafo: visualización de nodos y conexiones con vis-network
 * - Geo: mapa geográfico con Leaflet
 */
import React, { useState } from 'react';
import { useNetworkMap } from '../../hooks/useNetworkMap';
import GraphView from './GraphView';
import GeoView from './GeoView';
import NodeInfoPanel from './NodeInfoPanel';
import './NetworkMap.css';

type ViewMode = 'graph' | 'geo';

const NetworkMap: React.FC = () => {
  const {
    mapData,
    loading,
    error,
    selectedNode,
    autoRefresh,
    userLocation,
    setSelectedNode,
    setAutoRefresh,
    refresh,
  } = useNetworkMap();

  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  // Estados de carga y error
  if (loading && !mapData) {
    return (
      <div className="network-map">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando mapa de red...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="network-map">
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={refresh}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!mapData || mapData.nodes.length === 0) {
    return (
      <div className="network-map">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Sin datos de red</h3>
          <p>Inicia la captura para visualizar conexiones</p>
        </div>
      </div>
    );
  }

  const geoNodes = mapData.nodes.filter(
    (n) => !n.isLocal && n.geo && n.geo.lat && n.geo.lon
  );

  return (
    <div className="network-map">
      {/* Header */}
      <div className="map-header">
        <div className="map-stats">
          <div className="stat-badge">
            <span className="stat-icon">🖥️</span>
            <span className="stat-value">{mapData.summary.local_nodes}</span>
            <span className="stat-label">Locales</span>
          </div>
          <div className="stat-badge external">
            <span className="stat-icon">🌍</span>
            <span className="stat-value">{mapData.summary.external_nodes}</span>
            <span className="stat-label">Externos</span>
          </div>
          <div className="stat-badge neutral">
            <span className="stat-icon">🔗</span>
            <span className="stat-value">{mapData.summary.total_links}</span>
            <span className="stat-label">Conexiones</span>
          </div>
        </div>

        <div className="map-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => setViewMode('graph')}
            >
              <span className="btn-icon">🕸️</span>
              <span>Grafo</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'geo' ? 'active' : ''}`}
              onClick={() => setViewMode('geo')}
              disabled={geoNodes.length === 0}
              title={geoNodes.length === 0 ? 'Sin datos de geolocalización' : ''}
            >
              <span className="btn-icon">🗺️</span>
              <span>Mapa</span>
            </button>
          </div>

          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Auto</span>
          </label>

          <button className="refresh-btn" onClick={refresh}>
            <span>↻</span>
          </button>
        </div>
      </div>

      {/* Vista de Grafo */}
      {viewMode === 'graph' && (
        <div className="graph-container">
          <GraphView mapData={mapData} onNodeSelect={setSelectedNode} />
        </div>
      )}

      {/* Vista Geográfica */}
      {viewMode === 'geo' && (
        <div className="geo-container">
          <GeoView mapData={mapData} userLocation={userLocation} />
        </div>
      )}

      {/* Panel de info del nodo */}
      {selectedNode && viewMode === 'graph' && (
        <NodeInfoPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* Leyenda del grafo */}
      {viewMode === 'graph' && (
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-dot local"></span>
            <span>IPs Locales</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot external"></span>
            <span>IPs Externas</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkMap;
