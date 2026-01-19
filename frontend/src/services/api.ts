import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

export interface PacketData {
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number | null;
  dst_port: number | null;
  protocol: string;
  length: number;
  payload_preview: string | null;
  flags: string | null;
  process_name?: string | null;
  pid?: number | null;
}

export interface CaptureStatus {
  is_running: boolean;
  packets_captured: number;
  interface: string | null;
  filter: string | null;
}

export interface StatsData {
  total_packets: number;
  tcp: number;
  udp: number;
  icmp: number;
  other: number;
  top_src_ips: Record<string, number>;
  top_dst_ips: Record<string, number>;
  top_ports: Record<string, number>;
}

export interface NetworkMapNode {
  id: string;
  label: string;
  isLocal: boolean;
  networkType: string;
  traffic: number;
  geo?: {
    country: string;
    countryCode: string;
    city: string;
    isp: string;
    lat: number;
    lon: number;
  } | null;
}

export interface NetworkMapLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkMapData {
  nodes: NetworkMapNode[];
  links: NetworkMapLink[];
  summary: {
    total_nodes: number;
    local_nodes: number;
    external_nodes: number;
    total_links: number;
    total_connections: number;
  };
}

class ApiService {
  async getInterfaces(): Promise<string[]> {
    const response = await axios.get<{ interfaces: string[] }>(`${API_BASE}/capture/interfaces`);
    return response.data.interfaces;
  }

  async startCapture(
    networkInterface?: string,
    filter?: string,
    maxPackets: number = 1000
  ) {
    return axios.post(`${API_BASE}/capture/start`, {
      interface: networkInterface,
      packet_filter: filter,
      max_packets: maxPackets,
    });
  }

  async stopCapture() {
    return axios.post(`${API_BASE}/capture/stop`);
  }

  async getStatus(): Promise<CaptureStatus> {
    const response = await axios.get<CaptureStatus>(`${API_BASE}/capture/status`);
    return response.data;
  }

  async getPackets(limit: number = 100) {
    const response = await axios.get(`${API_BASE}/capture/packets`, {
      params: { limit },
    });
    return response.data;
  }

  async clearPackets() {
    return axios.post(`${API_BASE}/capture/clear`);
  }

  async getStatsSummary(): Promise<StatsData> {
    const response = await axios.get<StatsData>(`${API_BASE}/stats/summary`);
    return response.data;
  }

  // ============ AI Services ============

  async getAIStatus(): Promise<{
    available: boolean;
    models: string[];
    has_required_model: boolean;
    required_model: string;
    install_hint?: string;
  }> {
    const response = await axios.get(`${API_BASE}/ai/status`);
    return response.data;
  }

  async explainPacket(packet: {
    protocol: string;
    src_ip: string;
    dst_ip: string;
    src_port?: number | null;
    dst_port?: number | null;
    flags?: string | null;
    length?: number;
    use_ai?: boolean;
  }): Promise<{
    source: string;
    app: string;
    explanation: string;
    security: string;
    learn: string;
    details: Record<string, any>;
  }> {
    const response = await axios.post(`${API_BASE}/ai/explain-packet`, {
      protocol: packet.protocol,
      src_ip: packet.src_ip,
      dst_ip: packet.dst_ip,
      src_port: packet.src_port || null,
      dst_port: packet.dst_port || null,
      flags: packet.flags || null,
      length: packet.length || 0,
      use_ai: packet.use_ai ?? true,
    });
    return response.data;
  }

  async getKnownPatterns(): Promise<{
    patterns_count: number;
    services_count: number;
    patterns: string[];
    services: string[];
  }> {
    const response = await axios.get(`${API_BASE}/ai/patterns`);
    return response.data;
  }

  // ============ Network Map ============

  async getNetworkMap(): Promise<NetworkMapData> {
    const response = await axios.get<NetworkMapData>(`${API_BASE}/stats/network-map`);
    return response.data;
  }
}

export default new ApiService();
