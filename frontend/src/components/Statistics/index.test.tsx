import { render, screen, waitFor } from "@testing-library/react";
import apiService from "../../services/api";
import Statistics from "./index";

// Mock the API service
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getStatsSummary: jest.fn(),
  },
}));

// Mock child components to simplify testing
jest.mock("./StatsCards", () => {
  return function MockStatsCards() {
    return <div data-testid="stats-cards">StatsCards Mock</div>;
  };
});

jest.mock("./TopIPsTable", () => {
  return function MockTopIPsTable() {
    return <div data-testid="top-ips-table">TopIPsTable Mock</div>;
  };
});

jest.mock("./TopPortsChart", () => {
  return function MockTopPortsChart() {
    return <div data-testid="top-ports-chart">TopPortsChart Mock</div>;
  };
});

jest.mock("../ProcessPacketStats", () => {
  return function MockProcessPacketStats() {
    return (
      <div data-testid="process-packet-stats">ProcessPacketStats Mock</div>
    );
  };
});

const mockStatsData = {
  total_packets: 1000,
  tcp: 600,
  udp: 300,
  icmp: 50,
  other: 50,
  top_src_ips: { "192.168.1.1": 500 },
  top_dst_ips: { "8.8.8.8": 300 },
  top_ports: { "80": 400, "443": 300 },
};

describe("Statistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title after loading", async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(
        screen.getByText("Estadísticas en Tiempo Real"),
      ).toBeInTheDocument();
    });
  });

  test("shows loading state initially", () => {
    (apiService.getStatsSummary as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<Statistics />);

    expect(screen.getByText("Cargando estadísticas...")).toBeInTheDocument();
  });

  test("fetches and displays stats on mount", async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(apiService.getStatsSummary).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("stats-cards")).toBeInTheDocument();
      expect(screen.getByTestId("top-ips-table")).toBeInTheDocument();
      expect(screen.getByTestId("top-ports-chart")).toBeInTheDocument();
    });
  });

  test("shows empty message when no stats available", async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(null);

    render(<Statistics />);

    await waitFor(() => {
      expect(
        screen.getByText("No hay datos de estadísticas disponibles"),
      ).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (apiService.getStatsSummary as jest.Mock).mockRejectedValue(
      new Error("API Error"),
    );

    render(<Statistics />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error cargando estadísticas:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  test("renders ProcessPacketStats when packets and processes provided", async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    const packets = [{ id: 1 }];
    const processes = [{ pid: 123 }];

    render(<Statistics packets={packets} processes={processes} />);

    await waitFor(() => {
      expect(screen.getByTestId("process-packet-stats")).toBeInTheDocument();
    });
  });

  test("does not render ProcessPacketStats when no packets and processes", async () => {
    (apiService.getStatsSummary as jest.Mock).mockResolvedValue(mockStatsData);

    render(<Statistics />);

    await waitFor(() => {
      expect(
        screen.queryByTestId("process-packet-stats"),
      ).not.toBeInTheDocument();
    });
  });
});
