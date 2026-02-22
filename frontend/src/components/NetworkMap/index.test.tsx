import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NetworkMap from './index';
import { useNetworkMap } from '../../hooks/useNetworkMap';

// Mock de los subcomponentes
vi.mock('./GraphView', () => ({
  __esModule: true,
  default: ({ onNodeSelect }: any) => (
    <div data-testid="graph-view" onClick={() => onNodeSelect({ id: '1', label: 'Test Node' })}>
      Graph View Mock
    </div>
  ),
}));

vi.mock('./GeoView', () => ({
  __esModule: true,
  default: () => <div data-testid="geo-view">Geo View Mock</div>,
}));

vi.mock('./NodeInfoPanel', () => ({
  __esModule: true,
  default: ({ node, onClose }: any) => (
    <div data-testid="node-info-panel">
      <span data-testid="node-label">{node.label}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock del hook useNetworkMap
vi.mock('../../hooks/useNetworkMap');

const mockUseNetworkMap = useNetworkMap as vi.MockedFunction<typeof useNetworkMap>;

describe('NetworkMap', () => {
  const mockMapData = {
    nodes: [
      {
        id: '1',
        label: '192.168.1.1',
        isLocal: true,
        networkType: 'Local',
        traffic: 100,
      },
      {
        id: '2',
        label: '8.8.8.8',
        isLocal: false,
        networkType: 'External',
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
    links: [{ source: '1', target: '2', value: 10 }],
    summary: {
      total_nodes: 2,
      local_nodes: 1,
      external_nodes: 1,
      total_links: 1,
      total_connections: 1,
    },
  };

  const defaultHookReturn = {
    mapData: mockMapData,
    loading: false,
    error: null,
    selectedNode: null,
    autoRefresh: false,
    userLocation: [43.3, -2.0] as [number, number],
    setSelectedNode: vi.fn(),
    setAutoRefresh: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetworkMap.mockReturnValue(defaultHookReturn);
  });

  test('muestra estado de carga cuando está cargando', () => {
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      mapData: null,
      loading: true,
    });

    render(<NetworkMap />);
    expect(screen.getByText('Cargando mapa de red...')).toBeInTheDocument();
  });

  test('muestra estado de error cuando hay error', () => {
    const mockRefresh = vi.fn();
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      error: 'Error de red',
      refresh: mockRefresh,
    });

    render(<NetworkMap />);
    expect(screen.getByText(/Error de red/)).toBeInTheDocument();
    
    const retryButton = screen.getByText('Reintentar');
    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('muestra estado vacío cuando no hay datos', () => {
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      mapData: { ...mockMapData, nodes: [] },
    });

    render(<NetworkMap />);
    expect(screen.getByText('Sin datos de red')).toBeInTheDocument();
    expect(screen.getByText('Inicia la captura para visualizar conexiones')).toBeInTheDocument();
  });

  test('renderiza correctamente con datos', () => {
    render(<NetworkMap />);
    
    // Verifica las estadísticas en el header
    expect(screen.getByText('Locales')).toBeInTheDocument();
    expect(screen.getByText('Externos')).toBeInTheDocument();
    expect(screen.getByText('Conexiones')).toBeInTheDocument();
  });

  test('cambia entre vista de grafo y vista geográfica', () => {
    render(<NetworkMap />);
    
    // Por defecto muestra vista de grafo
    expect(screen.getByTestId('graph-view')).toBeInTheDocument();
    expect(screen.queryByTestId('geo-view')).not.toBeInTheDocument();
    
    // Cambia a vista geográfica
    const geoButton = screen.getByText('Mapa');
    fireEvent.click(geoButton);
    
    expect(screen.queryByTestId('graph-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('geo-view')).toBeInTheDocument();
  });

  test('deshabilita botón de mapa cuando no hay datos de geolocalización', () => {
    const dataWithoutGeo = {
      ...mockMapData,
      nodes: [
        {
          id: '1',
          label: '192.168.1.1',
          isLocal: true,
          networkType: 'Local',
          traffic: 100,
        },
      ],
    };

    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      mapData: dataWithoutGeo,
    });

    render(<NetworkMap />);
    
    const geoButton = screen.getByText('Mapa').closest('button');
    expect(geoButton).toBeDisabled();
  });

  test('toggle de auto-refresh funciona correctamente', () => {
    const mockSetAutoRefresh = vi.fn();
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      setAutoRefresh: mockSetAutoRefresh,
    });

    render(<NetworkMap />);
    
    const autoRefreshToggle = screen.getByRole('checkbox');
    fireEvent.click(autoRefreshToggle);
    
    expect(mockSetAutoRefresh).toHaveBeenCalledWith(true);
  });

  test('botón de refresh llama a la función refresh', () => {
    const mockRefresh = vi.fn();
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      refresh: mockRefresh,
    });

    render(<NetworkMap />);
    
    const refreshButton = screen.getByText('↻');
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('muestra panel de información del nodo seleccionado en vista de grafo', async () => {
    const mockSetSelectedNode = vi.fn();
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      selectedNode: mockMapData.nodes[0],
      setSelectedNode: mockSetSelectedNode,
    });

    render(<NetworkMap />);
    
    expect(screen.getByTestId('node-info-panel')).toBeInTheDocument();
    expect(screen.getByTestId('node-label')).toHaveTextContent('192.168.1.1');
  });

  test('cierra panel de información del nodo', () => {
    const mockSetSelectedNode = vi.fn();
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      selectedNode: mockMapData.nodes[0],
      setSelectedNode: mockSetSelectedNode,
    });

    render(<NetworkMap />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockSetSelectedNode).toHaveBeenCalledWith(null);
  });

  test('muestra leyenda del grafo en vista de grafo', () => {
    render(<NetworkMap />);
    
    expect(screen.getByText('IPs Locales')).toBeInTheDocument();
    expect(screen.getByText('IPs Externas')).toBeInTheDocument();
  });

  test('no muestra panel de info del nodo en vista geográfica', () => {
    mockUseNetworkMap.mockReturnValue({
      ...defaultHookReturn,
      selectedNode: mockMapData.nodes[0],
    });

    render(<NetworkMap />);
    
    // Cambia a vista geográfica
    const geoButton = screen.getByText('Mapa');
    fireEvent.click(geoButton);
    
    // El panel no debe estar visible en vista geo
    expect(screen.queryByTestId('node-info-panel')).not.toBeInTheDocument();
  });

  test('botones de vista tienen clases activas correctas', () => {
    render(<NetworkMap />);
    
    const graphButton = screen.getByText('Grafo');
    const geoButton = screen.getByText('Mapa');
    
    // Por defecto, grafo está activo
    expect(graphButton.parentElement).toHaveClass('active');
    expect(geoButton.parentElement).not.toHaveClass('active');
    
    // Después de hacer clic en geo
    fireEvent.click(geoButton);
    
    expect(graphButton.parentElement).not.toHaveClass('active');
    expect(geoButton.parentElement).toHaveClass('active');
  });
});
