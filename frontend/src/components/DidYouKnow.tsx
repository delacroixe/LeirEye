import { ChevronLeft, ChevronRight, Lightbulb, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { PacketData } from "../services/api";
import "./DidYouKnow.css";

interface DidYouKnowProps {
  packets: PacketData[];
  autoRotate?: boolean;
  rotateInterval?: number;
}

interface Tip {
  id: string;
  category: "protocol" | "security" | "network" | "traffic" | "general";
  title: string;
  content: string;
  icon: string;
  relevance?: string;
}

// Tips estáticos educativos
const STATIC_TIPS: Tip[] = [
  {
    id: "tcp-handshake",
    category: "protocol",
    title: "El saludo de tres vías",
    content:
      "Antes de enviar datos, TCP realiza un 'handshake': SYN → SYN-ACK → ACK. Es como decir '¿Hola?' → '¡Hola! Te escucho' → 'Perfecto, empecemos'.",
    icon: "🤝",
  },
  {
    id: "dns-cache",
    category: "network",
    title: "Tu computadora tiene memoria",
    content:
      "Para no preguntar la IP de google.com cada vez, tu sistema guarda las respuestas DNS en caché. Por eso a veces ves menos queries DNS de las que esperarías.",
    icon: "🧠",
  },
  {
    id: "port-80-443",
    category: "protocol",
    title: "HTTP vs HTTPS",
    content:
      "El puerto 80 (HTTP) envía datos sin cifrar - cualquiera puede leerlos. El 443 (HTTPS) usa TLS para cifrar todo. ¡Siempre busca el candado en tu navegador!",
    icon: "🔐",
  },
  {
    id: "private-ips",
    category: "network",
    title: "IPs privadas vs públicas",
    content:
      "Las IPs que empiezan con 192.168, 10. o 172.16-31 son privadas (tu red local). No pueden comunicarse directamente con Internet sin un router que haga NAT.",
    icon: "🏠",
  },
  {
    id: "ttl-meaning",
    category: "protocol",
    title: "TTL no es tiempo",
    content:
      "El 'Time To Live' de un paquete no mide segundos, sino saltos. Cada router que cruza resta 1. Si llega a 0, el paquete muere. Esto evita loops infinitos.",
    icon: "⏱️",
  },
  {
    id: "icmp-ping",
    category: "protocol",
    title: "El eco de la red",
    content:
      "Cuando haces 'ping', envías un paquete ICMP Echo Request. Si el destino responde con Echo Reply, sabes que está vivo. Es el latido de Internet.",
    icon: "📡",
  },
  {
    id: "udp-speed",
    category: "protocol",
    title: "UDP: velocidad sobre fiabilidad",
    content:
      "A diferencia de TCP, UDP no confirma que los datos llegaron. Por eso es más rápido y se usa en videollamadas y juegos, donde un frame perdido importa menos que el retraso.",
    icon: "🚀",
  },
  {
    id: "dns-tunneling",
    category: "security",
    title: "Datos ocultos en DNS",
    content:
      "Malware sofisticado puede esconder datos en consultas DNS porque casi todos los firewalls permiten DNS. Se llama 'DNS Tunneling' y es difícil de detectar.",
    icon: "🕵️",
  },
  {
    id: "syn-flood",
    category: "security",
    title: "Ataque SYN Flood",
    content:
      "Un atacante envía miles de paquetes SYN sin completar el handshake. El servidor guarda estado para cada uno, agotando recursos. Por eso monitoreamos escaneos de puertos.",
    icon: "🌊",
  },
  {
    id: "arp-local",
    category: "network",
    title: "ARP: encontrando vecinos",
    content:
      "Antes de enviar datos en tu red local, tu computadora pregunta '¿Quién tiene esta IP?' usando ARP. La respuesta incluye la dirección MAC del dispositivo.",
    icon: "🔍",
  },
];

const DidYouKnow: React.FC<DidYouKnowProps> = ({
  packets,
  autoRotate = true,
  rotateInterval = 15000,
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tips, setTips] = useState<Tip[]>(STATIC_TIPS);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generar tips dinámicos basados en el tráfico
  const generateDynamicTips = useCallback((): Tip[] => {
    const dynamicTips: Tip[] = [];

    if (packets.length === 0) return dynamicTips;

    // Contar protocolos
    const protocolCounts: Record<string, number> = {};
    const portCounts: Record<number, number> = {};
    const ipCounts: Record<string, number> = {};

    packets.forEach((p) => {
      protocolCounts[p.protocol] = (protocolCounts[p.protocol] || 0) + 1;
      if (p.dst_port)
        portCounts[p.dst_port] = (portCounts[p.dst_port] || 0) + 1;
      ipCounts[p.dst_ip] = (ipCounts[p.dst_ip] || 0) + 1;
    });

    // Tip sobre protocolo dominante
    const dominantProtocol = Object.entries(protocolCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (dominantProtocol) {
      const [protocol, count] = dominantProtocol;
      const percentage = ((count / packets.length) * 100).toFixed(1);
      dynamicTips.push({
        id: `dynamic-protocol-${protocol}`,
        category: "traffic",
        title: `${protocol} domina tu tráfico`,
        content: `El ${percentage}% de tus paquetes son ${protocol}. ${
          protocol === "TCP"
            ? "Esto es normal - la mayoría del tráfico web usa TCP."
            : protocol === "UDP"
              ? "Mucho UDP puede indicar streaming, juegos o DNS."
              : protocol === "DNS"
                ? "Alto DNS puede ser navegación activa o... algo sospechoso."
                : "Interesante mezcla de tráfico."
        }`,
        icon: "📊",
        relevance: "Basado en tu tráfico actual",
      });
    }

    // Tip sobre puerto más usado
    const topPort = Object.entries(portCounts).sort((a, b) => b[1] - a[1])[0];
    if (topPort) {
      const [port, count] = topPort;
      const portNum = parseInt(port);
      const portNames: Record<number, string> = {
        80: "HTTP (web sin cifrar)",
        443: "HTTPS (web cifrado)",
        53: "DNS",
        22: "SSH",
        21: "FTP",
        25: "SMTP (email)",
        3306: "MySQL",
        5432: "PostgreSQL",
        6379: "Redis",
        8080: "HTTP alternativo",
      };
      const portName = portNames[portNum] || `Puerto ${portNum}`;

      dynamicTips.push({
        id: `dynamic-port-${port}`,
        category: "traffic",
        title: `Puerto ${port} muy activo`,
        content: `Has enviado ${count} paquetes al puerto ${port} (${portName}). ${
          portNum === 443
            ? "¡Bien! Tu tráfico web está cifrado."
            : portNum === 80
              ? "Cuidado: tráfico sin cifrar. Cualquiera en la red puede verlo."
              : portNum === 53
                ? "Muchas consultas DNS. ¿Estás navegando mucho o hay algo raro?"
                : "Este puerto no es tan común. ¿Sabes qué aplicación lo usa?"
        }`,
        icon: "🔌",
        relevance: "Basado en tu tráfico actual",
      });
    }

    // Tip si hay muchas IPs únicas
    const uniqueIps = Object.keys(ipCounts).length;
    if (uniqueIps > 10) {
      dynamicTips.push({
        id: "dynamic-many-ips",
        category: "traffic",
        title: `${uniqueIps} destinos diferentes`,
        content: `Tu sistema se comunica con ${uniqueIps} IPs distintas. Esto es normal si navegas mucho, pero si ves IPs que no reconoces, podría ser tráfico no deseado.`,
        icon: "🌐",
        relevance: "Basado en tu tráfico actual",
      });
    }

    return dynamicTips;
  }, [packets]);

  // Actualizar tips cuando cambia el tráfico
  useEffect(() => {
    const dynamicTips = generateDynamicTips();
    // Intercalar tips dinámicos con estáticos
    const allTips = [...dynamicTips, ...STATIC_TIPS];
    setTips(allTips);
  }, [generateDynamicTips]);

  // Auto-rotación
  useEffect(() => {
    if (!autoRotate || tips.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        setIsAnimating(false);
      }, 300);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, tips.length]);

  const goToNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  const goToPrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  const refreshTips = () => {
    const dynamicTips = generateDynamicTips();
    const allTips = [...dynamicTips, ...STATIC_TIPS];
    // Shuffle
    const shuffled = allTips.sort(() => Math.random() - 0.5);
    setTips(shuffled);
    setCurrentTipIndex(0);
  };

  const currentTip = tips[currentTipIndex];

  if (!currentTip) return null;

  return (
    <div className="did-you-know">
      <div className="dyk-header">
        <Lightbulb size={18} className="dyk-icon" />
        <span className="dyk-title">¿Sabías que...?</span>
        <button className="dyk-refresh" onClick={refreshTips} title="Nuevo tip">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className={`dyk-content ${isAnimating ? "animating" : ""}`}>
        <div className="dyk-tip-header">
          <span className="dyk-tip-icon">{currentTip.icon}</span>
          <h4>{currentTip.title}</h4>
        </div>
        <p>{currentTip.content}</p>
        {currentTip.relevance && (
          <span className="dyk-relevance">📍 {currentTip.relevance}</span>
        )}
      </div>

      <div className="dyk-footer">
        <div className="dyk-nav">
          <button onClick={goToPrev} title="Anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="dyk-counter">
            {currentTipIndex + 1} / {tips.length}
          </span>
          <button onClick={goToNext} title="Siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className={`dyk-category ${currentTip.category}`}>
          {currentTip.category === "protocol" && "Protocolo"}
          {currentTip.category === "security" && "Seguridad"}
          {currentTip.category === "network" && "Red"}
          {currentTip.category === "traffic" && "Tu tráfico"}
          {currentTip.category === "general" && "General"}
        </span>
      </div>
    </div>
  );
};

export default DidYouKnow;
