import React from 'react';
import { render, screen } from '@testing-library/react';
import TopIPsTable from './TopIPsTable';
import { StatsData } from '../../services/api';

describe('TopIPsTable', () => {
  const mockStats: StatsData = {
    total_packets: 1000,
    tcp: 600,
    udp: 300,
    icmp: 50,
    other: 50,
    top_src_ips: {
      '192.168.1.1': 500,
      '192.168.1.2': 300,
      '10.0.0.1': 100,
      '172.16.0.1': 50,
      '192.168.0.1': 30,
      '8.8.8.8': 20,
    },
    top_dst_ips: {},
    top_ports: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table title', () => {
    render(<TopIPsTable stats={mockStats} />);
    
    expect(screen.getByText('Top 5 IPs Origen')).toBeInTheDocument();
  });

  test('renders table headers', () => {
    render(<TopIPsTable stats={mockStats} />);
    
    expect(screen.getByText('IP Origen')).toBeInTheDocument();
    expect(screen.getByText('Paquetes')).toBeInTheDocument();
    expect(screen.getByText('% Total')).toBeInTheDocument();
  });

  test('renders top 5 IPs sorted by count', () => {
    render(<TopIPsTable stats={mockStats} />);
    
    // Should show only top 5, sorted by count
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('172.16.0.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.0.1')).toBeInTheDocument();
    
    // 6th IP should not be shown
    expect(screen.queryByText('8.8.8.8')).not.toBeInTheDocument();
  });

  test('displays packet counts correctly', () => {
    render(<TopIPsTable stats={mockStats} />);
    
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('calculates and displays correct percentages', () => {
    render(<TopIPsTable stats={mockStats} />);
    
    // 500/1000 = 50.0%
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    // 300/1000 = 30.0%
    expect(screen.getByText('30.0%')).toBeInTheDocument();
    // 100/1000 = 10.0%
    expect(screen.getByText('10.0%')).toBeInTheDocument();
    // 50/1000 = 5.0%
    expect(screen.getByText('5.0%')).toBeInTheDocument();
    // 30/1000 = 3.0%
    expect(screen.getByText('3.0%')).toBeInTheDocument();
  });

  test('shows empty message when no IP data available', () => {
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

    render(<TopIPsTable stats={emptyStats} />);
    
    expect(screen.getByText('Sin datos de IPs')).toBeInTheDocument();
    // Headers should not be visible
    expect(screen.queryByText('IP Origen')).not.toBeInTheDocument();
  });

  test('handles less than 5 IPs', () => {
    const limitedStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: {
        '192.168.1.1': 500,
        '192.168.1.2': 300,
      },
      top_dst_ips: {},
      top_ports: {},
    };

    render(<TopIPsTable stats={limitedStats} />);
    
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    // Should not crash, just show 2 rows
  });

  test('handles undefined top_src_ips', () => {
    const undefinedStats: StatsData = {
      total_packets: 1000,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 50,
      top_src_ips: undefined as any,
      top_dst_ips: {},
      top_ports: {},
    };

    render(<TopIPsTable stats={undefinedStats} />);
    
    // Should show empty message
    expect(screen.getByText('Sin datos de IPs')).toBeInTheDocument();
  });
});
