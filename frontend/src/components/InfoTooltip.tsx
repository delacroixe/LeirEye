import { HelpCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import "./InfoTooltip.css";

export interface InfoTooltipContent {
  title: string;
  purpose: string;
  howItWorks?: string;
  tips?: string[];
  learnMore?: string;
}

interface InfoTooltipProps {
  content: InfoTooltipContent;
  position?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
}

/**
 * Componente de tooltip educativo reutilizable.
 * Muestra un icono de información que al hacer hover/click
 * despliega una explicación detallada del componente.
 */
const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  position = "top",
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const showTooltip = isOpen || isHovered;

  return (
    <div className={`info-tooltip-container info-tooltip-${size}`}>
      <button
        ref={triggerRef}
        className={`info-tooltip-trigger ${showTooltip ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Más información"
        type="button"
      >
        <HelpCircle size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
      </button>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`info-tooltip-content info-tooltip-${position}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="tooltip-header">
            <span className="tooltip-icon">💡</span>
            <h4>{content.title}</h4>
            {isOpen && (
              <button
                className="tooltip-close"
                onClick={() => setIsOpen(false)}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="tooltip-body">
            <div className="tooltip-section">
              <span className="section-label">¿Para qué sirve?</span>
              <p>{content.purpose}</p>
            </div>

            {content.howItWorks && (
              <div className="tooltip-section">
                <span className="section-label">¿Cómo funciona?</span>
                <p>{content.howItWorks}</p>
              </div>
            )}

            {content.tips && content.tips.length > 0 && (
              <div className="tooltip-section">
                <span className="section-label">💡 Tips</span>
                <ul className="tooltip-tips">
                  {content.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {content.learnMore && (
              <div className="tooltip-learn-more">
                <span>📚</span>
                <p>{content.learnMore}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;

// Contenidos predefinidos para componentes comunes
export const TOOLTIP_CONTENT = {
  packetTable: {
    title: "Tabla de Paquetes",
    purpose:
      "Muestra cada paquete de red capturado en tiempo real. Cada fila es un 'sobre' de datos viajando por tu red.",
    howItWorks:
      "Cuando inicias una captura, el sistema intercepta los paquetes que pasan por tu interfaz de red y los muestra aquí con información decodificada.",
    tips: [
      "Haz clic en una fila para ver más detalles",
      "Usa el botón 🎓 para que la IA te explique el paquete",
      "Los colores del borde izquierdo indican el protocolo",
    ],
    learnMore:
      "Un paquete de red es la unidad básica de datos en Internet. Contiene información del remitente, destinatario y el contenido.",
  },

  captureStatus: {
    title: "Estado de Captura",
    purpose: "Indica si LeirEye está capturando tráfico de red activamente.",
    howItWorks:
      "Al iniciar la captura, el sistema usa 'modo promiscuo' para ver TODO el tráfico de la red, no solo el de tu máquina.",
    tips: [
      "Necesitas permisos de administrador para capturar",
      "Selecciona la interfaz correcta (WiFi o Ethernet)",
    ],
  },

  dnsTracker: {
    title: "DNS Tracker",
    purpose:
      "Rastrea todas las consultas DNS que hace tu sistema. El DNS traduce nombres de dominio (google.com) a direcciones IP.",
    howItWorks:
      "Cada vez que visitas un sitio web, tu computadora pregunta al servidor DNS '¿Cuál es la IP de este dominio?'. Este componente captura esas preguntas.",
    tips: [
      "Queries sospechosas pueden indicar malware",
      "Alta entropía en subdominios puede ser DNS tunneling",
      "Haz clic en una query para ver los paquetes relacionados",
    ],
    learnMore:
      "El DNS es como la guía telefónica de Internet. Sin él, tendrías que recordar direcciones IP como 142.250.80.46 en vez de 'google.com'.",
  },

  alertsPanel: {
    title: "Sistema de Alertas",
    purpose:
      "Detecta y notifica comportamientos sospechosos o anómalos en tu tráfico de red.",
    howItWorks:
      "Múltiples detectores analizan cada paquete buscando patrones: escaneos de puertos, tráfico inusual, datos sensibles expuestos, etc.",
    tips: [
      "Las alertas críticas requieren atención inmediata",
      "Puedes reconocer alertas para marcarlas como vistas",
      "Haz clic en '¿Por qué?' para entender la alerta",
    ],
  },

  networkMap: {
    title: "Mapa de Red",
    purpose:
      "Visualiza gráficamente todas las conexiones de red como un diagrama de nodos interconectados.",
    howItWorks:
      "Cada IP se representa como un nodo. Las líneas entre nodos muestran conexiones activas. El grosor indica cantidad de tráfico.",
    tips: [
      "Los nodos rojos pueden indicar IPs sospechosas",
      "Haz clic en un nodo para ver detalles de geolocalización",
      "Arrastra los nodos para reorganizar la vista",
    ],
    learnMore:
      "Este mapa te ayuda a visualizar quién se comunica con quién en tu red, facilitando detectar conexiones inusuales.",
  },

  statistics: {
    title: "Estadísticas de Tráfico",
    purpose:
      "Proporciona métricas y gráficos sobre el tráfico capturado para análisis y detección de anomalías.",
    howItWorks:
      "Agrega datos de todos los paquetes capturados y calcula distribuciones por protocolo, IPs más activas, puertos más usados, etc.",
    tips: [
      "Un puerto inusual muy activo puede ser sospechoso",
      "Picos de tráfico pueden indicar ataques o descargas",
      "Compara con tu baseline normal",
    ],
  },

  packetBuilder: {
    title: "Constructor de Paquetes",
    purpose:
      "Permite crear y enviar paquetes de red personalizados para pruebas y aprendizaje.",
    howItWorks:
      "Configuras las capas del paquete (IP, TCP/UDP, payload) y el sistema lo construye y envía usando Scapy.",
    tips: [
      "Usa plantillas para casos comunes",
      "¡Solo para redes que controlas!",
      "La IA puede ayudarte a configurar el paquete",
    ],
    learnMore:
      "Crear paquetes manualmente te ayuda a entender cómo funcionan los protocolos de red a bajo nivel.",
  },

  processTraffic: {
    title: "Tráfico por Proceso",
    purpose:
      "Muestra qué aplicaciones de tu sistema están generando tráfico de red.",
    howItWorks:
      "Correlaciona los puertos de origen de los paquetes con los procesos del sistema operativo que los abrieron.",
    tips: [
      "Procesos desconocidos con mucho tráfico son sospechosos",
      "Haz clic en un proceso para filtrar sus paquetes",
    ],
  },

  protocol: {
    title: "Protocolo de Red",
    purpose: "Identifica qué tipo de comunicación está ocurriendo.",
    howItWorks:
      "El protocolo define las reglas de comunicación. TCP garantiza entrega, UDP es más rápido pero sin garantías.",
    tips: [
      "TCP (verde): Conexiones confiables como web, email",
      "UDP (amarillo): Streaming, juegos, DNS",
      "DNS (azul): Resolución de nombres de dominio",
      "ICMP (rojo): Ping y diagnósticos de red",
    ],
  },

  ipAddress: {
    title: "Dirección IP",
    purpose: "Identifica de forma única cada dispositivo en la red.",
    howItWorks:
      "Las IPs privadas (192.168.x.x, 10.x.x.x) son de tu red local. Las públicas identifican servidores en Internet.",
    tips: [
      "IPs que empiezan con 192.168 o 10. son locales",
      "8.8.8.8 es el DNS de Google",
      "Múltiples conexiones a una IP desconocida pueden ser sospechosas",
    ],
  },

  ports: {
    title: "Puertos de Red",
    purpose: "Identifican qué servicio o aplicación maneja la conexión.",
    howItWorks:
      "Los puertos van de 0 a 65535. Los menores a 1024 están reservados para servicios conocidos (80=HTTP, 443=HTTPS, 22=SSH).",
    tips: [
      "Puerto 80: Tráfico web sin cifrar",
      "Puerto 443: Tráfico web cifrado (HTTPS)",
      "Puerto 53: Consultas DNS",
      "Puertos altos (>1024): Aplicaciones de usuario",
    ],
  },

  tunnelingIndicator: {
    title: "Indicador de DNS Tunneling",
    purpose:
      "Mide la probabilidad de que alguien esté usando DNS para exfiltrar datos o evadir controles.",
    howItWorks:
      "Analiza patrones sospechosos: queries muy largos, subdominios con alta entropía (parecen aleatorios), tipos de registro inusuales.",
    tips: [
      "Score > 70: Alta probabilidad de tunneling",
      "Subdominios con caracteres aleatorios son sospechosos",
      "Los tipos TXT y NULL se usan frecuentemente para tunneling",
    ],
    learnMore:
      "DNS Tunneling es una técnica que oculta datos dentro de consultas DNS para evadir firewalls. Malware lo usa para comunicarse con servidores de comando y control.",
  },
};
