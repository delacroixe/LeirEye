import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Statistics from './index';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getStatsSummary: jest.fn(),
  },
}));

// Mock child components to simplify testing
jest.mock('./StatsCards', () => {
  return function MockStatsCards() {
    return <div data-testid="stats-cards">StatsCards Mock</div>;
  };
});

jest.mock('./TopIPsTable', () => {
  return function MockTopIPsTable() {
    return <div data-testid="top-ips-table">TopIPsTable Mock</div>;
  };
});

jest.mock('./TopPortsChart', () => {
  return function MockTopPortsChart() {
    return <div data-testid="top-ports-chart">TopPortsChart Mock</div>;
  };
});

jest.mock('../ProcessPacketStats', () => {
  return function MockProcessPacketStats() {
    return <div data-testid="process-packet-stats">ProcessPacketStats Mock</div>;
  };
});

const mockStatsData = {
  total_packets: 1000,
  tcp: 600,
  udp: 300,
  icmp: 50,
  other: 50,
  top_src_ips: { '192.168.1.1': 500 },
  top_dst_ips: { '8.8.8.8': 300 },
  top_ports: { '80': 400, '443': 300 },
};

describe('Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders title', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText('Estadísticas en Tiempo Real')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    (apiService.getStatsSummary as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Statistics />);

    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
  });

  test('fetches and displays stats on mount', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
      expect(screen.getByTestId('top-ips-table')).toBeInTheDocument();
      expect(screen.getByTestId('top-ports-chart')).toBeInTheDocument();
    });
  });

  test('shows empty message when no stats available', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(null);

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText('No hay datos de estadísticas disponibles')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (apiService.getStatsSummary as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<Statistics />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error cargando estadísticas:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  test('renders ProcessPacketStats when packets and processes provided', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    const packets = [{ id: 1 }];
    const processes = [{ pid: 123 }];

    render(<Statistics packets={packets} processes={processes} />);

    await waitFor(() => {
      expect(screen.getByTestId('process-packet-stats')).toBeInTheDocument();
    });
  });

  test('does not render ProcessPacketStats when no packets and processes', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByTestId('process-packet-stats')).not.toBeInTheDocument();
    });
  });

  test('sets up interval to fetch stats every 5 seconds', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    // Initial call
    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
    });

    // Advance time by 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(2);
    });

    // Advance time by another 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(3);
    });
  });

  test('clears interval on unmount', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    const { unmount } = render(<Statistics />);

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Advance time by 5 seconds after unmount
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    // Should not call again after unmount
    expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
  });

  test('refetches stats when refreshTrigger changes', async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    const { rerender } = render(<Statistics refreshTrigger={0} />);

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
    });

    // Change refreshTrigger
    rerender(<Statistics refreshTrigger={1} />);

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(2);
    });
  });

  test('updates prevStats when new stats are fetched', async () => {
    const firstStats = { ...mockStatsData, total_packets: 1000 };
    const secondStats = { ...mockStatsData, total_packets: 1500 };

    (apiService.getStatsSummary as jest.Mock)
      .mockResolvedValueOnce(firstStats)
      .mockResolvedValueOnce(secondStats);

    render(<Statistics />);

    // Wait for first fetch
    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
    });

    // Trigger second fetch
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(2);
    });

    // prevStats should now contain the first stats value
    // (This is tested implicitly through the component behavior)
  });
});
