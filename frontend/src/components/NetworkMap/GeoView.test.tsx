import { render, screen } from "@testing-library/react";
import { NetworkMapData } from "../../services/api";
import GeoView from "./GeoView";

// Mock de CSS
jest.mock("leaflet/dist/leaflet.css", () => ({}));

// Mock de react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, center, zoom, style }: any) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      style={style}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url }: any) => (
    <div data-testid="tile-layer" data-url={url}></div>
  ),
  CircleMarker: ({ center, children }: any) => (
    <div data-testid="circle-marker" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Polyline: ({ positions, color }: any) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(positions)}
      data-color={color}
    ></div>
  ),
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

// Mock de leaflet
jest.mock("leaflet", () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
  latLngBounds: jest.fn((positions) => ({
    positions,
  })),
  latLng: jest.fn((lat, lon) => [lat, lon]),
}));

describe("GeoView", () => {
  const mockMapData: NetworkMapData = {
    nodes: [
      {
        id: "1",
        label: "192.168.1.1",
        isLocal: true,
        networkType: "Local",
        traffic: 100,
      },
      {
        id: "2",
        label: "8.8.8.8",
        isLocal: false,
        networkType: "External",
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
      {
        id: "3",
        label: "1.1.1.1",
        isLocal: false,
        networkType: "External",
        traffic: 30,
        geo: {
          country: "Australia",
          countryCode: "AU",
          city: "Sydney",
          isp: "Cloudflare",
          lat: -33.868,
          lon: 151.207,
        },
      },
    ],
    links: [
      { source: "1", target: "2", value: 10 },
      { source: "1", target: "3", value: 5 },
    ],
    summary: {
      total_nodes: 3,
      local_nodes: 1,
      external_nodes: 2,
      total_links: 2,
      total_connections: 2,
    },
  };

  const userLocation: [number, number] = [43.3, -2.0];

  test("renderiza el contenedor del mapa", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  test("renderiza la capa de tiles con URL correcto", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    const tileLayer = screen.getByTestId("tile-layer");
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute(
      "data-url",
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    );
  });

  test("muestra marcador central para la red local", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    const markers = screen.getAllByTestId("circle-marker");
    const localMarker = markers.find((marker) => {
      const center = JSON.parse(marker.getAttribute("data-center") || "[]");
      return center[0] === userLocation[0] && center[1] === userLocation[1];
    });

    expect(localMarker).toBeInTheDocument();
  });

  test("muestra información de la red local en popup", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    expect(screen.getByText("🏠 Tu Red Local")).toBeInTheDocument();
    expect(screen.getByText("dispositivos locales")).toBeInTheDocument();
    expect(screen.getByText("conexiones externas")).toBeInTheDocument();
  });

  test("renderiza marcadores para nodos externos con geolocalización", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    const markers = screen.getAllByTestId("circle-marker");
    // Debe haber 3 marcadores: 1 local + 2 externos
    expect(markers).toHaveLength(3);
  });

  test("no renderiza marcadores para nodos locales externos", () => {
    const dataWithLocalOnly: NetworkMapData = {
      nodes: [
        {
          id: "1",
          label: "192.168.1.1",
          isLocal: true,
          networkType: "Local",
          traffic: 100,
        },
      ],
      links: [],
      summary: {
        total_nodes: 1,
        local_nodes: 1,
        external_nodes: 0,
        total_links: 0,
        total_connections: 0,
      },
    };

    render(<GeoView mapData={dataWithLocalOnly} userLocation={userLocation} />);

    const markers = screen.getAllByTestId("circle-marker");
    // Solo debe haber 1 marcador (el local)
    expect(markers).toHaveLength(1);
  });

  test("muestra información de nodos externos en popups", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    expect(screen.getByText("🌐 8.8.8.8")).toBeInTheDocument();
    expect(screen.getByText(/Mountain View, USA/)).toBeInTheDocument();
    expect(screen.getByText(/Google/)).toBeInTheDocument();
  });

  test("renderiza líneas de conexión entre red local y nodos externos", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    const polylines = screen.getAllByTestId("polyline");
    // Debe haber 2 líneas (una por cada nodo externo)
    expect(polylines).toHaveLength(2);
  });

  test("líneas de conexión tienen colores basados en tráfico", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    const polylines = screen.getAllByTestId("polyline");

    polylines.forEach((polyline) => {
      const color = polyline.getAttribute("data-color");
      // Los colores deben ser uno de los definidos
      expect(["#ef4444", "#f59e0b", "#3b82f6"]).toContain(color);
    });
  });

  test("calcula color de tráfico alto correctamente", () => {
    const highTrafficData: NetworkMapData = {
      nodes: [
        {
          id: "1",
          label: "192.168.1.1",
          isLocal: true,
          networkType: "Local",
          traffic: 100,
        },
        {
          id: "2",
          label: "8.8.8.8",
          isLocal: false,
          networkType: "External",
          traffic: 60,
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
      links: [{ source: "1", target: "2", value: 10 }],
      summary: {
        total_nodes: 2,
        local_nodes: 1,
        external_nodes: 1,
        total_links: 1,
        total_connections: 1,
      },
    };

    render(<GeoView mapData={highTrafficData} userLocation={userLocation} />);

    const polyline = screen.getByTestId("polyline");
    expect(polyline.getAttribute("data-color")).toBe("#ef4444"); // Rojo para tráfico > 50
  });

  test("calcula color de tráfico medio correctamente", () => {
    const mediumTrafficData: NetworkMapData = {
      nodes: [
        {
          id: "1",
          label: "192.168.1.1",
          isLocal: true,
          networkType: "Local",
          traffic: 100,
        },
        {
          id: "2",
          label: "8.8.8.8",
          isLocal: false,
          networkType: "External",
          traffic: 35,
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
      links: [{ source: "1", target: "2", value: 10 }],
      summary: {
        total_nodes: 2,
        local_nodes: 1,
        external_nodes: 1,
        total_links: 1,
        total_connections: 1,
      },
    };

    render(<GeoView mapData={mediumTrafficData} userLocation={userLocation} />);

    const polyline = screen.getByTestId("polyline");
    expect(polyline.getAttribute("data-color")).toBe("#f59e0b"); // Naranja para tráfico 20-50
  });

  test("renderiza leyenda de tráfico", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    expect(screen.getByText("Nivel de tráfico")).toBeInTheDocument();
    expect(screen.getByText(/Bajo/)).toBeInTheDocument();
    expect(screen.getByText(/Medio/)).toBeInTheDocument();
    expect(screen.getByText(/Alto/)).toBeInTheDocument();
  });

  test("filtra nodos sin geolocalización", () => {
    const dataWithMissingGeo: NetworkMapData = {
      nodes: [
        {
          id: "1",
          label: "192.168.1.1",
          isLocal: true,
          networkType: "Local",
          traffic: 100,
        },
        {
          id: "2",
          label: "10.0.0.1",
          isLocal: false,
          networkType: "External",
          traffic: 50,
          geo: null,
        },
        {
          id: "3",
          label: "8.8.8.8",
          isLocal: false,
          networkType: "External",
          traffic: 30,
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
      links: [],
      summary: {
        total_nodes: 3,
        local_nodes: 1,
        external_nodes: 2,
        total_links: 0,
        total_connections: 0,
      },
    };

    render(
      <GeoView mapData={dataWithMissingGeo} userLocation={userLocation} />,
    );

    const markers = screen.getAllByTestId("circle-marker");
    // Solo debe haber 2 marcadores: 1 local + 1 externo con geo
    expect(markers).toHaveLength(2);
  });

  test("muestra cantidad correcta de paquetes en popups", () => {
    render(<GeoView mapData={mockMapData} userLocation={userLocation} />);

    // Verifica que los valores de tráfico están presentes en el documento
    const content = screen.getByTestId("map-container").textContent;
    expect(content).toContain("50");
    expect(content).toContain("30");
    expect(content).toContain("paquetes");
  });
});
