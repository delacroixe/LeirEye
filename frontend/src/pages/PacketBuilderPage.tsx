import {
  AlertTriangle,
  Globe,
  Layers,
  Network,
  RefreshCw,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PageHelp, { PAGE_HELP } from "../components/PageHelp";
import apiService from "../services/api";
import "./PacketBuilderPage.css";

type Protocol = "TCP" | "UDP" | "ICMP" | "DNS" | "HTTP";

interface AIAssistant {
  suggestion: string;
  explanation: string;
  securityTip?: string;
}

const PacketBuilderPage: React.FC = () => {
  const [protocol, setProtocol] = useState<Protocol>("TCP");
  const [srcIp, setSrcIp] = useState("192.168.1.100");
  const [dstIp, setDstIp] = useState("");
  const [srcPort, setSrcPort] = useState(45678);
  const [dstPort, setDstPort] = useState(80);
  const [payload, setPayload] = useState("");
  const [tcpFlags, setTcpFlags] = useState({
    syn: false,
    ack: false,
    fin: false,
    rst: false,
    psh: false,
    urg: false,
  });
  const [icmpType, setIcmpType] = useState(8); // Echo request
  const [ttl, setTtl] = useState(64);

  const [aiAssistant, setAiAssistant] = useState<AIAssistant | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [previewHex, setPreviewHex] = useState<string>("");
  const [animatePacket, setAnimatePacket] = useState(false);

  // Protocolos disponibles con colores temáticos
  const protocols: {
    id: Protocol;
    name: string;
    color: string;
    icon: React.ReactNode;
  }[] = [
    { id: "TCP", name: "TCP", color: "#64c8ff", icon: <Network size={20} /> },
    { id: "UDP", name: "UDP", color: "#a78bfa", icon: <Zap size={20} /> },
    {
      id: "ICMP",
      name: "ICMP",
      color: "#fbbf24",
      icon: <RefreshCw size={20} />,
    },
    { id: "DNS", name: "DNS", color: "#34d399", icon: <Globe size={20} /> },
    { id: "HTTP", name: "HTTP", color: "#f472b6", icon: <Layers size={20} /> },
  ];

  // Plantillas predefinidas
  const templates = [
    {
      name: "Ping (ICMP Echo)",
      protocol: "ICMP" as Protocol,
      preset: { icmpType: 8 },
    },
    {
      name: "HTTP GET",
      protocol: "HTTP" as Protocol,
      preset: {
        dstPort: 80,
        payload: "GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
      },
    },
    { name: "DNS Query", protocol: "DNS" as Protocol, preset: { dstPort: 53 } },
    {
      name: "TCP SYN",
      protocol: "TCP" as Protocol,
      preset: { dstPort: 80, flags: { syn: true } },
    },
    {
      name: "TCP FIN",
      protocol: "TCP" as Protocol,
      preset: { flags: { fin: true, ack: true } },
    },
  ];

  // Generar preview hexadecimal simulado
  useEffect(() => {
    const generateHexPreview = () => {
      const parts: string[] = [];

      // Simular cabecera IP
      parts.push("45 00"); // Version + IHL, TOS
      parts.push("00 28"); // Total Length
      parts.push("ab cd"); // Identification
      parts.push("40 00"); // Flags + Fragment
      parts.push(`00 ${ttl.toString(16).padStart(2, "0")}`); // TTL + Protocol

      // IPs simuladas
      srcIp.split(".").forEach((oct) =>
        parts.push(
          parseInt(oct || "0")
            .toString(16)
            .padStart(2, "0"),
        ),
      );
      dstIp.split(".").forEach((oct) =>
        parts.push(
          parseInt(oct || "0")
            .toString(16)
            .padStart(2, "0"),
        ),
      );

      // Puertos
      if (protocol === "TCP" || protocol === "UDP") {
        parts.push(((srcPort >> 8) & 0xff).toString(16).padStart(2, "0"));
        parts.push((srcPort & 0xff).toString(16).padStart(2, "0"));
        parts.push(((dstPort >> 8) & 0xff).toString(16).padStart(2, "0"));
        parts.push((dstPort & 0xff).toString(16).padStart(2, "0"));
      }

      setPreviewHex(parts.join(" ").toUpperCase());
    };

    generateHexPreview();
  }, [srcIp, dstIp, srcPort, dstPort, protocol, ttl]);

  // Solicitar ayuda de IA
  const askAI = async (query: string) => {
    setIsAiLoading(true);
    try {
      // Llamar al servicio de IA avanzado (Ollama)
      const response = await apiService.getCraftingHelpWithAI(query, protocol);

      if (response.error) throw new Error(response.error);

      setAiAssistant({
        suggestion: response.suggestion || "Configuración sugerida lista",
        explanation: "Análisis generado por el motor de IA local.",
        securityTip: "⚠️ Valida siempre los campos antes de la inyección.",
      });

      // Si la IA devolvió campos específicos, aplicarlos
      if (response.fields) {
        if (response.fields.dst_port) setDstPort(response.fields.dst_port);
        if (response.fields.payload) setPayload(response.fields.payload);
        if (response.fields.flags) {
          const newFlags = { ...tcpFlags };
          Object.keys(response.fields.flags).forEach((f) => {
            if (f in newFlags) (newFlags as any)[f] = response.fields.flags[f];
          });
          setTcpFlags(newFlags);
        }
      }
    } catch (error) {
      // Fallback con sugerencias locales si no hay IA disponible
      const suggestions = getLocalSuggestions(query);
      setAiAssistant(suggestions);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Sugerencias locales de fallback
  const getLocalSuggestions = (query: string): AIAssistant => {
    const q = query.toLowerCase();

    if (q.includes("ping") || q.includes("icmp")) {
      return {
        suggestion: "Usa ICMP Echo Request (tipo 8) para hacer ping",
        explanation:
          "El protocolo ICMP se usa para diagnóstico de red. El tipo 8 es una solicitud de eco que espera una respuesta tipo 0.",
        securityTip:
          "⚠️ Algunos firewalls bloquean ICMP. Úsalo solo en redes donde tengas permiso.",
      };
    }

    if (q.includes("web") || q.includes("http")) {
      return {
        suggestion: "TCP puerto 80 para HTTP o 443 para HTTPS",
        explanation:
          "Las conexiones web usan TCP con el handshake SYN→SYN-ACK→ACK antes de enviar datos.",
        securityTip:
          "✅ Usa puerto 443 (HTTPS) para conexiones seguras cifradas.",
      };
    }

    if (q.includes("dns")) {
      return {
        suggestion: "UDP puerto 53 para consultas DNS",
        explanation:
          "DNS normalmente usa UDP para consultas rápidas. Las respuestas grandes pueden usar TCP.",
        securityTip:
          "🔒 Considera usar DNS-over-HTTPS (DoH) para mayor privacidad.",
      };
    }

    return {
      suggestion: "Configura los campos según tu objetivo",
      explanation:
        "Cada protocolo tiene su propósito: TCP para conexiones confiables, UDP para velocidad, ICMP para diagnóstico.",
      securityTip: "⚠️ Solo envía paquetes a redes donde tengas autorización.",
    };
  };

  // Aplicar plantilla
  const applyTemplate = (template: (typeof templates)[0]) => {
    setProtocol(template.protocol);

    if (template.preset.dstPort) {
      setDstPort(template.preset.dstPort);
    }
    if (template.preset.payload) {
      setPayload(template.preset.payload);
    }
    if (template.preset.icmpType !== undefined) {
      setIcmpType(template.preset.icmpType);
    }
    if (template.preset.flags) {
      setTcpFlags((prev) => ({ ...prev, ...template.preset.flags }));
    }

    // Animar el cambio
    setAnimatePacket(true);
    setTimeout(() => setAnimatePacket(false), 500);
  };

  // Generar paquete con IA
  const generateWithAI = async () => {
    setIsAiLoading(true);

    try {
      const response = await apiService.generatePacketWithAI({
        intent: payload || "paquete de prueba",
        protocol,
      });

      if (response.config) {
        if (response.config.dstIp) setDstIp(response.config.dstIp);
        if (response.config.dstPort) setDstPort(response.config.dstPort);
        if (response.config.payload) setPayload(response.config.payload);
        if (response.config.ttl) setTtl(response.config.ttl);
      }

      setAiAssistant({
        suggestion: response.suggestion || "Paquete generado",
        explanation: response.explanation || "Configuración optimizada por IA",
        securityTip: response.securityTip,
      });
    } catch (error) {
      setAiAssistant({
        suggestion: "Generación manual",
        explanation:
          "La IA no está disponible. Configura los campos manualmente.",
        securityTip:
          "💡 Revisa la documentación de protocolos para más detalles.",
      });
    } finally {
      setIsAiLoading(false);
    }

    setAnimatePacket(true);
    setTimeout(() => setAnimatePacket(false), 500);
  };

  // Enviar paquete
  const sendPacket = async () => {
    if (!dstIp) {
      setSendResult({
        success: false,
        message: "Especifica una IP de destino",
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setAnimatePacket(true);

    try {
      const packetConfig = {
        protocol,
        src_ip: srcIp,
        dst_ip: dstIp,
        src_port: srcPort,
        dst_port: dstPort,
        payload,
        ttl,
        tcp_flags: protocol === "TCP" ? tcpFlags : undefined,
        icmp_type: protocol === "ICMP" ? icmpType : undefined,
      };

      const response = await apiService.sendCraftedPacket(packetConfig);

      setSendResult({
        success: true,
        message: response.message || `Paquete ${protocol} enviado a ${dstIp}`,
      });
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.response?.data?.detail || "Error al enviar el paquete",
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setAnimatePacket(false), 500);
    }
  };

  const currentProtocol = protocols.find((p) => p.id === protocol);

  return (
    <div className="view-container builder-view full-width-layout">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">Arquitecto de Protocolos</h1>
        </div>
        <div className="header-actions">
          <PageHelp content={PAGE_HELP.packetBuilder} pageId="packetBuilder" />
        </div>
      </header>

      <div className="view-content">
        <div className="builder-layout-grid">
          {/* Quick Presets - Horizontal List */}
          <div className="presets-horizontal-row">
            {templates.map((t, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => applyTemplate(t)}
              >
                <span className="preset-name">{t.name}</span>
              </button>
            ))}
          </div>

          {/* Main Configuration Area */}
          <div className="builder-config-column">
            {/* Protocol Selection Header */}
            <div className="protocol-selector-card glass-card">
              <h3 className="selector-title">Capa de Transporte (Select L4)</h3>
              <div className="protocol-options">
                {protocols.map((p) => (
                  <button
                    key={p.id}
                    className={`proto-opt ${protocol === p.id ? "active" : ""}`}
                    style={{ "--opt-color": p.color } as React.CSSProperties}
                    onClick={() => setProtocol(p.id)}
                  >
                    <div className="proto-icon-box">{p.icon}</div>
                    <span className="proto-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Packet Builder Stack */}
            <div
              className={`packet-construction-stack ${animatePacket ? "stack-pulse" : ""}`}
            >
              {/* L3 - Network Layer */}
              <div className="construction-layer layer-l3">
                <div className="layer-header">
                  <span className="layer-id">CAPA 3</span>
                  <span className="layer-name">RED / INTERNET</span>
                </div>
                <div className="layer-body">
                  <div className="input-group">
                    <label>IP Origen</label>
                    <input
                      type="text"
                      className="construct-input"
                      value={srcIp}
                      onChange={(e) => setSrcIp(e.target.value)}
                      placeholder="IP del emisor"
                    />
                  </div>
                  <div className="input-group">
                    <label>IP Destino</label>
                    <input
                      type="text"
                      className={`construct-input ${!dstIp ? "highlight-error" : ""}`}
                      value={dstIp}
                      onChange={(e) => setDstIp(e.target.value)}
                      placeholder="IP del receptor"
                    />
                  </div>
                  <div className="input-group small-input">
                    <label>TTL</label>
                    <input
                      type="number"
                      className="construct-input text-center"
                      value={ttl}
                      onChange={(e) => setTtl(parseInt(e.target.value) || 64)}
                    />
                  </div>
                </div>
              </div>

              {/* L4 - Transport Layer */}
              <div
                className="construction-layer layer-l4"
                style={
                  {
                    "--layer-accent": currentProtocol?.color,
                  } as React.CSSProperties
                }
              >
                <div className="layer-header">
                  <span className="layer-id">CAPA 4</span>
                  <span className="layer-name">TRANSPORTE / {protocol}</span>
                </div>
                <div className="layer-body">
                  {(["TCP", "UDP", "DNS", "HTTP"] as Protocol[]).includes(
                    protocol,
                  ) && (
                    <>
                      <div className="input-group">
                        <label>Puerto Origen</label>
                        <input
                          type="number"
                          className="construct-input"
                          value={srcPort}
                          onChange={(e) =>
                            setSrcPort(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="input-group">
                        <label>Puerto Destino</label>
                        <input
                          type="number"
                          className="construct-input"
                          value={dstPort}
                          onChange={(e) =>
                            setDstPort(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </>
                  )}

                  {protocol === "ICMP" && (
                    <div className="input-group grow">
                      <label>Tipo de Mensaje ICMPv4</label>
                      <select
                        className="construct-select"
                        value={icmpType}
                        onChange={(e) => setIcmpType(parseInt(e.target.value))}
                      >
                        <option value={8}>8 - Echo Request (Ping)</option>
                        <option value={0}>0 - Echo Reply</option>
                        <option value={3}>3 - Destination Unreachable</option>
                        <option value={11}>11 - Time Exceeded</option>
                      </select>
                    </div>
                  )}
                </div>

                {protocol === "TCP" && (
                  <div className="tcp-flags-config">
                    <label className="sub-label">Flags de Control</label>
                    <div className="flags-grid">
                      {Object.entries(tcpFlags).map(([flag, value]) => (
                        <label
                          key={flag}
                          className={`flag-check ${value ? "active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden-input"
                            checked={value}
                            onChange={(e) =>
                              setTcpFlags((prev) => ({
                                ...prev,
                                [flag]: e.target.checked,
                              }))
                            }
                          />
                          {flag.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* L7 - Application Layer */}
              <div className="construction-layer layer-l7">
                <div className="layer-header">
                  <span className="layer-id">CAPA 7</span>
                  <span className="layer-name">APLICACIÓN / CARGA ÚTIL</span>
                </div>
                <div className="layer-body">
                  <div className="input-group grow">
                    <label>Payload (Hex / Texto)</label>
                    <textarea
                      className="construct-textarea"
                      value={payload}
                      onChange={(e) => setPayload(e.target.value)}
                      placeholder="Inserta el mensaje o carga útil aquí..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Binary Preview & Action Footer */}
            <div className="builder-finalization glass-card">
              <div className="binary-preview">
                <div className="preview-label">
                  BINARIO DE SALIDA (RAW PREVIEW)
                </div>
                <div className="preview-content">
                  <code>{previewHex || "Esperando parámetros..."}</code>
                  <span className="byte-count">
                    {Math.ceil(previewHex.replace(/\s/g, "").length / 2)} BYTES
                  </span>
                </div>
              </div>
              <div className="action-row">
                <button
                  className={`inject-btn ${isSending ? "sending" : ""}`}
                  onClick={sendPacket}
                  disabled={isSending || !dstIp}
                >
                  <Zap size={18} className={isSending ? "pulse" : ""} />
                  <span>
                    {isSending ? "INYECTANDO TRÁFICO..." : "INYECTAR EN RED"}
                  </span>
                </button>

                {sendResult && (
                  <div
                    className={`inject-feedback ${sendResult.success ? "success" : "error"}`}
                  >
                    {sendResult.success ? (
                      <Zap size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    {sendResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacketBuilderPage;
