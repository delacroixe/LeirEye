import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NodeInfoPanel from './NodeInfoPanel';
import { NetworkMapNode } from '../../services/api';

describe('NodeInfoPanel', () => {
  const mockOnClose = vi.fn();

  const localNode: NetworkMapNode = {
    id: '1',
    label: '192.168.1.1',
    isLocal: true,
    networkType: 'Local',
    traffic: 100,
  };

  const externalNodeWithGeo: NetworkMapNode = {
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
  };

  const externalNodeWithoutGeo: NetworkMapNode = {
    id: '3',
    label: '10.0.0.1',
    isLocal: false,
    networkType: 'External',
    traffic: 30,
    geo: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el panel con información del nodo', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('muestra icono correcto para nodo local', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  test('muestra icono correcto para nodo externo', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  test('muestra tipo de red correctamente', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(screen.getByText('Tipo de red')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
  });

  test('muestra badge local para nodos locales', () => {
    const { container } = render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    const badge = container.querySelector('.type-badge.local');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Local');
  });

  test('muestra badge external para nodos externos', () => {
    const { container } = render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    const badge = container.querySelector('.type-badge.external');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('External');
  });

  test('formatea correctamente el número de paquetes con separadores', () => {
    const nodeWithHighTraffic: NetworkMapNode = {
      ...localNode,
      traffic: 1234567,
    };

    render(<NodeInfoPanel node={nodeWithHighTraffic} onClose={mockOnClose} />);
    
    // toLocaleString formatea el número con separadores
    expect(screen.getByText(/1,234,567|1.234.567/)).toBeInTheDocument();
  });

  test('muestra sección de geolocalización para nodos externos con geo', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    expect(screen.getByText('📍 Ubicación')).toBeInTheDocument();
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Ciudad')).toBeInTheDocument();
    expect(screen.getByText('ISP')).toBeInTheDocument();
    expect(screen.getByText('Coordenadas')).toBeInTheDocument();
  });

  test('muestra información geográfica correcta', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    expect(screen.getByText(/US USA/)).toBeInTheDocument();
    expect(screen.getByText('Mountain View')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  test('muestra coordenadas formateadas con 3 decimales', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    expect(screen.getByText(/37.386, -122.084/)).toBeInTheDocument();
  });

  test('no muestra sección de geolocalización para nodos locales', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(screen.queryByText('📍 Ubicación')).not.toBeInTheDocument();
    expect(screen.queryByText('País')).not.toBeInTheDocument();
  });

  test('no muestra sección de geolocalización para nodos externos sin geo', () => {
    render(<NodeInfoPanel node={externalNodeWithoutGeo} onClose={mockOnClose} />);
    
    expect(screen.queryByText('📍 Ubicación')).not.toBeInTheDocument();
    expect(screen.queryByText('País')).not.toBeInTheDocument();
  });

  test('llama a onClose cuando se hace clic en el botón de cerrar', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renderiza el botón de cerrar correctamente', () => {
    const { container } = render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    const closeButton = container.querySelector('.panel-close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent('×');
  });

  test('tiene estructura correcta del panel', () => {
    const { container } = render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(container.querySelector('.node-panel')).toBeInTheDocument();
    expect(container.querySelector('.panel-header')).toBeInTheDocument();
    expect(container.querySelector('.panel-content')).toBeInTheDocument();
  });

  test('muestra título del panel con label del nodo', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    const title = screen.getByText('8.8.8.8');
    expect(title.closest('.panel-header')).toBeInTheDocument();
  });

  test('renderiza todas las filas de información básica', () => {
    render(<NodeInfoPanel node={localNode} onClose={mockOnClose} />);
    
    expect(screen.getByText('Tipo de red')).toBeInTheDocument();
    expect(screen.getByText('Paquetes')).toBeInTheDocument();
  });

  test('renderiza todas las filas de información geográfica', () => {
    render(<NodeInfoPanel node={externalNodeWithGeo} onClose={mockOnClose} />);
    
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Ciudad')).toBeInTheDocument();
    expect(screen.getByText('ISP')).toBeInTheDocument();
    expect(screen.getByText('Coordenadas')).toBeInTheDocument();
  });

  test('maneja nodos con tráfico cero', () => {
    const nodeWithZeroTraffic: NetworkMapNode = {
      ...localNode,
      traffic: 0,
    };

    render(<NodeInfoPanel node={nodeWithZeroTraffic} onClose={mockOnClose} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('maneja diferentes tipos de red', () => {
    const customNode: NetworkMapNode = {
      ...localNode,
      networkType: 'Custom Type',
    };

    render(<NodeInfoPanel node={customNode} onClose={mockOnClose} />);
    
    expect(screen.getByText('Custom Type')).toBeInTheDocument();
  });
});
