/**
 * Hook para obtener y gestionar datos del mapa de red
 */
import { useCallback, useEffect, useState } from "react";
import { GEO_IP_API_URL } from "../config";
import apiService, { NetworkMapData, NetworkMapNode } from "../services/api";

interface UseNetworkMapOptions {
  autoRefreshInterval?: number;
}

interface UseNetworkMapResult {
  mapData: NetworkMapData | null;
  loading: boolean;
  error: string | null;
  selectedNode: NetworkMapNode | null;
  userLocation: [number, number];
  setSelectedNode: (node: NetworkMapNode | null) => void;
  refresh: () => void;
}

export const useNetworkMap = (
  options: UseNetworkMapOptions = {},
): UseNetworkMapResult => {
  const { autoRefreshInterval = 30000 } = options;

  const [mapData, setMapData] = useState<NetworkMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkMapNode | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    43.3, -2.0,
  ]);

  // Obtener ubicación del usuario
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch(GEO_IP_API_URL);
        const data = await response.json();
        if (data.status === "success" && data.lat && data.lon) {
          setUserLocation([data.lat, data.lon]);
        }
      } catch {
        console.log("No se pudo obtener la ubicación del usuario");
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
      setError("Error al cargar el mapa de red");
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchMapData(true);
  }, [fetchMapData]);

  // Auto-refresh inteligente basado en configuración global
  useEffect(() => {
    // Obtener intervalo de refresco de la configuración
    const getRefreshConfig = () => {
      const savedSettings = localStorage.getItem("netmentor_settings");
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          return {
            enabled: settings.autoRefresh !== false,
            interval: (settings.refreshInterval || 5) * 1000,
          };
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      }
      return { enabled: true, interval: 30000 }; // Por defecto 30s para mapa (es pesado)
    };

    const config = getRefreshConfig();
    if (!config.enabled) return;

    const interval = setInterval(() => {
      fetchMapData(false);
    }, config.interval);

    return () => clearInterval(interval);
  }, [fetchMapData]);

  const refresh = useCallback(() => {
    fetchMapData(true);
  }, [fetchMapData]);

  return {
    mapData,
    loading,
    error,
    selectedNode,
    userLocation,
    setSelectedNode,
    refresh,
  };
};
