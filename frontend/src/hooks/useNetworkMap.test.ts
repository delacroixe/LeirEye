import { renderHook, waitFor, act } from '@testing-library/react';
import { useNetworkMap } from './useNetworkMap';
import apiService, { NetworkMapData } from '../services/api';
import { GEO_IP_API_URL } from '../config';

// Mock dependencies
jest.mock('../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock fetch for geo IP
global.fetch = jest.fn();

describe('useNetworkMap', () => {
  const mockNetworkMapData: NetworkMapData = {
    nodes: [
      {
        id: '192.168.1.1',
        label: '192.168.1.1',
        isLocal: true,
        networkType: 'local',
        traffic: 100,
        geo: null,
      },
      {
        id: '8.8.8.8',
        label: '8.8.8.8',
        isLocal: false,
        networkType: 'external',
        traffic: 50,
        geo: {
          country: 'USA',
          countryCode: 'US',
          city: 'Mountain View',
          isp: 'Google',
          lat: 37.386,
          lon: -122.084,
        },
      },
    ],
    links: [
      {
        source: '192.168.1.1',
        target: '8.8.8.8',
        value: 10,
      },
    ],
    summary: {
      total_nodes: 2,
      local_nodes: 1,
      external_nodes: 1,
      total_links: 1,
      total_connections: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock successful API call by default
    mockApiService.getNetworkMap.mockResolvedValue(mockNetworkMapData);
    
    // Mock successful geo IP fetch by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        lat: 43.3,
        lon: -2.0,
      }),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('proporciona estado inicial correcto', () => {
    const { result } = renderHook(() => useNetworkMap());

    expect(result.current.mapData).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedNode).toBeNull();
    expect(result.current.autoRefresh).toBe(false);
    expect(result.current.userLocation).toEqual([43.3, -2.0]);
  });

  test('carga datos del mapa de red correctamente', async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);
    expect(result.current.mapData).toEqual(mockNetworkMapData);
    expect(result.current.error).toBeNull();
  });

  test('maneja errores al cargar datos del mapa', async () => {
    const errorMessage = 'Network error';
    mockApiService.getNetworkMap.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapData).toBeNull();
    expect(result.current.error).toBe('Error al cargar el mapa de red');
  });

  test('actualiza selectedNode correctamente', async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const testNode = mockNetworkMapData.nodes[0];

    act(() => {
      result.current.setSelectedNode(testNode);
    });

    expect(result.current.selectedNode).toEqual(testNode);

    act(() => {
      result.current.setSelectedNode(null);
    });

    expect(result.current.selectedNode).toBeNull();
  });

  test('refresh recarga los datos del mapa', async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(2);
    });
  });

  test('autoRefresh actualiza datos periódicamente', async () => {
    const autoRefreshInterval = 10000;
    const { result } = renderHook(() =>
      useNetworkMap({ autoRefreshInterval })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial load
    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);

    // Enable auto-refresh
    act(() => {
      result.current.setAutoRefresh(true);
    });

    // Advance time by interval
    act(() => {
      jest.advanceTimersByTime(autoRefreshInterval);
    });

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(2);
    });

    // Advance time again
    act(() => {
      jest.advanceTimersByTime(autoRefreshInterval);
    });

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(3);
    });

    // Disable auto-refresh
    act(() => {
      result.current.setAutoRefresh(false);
    });

    // Advance time - should not call again
    act(() => {
      jest.advanceTimersByTime(autoRefreshInterval);
    });

    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(3);
  });

  test('usa intervalo de auto-refresh por defecto', async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setAutoRefresh(true);
    });

    // Default interval is 30000ms
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(2);
    });
  });

  test('limpia el intervalo de auto-refresh al desmontar', async () => {
    const { result, unmount } = renderHook(() =>
      useNetworkMap({ autoRefreshInterval: 10000 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setAutoRefresh(true);
    });

    unmount();

    // Advance time after unmount
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should not call API after unmount
    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);
  });

  test('obtiene ubicación del usuario correctamente', async () => {
    const mockUserLocation = {
      status: 'success',
      lat: 40.7128,
      lon: -74.006,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserLocation,
    });

    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(GEO_IP_API_URL);
    });

    await waitFor(() => {
      expect(result.current.userLocation).toEqual([40.7128, -74.006]);
    });
  });

  test('usa ubicación por defecto si falla la obtención de ubicación del usuario', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(GEO_IP_API_URL);
    });

    // Should keep default location
    expect(result.current.userLocation).toEqual([43.3, -2.0]);
  });

  test('usa ubicación por defecto si la respuesta de geo IP no es exitosa', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'fail',
      }),
    });

    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(GEO_IP_API_URL);
    });

    // Should keep default location
    expect(result.current.userLocation).toEqual([43.3, -2.0]);
  });

  test('auto-refresh no muestra loading en actualizaciones periódicas', async () => {
    const { result } = renderHook(() =>
      useNetworkMap({ autoRefreshInterval: 10000 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setAutoRefresh(true);
    });

    // Check loading is false before interval
    expect(result.current.loading).toBe(false);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Loading should remain false during auto-refresh
    expect(result.current.loading).toBe(false);

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(2);
    });
  });

  test('refresh manual muestra loading', async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock a slow API response
    mockApiService.getNetworkMap.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockNetworkMapData), 100)
        )
    );

    act(() => {
      result.current.refresh();
    });

    // Loading should be true during manual refresh
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
