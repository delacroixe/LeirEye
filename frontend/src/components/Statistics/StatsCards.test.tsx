import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCards from './StatsCards';
import { StatsData } from '../../services/api';

describe('StatsCards', () => {
  const mockStats: StatsData = {
    total_packets: 1000,
    tcp: 600,
    udp: 300,
    icmp: 50,
    other: 50,
    top_src_ips: {},
    top_dst_ips: {},
    top_ports: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all stat cards with correct values', () => {
    render(<StatsCards stats={mockStats} prevStats={null} />);
    
    expect(screen.getByText('Total Paquetes')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('UDP')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('ICMP')).toBeInTheDocument();
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('Otros')).toBeInTheDocument();
  });

  test('calculates and displays correct percentages', () => {
    render(<StatsCards stats={mockStats} prevStats={null} />);
    
    // TCP: 600/1000 = 60.0%
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    // UDP: 300/1000 = 30.0%
    expect(screen.getByText('30.0%')).toBeInTheDocument();
    // ICMP: 50/1000 = 5.0% and Other: 50/1000 = 5.0%
    // There will be two 5.0% values
    expect(screen.getAllByText('5.0%').length).toBe(2);
  });

  test('shows change indicator when prevStats provided and value increased', () => {
    const prevStats: StatsData = {
      total_packets: 900,
      tcp: 550,
      udp: 250,
      icmp: 40,
      other: 60,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {},
    };

    render(<StatsCards stats={mockStats} prevStats={prevStats} />);
    
    // Total packets increased from 900 to 1000 (+100)
    expect(screen.getByText('↑ +100')).toBeInTheDocument();
    // TCP increased from 550 to 600 (+50) and UDP increased from 250 to 300 (+50)
    // There will be two +50 changes
    expect(screen.getAllByText('↑ +50').length).toBe(2);
  });

  test('shows change indicator when prevStats provided and value decreased', () => {
    const prevStats: StatsData = {
      total_packets: 1100,
      tcp: 600,
      udp: 300,
      icmp: 50,
      other: 150,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {},
    };

    render(<StatsCards stats={mockStats} prevStats={prevStats} />);
    
    // Total decreased from 1100 to 1000 (-100) and Other decreased from 150 to 50 (-100)
    // There will be two -100 changes
    expect(screen.getAllByText('↓ -100').length).toBe(2);
  });

  test('does not show change indicator when prevStats is null', () => {
    render(<StatsCards stats={mockStats} prevStats={null} />);
    
    // No change indicators should be present
    const changeUp = screen.queryByText(/↑/);
    const changeDown = screen.queryByText(/↓/);
    expect(changeUp).not.toBeInTheDocument();
    expect(changeDown).not.toBeInTheDocument();
  });

  test('does not show change indicator when values are the same', () => {
    const prevStats: StatsData = { ...mockStats };

    render(<StatsCards stats={mockStats} prevStats={prevStats} />);
    
    // No change indicators should be present for unchanged values
    const changeIndicators = screen.queryAllByText(/↑|↓/);
    expect(changeIndicators.length).toBe(0);
  });

  test('handles zero total packets gracefully', () => {
    const zeroStats: StatsData = {
      total_packets: 0,
      tcp: 0,
      udp: 0,
      icmp: 0,
      other: 0,
      top_src_ips: {},
      top_dst_ips: {},
      top_ports: {},
    };

    // Should not crash - the component uses || 1 to avoid division by zero
    render(<StatsCards stats={zeroStats} prevStats={null} />);
    
    // There will be multiple zeros (one for each stat)
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
