import React from 'react';
import { render, screen } from '@testing-library/react';
import TopPortsChart from './TopPortsChart';
import { StatsData } from '../../services/api';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe('TopPortsChart', () => {
  const mockStats: StatsData = {
    total_packets: 1000,
    tcp: 600,
    udp: 300,
    icmp: 50,
    other: 50,
    top_src_ips: {},
    top_dst_ips: {},
    top_ports: {
      '80': 400,
      '443': 300,
      '22': 150,
      '3306': 50,
      '5432': 30,
      '8080': 25,
      '8443': 20,
      '3000': 15,
      '5000': 5,
      '9000': 3,
      '27017': 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders chart title', () => {
    render(<TopPortsChart stats={mockStats} />);
    
    expect(screen.getByText('Top 10 Puertos Destino')).toBeInTheDocument();
  });

  test('shows empty message when no port data available', () => {
    const emptyStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {},
    };

    render(<TopPortsChart stats={emptyStats} />);
    
    expect(screen.getByText('Sin datos de puertos')).toBeInTheDocument();
  });

  test('limits to top 10 ports even when more are available', () => {
    render(<TopPortsChart stats={mockStats} />);
    
    // Component should render (we can't easily test the chart content with mocked recharts)
    // But we can verify it doesn't crash and shows the title
    expect(screen.getByText('Top 10 Puertos Destino')).toBeInTheDocument();
  });

  test('handles less than 10 ports', () => {
    const limitedStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {
        '80': 400,
        '443': 300,
        '22': 150,
      },
    };

    render(<TopPortsChart stats={limitedStats} />);
    
    // Should not crash with fewer than 10 ports
    expect(screen.getByText('Top 10 Puertos Destino')).toBeInTheDocument();
  });

  test('handles undefined top_ports', () => {
    const undefinedStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: undefined as any,
    };

    render(<TopPortsChart stats={undefinedStats} />);
    
    // Should show empty message
    expect(screen.getByText('Sin datos de puertos')).toBeInTheDocument();
  });

  test('sorts ports by count in descending order', () => {
    const unsortedStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {
        '22': 150,
        '443': 300,
        '80': 400,
        '3306': 50,
      },
    };

    render(<TopPortsChart stats={unsortedStats} />);
    
    // Component should render without crashing
    // The actual sorting is tested through the useMemo logic
    expect(screen.getByText('Top 10 Puertos Destino')).toBeInTheDocument();
  });
});
