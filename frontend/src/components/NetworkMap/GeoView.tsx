/**
 * Vista de mapa geográfico con Leaflet
 */
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NetworkMapData } from '../../services/api';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GeoViewProps {
  mapData: NetworkMapData;
  userLocation: [number, number];
}

// Componente para ajustar los bounds
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
    }
  }, [positions, map]);

  return null;
};

const GeoView: React.FC<GeoViewProps> = ({ mapData, userLocation }) => {
  const geoNodes = mapData.nodes.filter(
    (n) => !n.isLocal && n.geo && n.geo.lat && n.geo.lon
  );

  const getGeoPositions = (): [number, number][] => {
    return geoNodes.map((n) => [n.geo!.lat, n.geo!.lon] as [number, number]);
  };

  const getTrafficColor = (traffic: number): string => {
    if (traffic > 50) return '#ef4444';
    if (traffic > 20) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <>
      <MapContainer
        center={userLocation}
        zoom={3}
        zoomControl={true}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <FitBounds positions={[userLocation, ...getGeoPositions()]} />

        {/* Líneas de conexión */}
        {geoNodes.map((node) => {
          const intensity = Math.min(node.traffic / 100, 1);
          const color = getTrafficColor(node.traffic);

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

        {/* Centro: Tu red */}
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
              <div className="popup-header">🏠 Tu Red Local</div>
              <div className="popup-content">
                <p>
                  <strong>{mapData.summary.local_nodes}</strong> dispositivos locales
                </p>
                <p>
                  <strong>{mapData.summary.external_nodes}</strong> conexiones externas
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>

        {/* Marcadores externos */}
        {geoNodes.map((node) => {
          const radius = Math.max(6, Math.min(15, 4 + Math.log(node.traffic + 1) * 3));
          const color = getTrafficColor(node.traffic);

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
                    <p>
                      📍 {node.geo!.city}, {node.geo!.country}
                    </p>
                    <p>🔌 {node.geo!.isp}</p>
                    <p>
                      📊 <strong>{node.traffic}</strong> paquetes
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Leyenda */}
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
    </>
  );
};

export default GeoView;
