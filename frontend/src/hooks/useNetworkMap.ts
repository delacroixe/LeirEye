/**
 * Hook para obtener y gestionar datos del mapa de red
 */
import { useState, useEffect, useCallback } from 'react';
import apiService, { NetworkMapData, NetworkMapNode } from '../services/api';

interface UseNetworkMapOptions {
  autoRefreshInterval?: number;
}

interface UseNetworkMapResult {
  mapData: NetworkMapData | null;
  loading: boolean;
  error: string | null;
  selectedNode: NetworkMapNode | null;
  autoRefresh: boolean;
  userLocation: [number, number];
  setSelectedNode: (node: NetworkMapNode | null) => void;
  setAutoRefresh: (value: boolean) => void;
  refresh: () => void;
}

export const useNetworkMap = (
  options: UseNetworkMapOptions = {}
): UseNetworkMapResult => {
  const { autoRefreshInterval = 30000 } = options;

  const [mapData, setMapData] = useState<NetworkMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkMapNode | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([43.3, -2.0]);

  // Obtener ubicación del usuario
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        if (data.status === 'success' && data.lat && data.lon) {
          setUserLocation([data.lat, data.lon]);
        }
      } catch {
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

  // Carga inicial
  useEffect(() => {
    fetchMapData(true);
  }, [fetchMapData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMapData(false);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, fetchMapData]);

  const refresh = useCallback(() => {
    fetchMapData(true);
  }, [fetchMapData]);

  return {
    mapData,
    loading,
    error,
    selectedNode,
    autoRefresh,
    userLocation,
    setSelectedNode,
    setAutoRefresh,
    refresh,
  };
};
