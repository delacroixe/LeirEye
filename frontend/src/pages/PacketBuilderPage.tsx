import {
  ArrowRight,
  Cpu,
  Globe,
  Layers,
  Network,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
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
      // Llamar al servicio de IA para obtener sugerencias
      const response = await apiService.getAIPacketSuggestion({
        protocol,
        srcIp,
        dstIp,
        srcPort,
        dstPort,
        query,
      });

      setAiAssistant({
        suggestion: response.suggestion || "Configuración sugerida lista",
        explanation:
          response.explanation ||
          "Esta configuración es válida para tu propósito.",
        securityTip: response.securityTip,
      });
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
    <div className="packet-builder-page">
      {/* Header */}
      <div className="builder-header">
        <div className="header-title">
          <div className="title-icon">
            <Send size={28} />
          </div>
          <div>
            <h1>Packet Builder</h1>
            <p>Construye y envía paquetes de red con ayuda de IA</p>
          </div>
        </div>

        <button
          className="ai-magic-btn"
          onClick={generateWithAI}
          disabled={isAiLoading}
        >
          <Wand2 size={18} />
          <span>{isAiLoading ? "Generando..." : "IA Mágica"}</span>
          <Sparkles size={14} className="sparkle" />
        </button>
      </div>

      <PageHelp content={PAGE_HELP.packetBuilder} />

      <div className="builder-content">
        {/* Panel izquierdo: Constructor visual */}
        <div className="builder-main">
          {/* Selector de protocolo */}
          <div className="protocol-selector">
            <h3>Protocolo</h3>
            <div className="protocol-buttons">
              {protocols.map((p) => (
                <button
                  key={p.id}
                  className={`protocol-btn ${protocol === p.id ? "active" : ""}`}
                  style={{ "--protocol-color": p.color } as React.CSSProperties}
                  onClick={() => setProtocol(p.id)}
                >
                  {p.icon}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visualización de capas del paquete */}
          <div className={`packet-layers ${animatePacket ? "animate" : ""}`}>
            {/* Capa IP */}
            <div className="layer ip-layer">
              <div className="layer-header">
                <Globe size={18} />
                <span>Capa IP (Layer 3)</span>
              </div>
              <div className="layer-fields">
                <div className="field-group">
                  <label>IP Origen</label>
                  <input
                    type="text"
                    value={srcIp}
                    onChange={(e) => setSrcIp(e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="field-arrow">
                  <ArrowRight size={20} />
                </div>
                <div className="field-group">
                  <label>IP Destino</label>
                  <input
                    type="text"
                    value={dstIp}
                    onChange={(e) => setDstIp(e.target.value)}
                    placeholder="8.8.8.8"
                    className={!dstIp ? "required" : ""}
                  />
                </div>
                <div className="field-group small">
                  <label>TTL</label>
                  <input
                    type="number"
                    value={ttl}
                    onChange={(e) => setTtl(parseInt(e.target.value) || 64)}
                    min={1}
                    max={255}
                  />
                </div>
              </div>
            </div>

            {/* Capa de Transporte */}
            <div
              className="layer transport-layer"
              style={
                {
                  "--layer-color": currentProtocol?.color,
                } as React.CSSProperties
              }
            >
              <div className="layer-header">
                <Cpu size={18} />
                <span>Capa {protocol} (Layer 4)</span>
              </div>
              <div className="layer-fields">
                {(protocol === "TCP" ||
                  protocol === "UDP" ||
                  protocol === "DNS" ||
                  protocol === "HTTP") && (
                  <>
                    <div className="field-group">
                      <label>Puerto Origen</label>
                      <input
                        type="number"
                        value={srcPort}
                        onChange={(e) =>
                          setSrcPort(parseInt(e.target.value) || 0)
                        }
                        min={1}
                        max={65535}
                      />
                    </div>
                    <div className="field-arrow">
                      <ArrowRight size={20} />
                    </div>
                    <div className="field-group">
                      <label>Puerto Destino</label>
                      <input
                        type="number"
                        value={dstPort}
                        onChange={(e) =>
                          setDstPort(parseInt(e.target.value) || 0)
                        }
                        min={1}
                        max={65535}
                      />
                    </div>
                  </>
                )}

                {protocol === "ICMP" && (
                  <div className="field-group">
                    <label>Tipo ICMP</label>
                    <select
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

                {protocol === "TCP" && (
                  <div className="tcp-flags">
                    <label>Flags TCP</label>
                    <div className="flags-grid">
                      {Object.entries(tcpFlags).map(([flag, value]) => (
                        <label
                          key={flag}
                          className={`flag-toggle ${value ? "active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setTcpFlags((prev) => ({
                                ...prev,
                                [flag]: e.target.checked,
                              }))
                            }
                          />
                          <span>{flag.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Capa de Datos */}
            <div className="layer payload-layer">
              <div className="layer-header">
                <Layers size={18} />
                <span>Payload (Datos)</span>
              </div>
              <div className="layer-fields">
                <div className="field-group full">
                  <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Escribe aquí los datos a enviar o describe qué quieres hacer..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview hexadecimal */}
          <div className="hex-preview">
            <div className="preview-header">
              <span>Vista Hexadecimal</span>
              <span className="preview-bytes">
                {Math.ceil(previewHex.replace(/\s/g, "").length / 2)} bytes
              </span>
            </div>
            <code>{previewHex || "00 00 00 00 ..."}</code>
          </div>

          {/* Botón de envío */}
          <div className="send-section">
            <button
              className={`send-btn ${isSending ? "sending" : ""}`}
              onClick={sendPacket}
              disabled={isSending || !dstIp}
            >
              {isSending ? (
                <>
                  <div className="send-spinner" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Enviar Paquete</span>
                </>
              )}
            </button>

            {sendResult && (
              <div
                className={`send-result ${sendResult.success ? "success" : "error"}`}
              >
                {sendResult.success ? "✅" : "❌"} {sendResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: IA y plantillas */}
        <div className="builder-sidebar">
          {/* Asistente IA */}
          <div className="ai-assistant">
            <div className="ai-header">
              <Sparkles size={20} />
              <h3>Asistente IA</h3>
            </div>

            <div className="ai-input">
              <input
                type="text"
                placeholder="¿Qué quieres hacer? Ej: hacer ping, consultar DNS..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askAI((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                onClick={() => askAI("ayuda general")}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  <Wand2 size={16} />
                )}
              </button>
            </div>

            {aiAssistant && (
              <div className="ai-response">
                <div className="ai-suggestion">
                  <strong>💡 Sugerencia:</strong>
                  <p>{aiAssistant.suggestion}</p>
                </div>
                <div className="ai-explanation">
                  <strong>📚 Explicación:</strong>
                  <p>{aiAssistant.explanation}</p>
                </div>
                {aiAssistant.securityTip && (
                  <div className="ai-security">
                    <strong>🔐 Seguridad:</strong>
                    <p>{aiAssistant.securityTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plantillas rápidas */}
          <div className="quick-templates">
            <h3>Plantillas Rápidas</h3>
            <div className="templates-grid">
              {templates.map((template, idx) => (
                <button
                  key={idx}
                  className="template-btn"
                  onClick={() => applyTemplate(template)}
                >
                  {protocols.find((p) => p.id === template.protocol)?.icon}
                  <span>{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips educativos */}
          <div className="edu-tips">
            <h3>📖 ¿Sabías que...?</h3>
            <div className="tip-content">
              {protocol === "TCP" && (
                <p>
                  TCP usa un <strong>handshake de 3 vías</strong> (SYN → SYN-ACK
                  → ACK) para establecer conexiones confiables antes de enviar
                  datos.
                </p>
              )}
              {protocol === "UDP" && (
                <p>
                  UDP es <strong>"dispara y olvida"</strong> - no verifica si el
                  paquete llegó, pero es mucho más rápido que TCP para streaming
                  y juegos.
                </p>
              )}
              {protocol === "ICMP" && (
                <p>
                  El comando <strong>ping</strong> usa ICMP Echo Request (tipo
                  8) y espera una respuesta Echo Reply (tipo 0) para medir
                  latencia.
                </p>
              )}
              {protocol === "DNS" && (
                <p>
                  Las consultas DNS traducen nombres como{" "}
                  <strong>google.com</strong> a direcciones IP. Normalmente usan
                  UDP puerto 53.
                </p>
              )}
              {protocol === "HTTP" && (
                <p>
                  HTTP corre sobre TCP puerto 80. Los métodos más comunes son
                  <strong> GET</strong> (obtener) y <strong>POST</strong>{" "}
                  (enviar datos).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacketBuilderPage;
