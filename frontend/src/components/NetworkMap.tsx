import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Network, DataSet, Options } from 'vis-network/standalone';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiService, { NetworkMapData, NetworkMapNode } from '../services/api';
import './NetworkMap.css';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para ajustar los bounds del mapa
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
    }
  }, [positions, map]);
  
  return null;
};

const NetworkMap: React.FC = () => {
  const [mapData, setMapData] = useState<NetworkMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkMapNode | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'geo'>('graph');
  const [userLocation, setUserLocation] = useState<[number, number]>([43.3, -2.0]); // Euskadi por defecto
  
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        if (data.status === 'success' && data.lat && data.lon) {
          setUserLocation([data.lat, data.lon]);
        }
      } catch (err) {
        console.log('No se pudo obtener la ubicación del usuario');
      }
    };
    fetchUserLocation();
  }, []);

  const fetchMapData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await apiService.getNetworkMap();
      setMapData(data);
    } catch (err) {
      setError('Error al cargar el mapa de red');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData(true);
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchMapData(false);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMapData]);

  // Inicializar vis-network cuando hay datos
  useEffect(() => {
    if (!mapData || viewMode !== 'graph' || !networkRef.current) return;

    // Usar el div interior como contenedor
    const container = networkRef.current.closest('.graph-container');
    if (!container) return;

    // Preparar nodos
    const nodes = new DataSet(
      mapData.nodes.map((node) => {
        const isLocal = node.isLocal;
        const traffic = node.traffic;
        const size = Math.max(25, Math.min(60, 15 + Math.log(traffic + 1) * 8));
        
        return {
          id: node.id,
          label: node.label,
          title: createTooltip(node),
          size: size,
          color: {
            background: isLocal ? '#22c55e' : '#3b82f6',
            border: isLocal ? '#16a34a' : '#2563eb',
            highlight: {
              background: isLocal ? '#4ade80' : '#60a5fa',
              border: isLocal ? '#22c55e' : '#3b82f6',
            },
            hover: {
              background: isLocal ? '#4ade80' : '#60a5fa',
              border: isLocal ? '#22c55e' : '#3b82f6',
            },
          },
          font: {
            color: '#ffffff',
            size: 12,
            face: 'SF Pro Display, -apple-system, sans-serif',
            strokeWidth: 3,
            strokeColor: '#0a0e27',
          },
          borderWidth: 2,
          borderWidthSelected: 4,
          shadow: {
            enabled: true,
            color: isLocal ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            size: 15,
            x: 0,
            y: 0,
          },
          shape: 'dot',
        };
      })
    );

    // Preparar aristas
    const edges = new DataSet(
      mapData.links.map((link, index) => {
        const maxValue = Math.max(...mapData.links.map(l => l.value));
        const normalizedWidth = 1 + (link.value / maxValue) * 6;
        
        return {
          id: index,
          from: link.source,
          to: link.target,
          width: normalizedWidth,
          color: {
            color: 'rgba(100, 116, 139, 0.4)',
            highlight: '#64c8ff',
            hover: '#64c8ff',
          },
          smooth: {
            enabled: true,
            type: 'continuous' as const,
            roundness: 0.5,
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.5,
            },
          },
          title: `${link.value} paquetes`,
        };
      })
    );

    // Opciones de visualización
    const options: Options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 20,
          max: 60,
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.8,
        },
        stabilization: {
          enabled: true,
          iterations: 200,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        navigationButtons: true,
        keyboard: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    // Crear o actualizar la red
    if (networkInstance.current) {
      networkInstance.current.setData({ nodes, edges });
    } else {
      networkInstance.current = new Network(networkRef.current, { nodes, edges }, options);
      
      // Eventos
      networkInstance.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = mapData.nodes.find(n => n.id === nodeId);
          if (node) setSelectedNode(node);
        } else {
          setSelectedNode(null);
        }
      });
    }

    return () => {
      // No destruir la instancia en cada render
    };
  }, [mapData, viewMode]);

  const createTooltip = (node: NetworkMapNode): string => {
    let html = `<div class="vis-tooltip-custom">
      <div class="tooltip-header">${node.isLocal ? '🏠' : '🌐'} ${node.label}</div>
      <div class="tooltip-body">
        <div class="tooltip-row"><span>Tipo:</span> ${node.networkType}</div>
        <div class="tooltip-row"><span>Tráfico:</span> ${node.traffic} paquetes</div>`;
    
    if (node.geo && !node.isLocal) {
      html += `
        <div class="tooltip-divider"></div>
        <div class="tooltip-row"><span>País:</span> ${node.geo.country}</div>
        <div class="tooltip-row"><span>Ciudad:</span> ${node.geo.city}</div>
        <div class="tooltip-row"><span>ISP:</span> ${node.geo.isp}</div>`;
    }
    
    html += '</div></div>';
    return html;
  };

  const handleRefresh = () => {
    fetchMapData(true);
  };

  // Obtener posiciones para el mapa geográfico
  const getGeoPositions = (): [number, number][] => {
    if (!mapData) return [];
    return mapData.nodes
      .filter(n => !n.isLocal && n.geo && n.geo.lat && n.geo.lon)
      .map(n => [n.geo!.lat, n.geo!.lon] as [number, number]);
  };

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
          <button onClick={handleRefresh}>Reintentar</button>
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

  const geoNodes = mapData.nodes.filter(n => !n.isLocal && n.geo && n.geo.lat && n.geo.lon);

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
          
          <button className="refresh-btn" onClick={handleRefresh}>
            <span>↻</span>
          </button>
        </div>
      </div>

      {/* Vista de Grafo (vis-network) */}
      {viewMode === 'graph' && (
        <div className="graph-container">
          <div ref={networkRef}></div>
        </div>
      )}

      {/* Vista de Mapa Geográfico */}
      {viewMode === 'geo' && (
        <div className="geo-container">
          <MapContainer
            center={userLocation}
            zoom={3}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <FitBounds positions={[userLocation, ...getGeoPositions()]} />
            
            {/* Líneas de conexión */}
            {geoNodes.map((node) => {
              const traffic = node.traffic;
              const intensity = Math.min(traffic / 100, 1);
              const color = traffic > 50 ? '#ef4444' : traffic > 20 ? '#f59e0b' : '#3b82f6';
              
              return (
                <Polyline
                  key={`line-${node.id}`}
                  positions={[userLocation, [node.geo!.lat, node.geo!.lon]]}
                  color={color}
                  weight={1 + intensity * 3}
                  opacity={0.4 + intensity * 0.3}
                  dashArray="5, 10"
                />
              );
            })}
            
            {/* Centro (Tu red) - Tu ubicación real */}
            <CircleMarker
              center={userLocation}
              radius={15}
              fillColor="#22c55e"
              fillOpacity={0.9}
              color="#16a34a"
              weight={3}
            >
              <Popup>
                <div className="geo-popup">
                  <div className="popup-header">🏠 Tu Red Local (Euskadi)</div>
                  <div className="popup-content">
                    <p><strong>{mapData.summary.local_nodes}</strong> dispositivos locales</p>
                    <p><strong>{mapData.summary.external_nodes}</strong> conexiones externas</p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
            
            {/* Marcadores externos */}
            {geoNodes.map((node) => {
              const traffic = node.traffic;
              const radius = Math.max(6, Math.min(15, 4 + Math.log(traffic + 1) * 3));
              const color = traffic > 50 ? '#ef4444' : traffic > 20 ? '#f59e0b' : '#3b82f6';
              
              return (
                <CircleMarker
                  key={node.id}
                  center={[node.geo!.lat, node.geo!.lon]}
                  radius={radius}
                  fillColor={color}
                  fillOpacity={0.85}
                  color="#ffffff"
                  weight={2}
                >
                  <Popup>
                    <div className="geo-popup">
                      <div className="popup-header">🌐 {node.label}</div>
                      <div className="popup-content">
                        <p>📍 {node.geo!.city}, {node.geo!.country}</p>
                        <p>🔌 {node.geo!.isp}</p>
                        <p>📊 <strong>{node.traffic}</strong> paquetes</p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          
          {/* Leyenda del mapa */}
          <div className="geo-legend">
            <div className="legend-title">Nivel de tráfico</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span>Bajo (&lt;20)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>Medio (20-50)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                <span>Alto (&gt;50)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de info del nodo seleccionado */}
      {selectedNode && viewMode === 'graph' && (
        <div className="node-panel">
          <div className="panel-header">
            <span className="panel-icon">{selectedNode.isLocal ? '🏠' : '🌐'}</span>
            <span className="panel-title">{selectedNode.label}</span>
            <button className="panel-close" onClick={() => setSelectedNode(null)}>×</button>
          </div>
          
          <div className="panel-content">
            <div className="panel-section">
              <div className="panel-row">
                <span className="row-label">Tipo de red</span>
                <span className="row-value">
                  <span className={`type-badge ${selectedNode.isLocal ? 'local' : 'external'}`}>
                    {selectedNode.networkType}
                  </span>
                </span>
              </div>
              
              <div className="panel-row">
                <span className="row-label">Paquetes</span>
                <span className="row-value highlight">{selectedNode.traffic.toLocaleString()}</span>
              </div>
            </div>
            
            {selectedNode.geo && !selectedNode.isLocal && (
              <div className="panel-section geo-section">
                <div className="section-title">📍 Ubicación</div>
                
                <div className="panel-row">
                  <span className="row-label">País</span>
                  <span className="row-value">{selectedNode.geo.countryCode} {selectedNode.geo.country}</span>
                </div>
                
                <div className="panel-row">
                  <span className="row-label">Ciudad</span>
                  <span className="row-value">{selectedNode.geo.city}</span>
                </div>
                
                <div className="panel-row">
                  <span className="row-label">ISP</span>
                  <span className="row-value">{selectedNode.geo.isp}</span>
                </div>
                
                <div className="panel-row">
                  <span className="row-label">Coordenadas</span>
                  <span className="row-value mono">
                    {selectedNode.geo.lat.toFixed(3)}, {selectedNode.geo.lon.toFixed(3)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
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
