import { act, renderHook, waitFor } from "@testing-library/react";
import apiService, { NetworkMapData } from "../services/api";
import { useNetworkMap } from "./useNetworkMap";

// Mock dependencies
jest.mock("../services/api");
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock fetch for geo IP - block it to avoid act() warnings
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    json: async () => ({}),
  }),
) as jest.Mock;

describe("useNetworkMap", () => {
  const mockNetworkMapData: NetworkMapData = {
    nodes: [
      {
        id: "192.168.1.1",
        label: "192.168.1.1",
        isLocal: true,
        networkType: "local",
        traffic: 100,
        geo: null,
      },
      {
        id: "8.8.8.8",
        label: "8.8.8.8",
        isLocal: false,
        networkType: "external",
        traffic: 50,
        geo: {
          country: "USA",
          countryCode: "US",
          city: "Mountain View",
          isp: "Google",
          lat: 37.386,
          lon: -122.084,
        },
      },
    ],
    links: [
      {
        source: "192.168.1.1",
        target: "8.8.8.8",
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
    // Mock successful API call by default
    mockApiService.getNetworkMap.mockResolvedValue(mockNetworkMapData);
  });

  test("provides correct initial state", async () => {
    const { result } = renderHook(() => useNetworkMap());

    // Wait for all async operations to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapData).toEqual(mockNetworkMapData);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedNode).toBeNull();
    expect(result.current.autoRefresh).toBe(false);
    expect(result.current.userLocation).toEqual([43.3, -2.0]); // Default location
  });

  test("loads network map data correctly", async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);
    expect(result.current.mapData).toEqual(mockNetworkMapData);
    expect(result.current.error).toBeNull();
  });

  test("handles errors when loading map data", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockApiService.getNetworkMap.mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapData).toBeNull();
    expect(result.current.error).toBe("Error al cargar el mapa de red");
    consoleErrorSpy.mockRestore();
  });

  test("updates selectedNode correctly", async () => {
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

  test("refresh reloads map data", async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockApiService.getNetworkMap).toHaveBeenCalledTimes(2);
    });
  });

  test("setAutoRefresh toggles auto-refresh state", async () => {
    const { result } = renderHook(() => useNetworkMap());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.autoRefresh).toBe(false);

    act(() => {
      result.current.setAutoRefresh(true);
    });

    expect(result.current.autoRefresh).toBe(true);

    act(() => {
      result.current.setAutoRefresh(false);
    });

    expect(result.current.autoRefresh).toBe(false);
  });
});
