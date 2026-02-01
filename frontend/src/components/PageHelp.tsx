import { HelpCircle, Lightbulb, Target, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./PageHelp.css";

export interface PageHelpContent {
  whatIs: string;
  whyImportant: string;
  howToUse: string[];
  tips?: string[];
  relatedPages?: { name: string; path: string }[];
}

interface PageHelpProps {
  content: PageHelpContent;
  pageId: string; // ID único para persistencia
  defaultExpanded?: boolean;
}

// Contenido de ayuda para cada página
export const PAGE_HELP: Record<string, PageHelpContent> = {
  capture: {
    whatIs:
      "Esta página captura todos los paquetes de red que pasan por tu interfaz seleccionada. Cada fila representa un paquete: quién envía, quién recibe, qué protocolo usa y cuántos datos contiene.",
    whyImportant:
      "Es el corazón de cualquier análisis de red. Te permite ver exactamente qué está pasando: qué aplicaciones se comunican, con qué servidores, y detectar comportamientos sospechosos o problemas de rendimiento.",
    howToUse: [
      "Selecciona una interfaz de red en la barra superior (ej: en0, eth0)",
      "Opcionalmente añade un filtro BPF (ej: 'tcp port 443' para solo HTTPS)",
      "Haz clic en 'Iniciar Captura' para comenzar",
      "Haz clic en cualquier fila para ver detalles del paquete",
      "Usa el botón '?' en cada paquete para obtener una explicación con IA",
      "Exporta los datos a CSV para análisis posterior",
    ],
    tips: [
      "Los colores de protocolo ayudan a identificar rápidamente: Verde=TCP, Amarillo=UDP, Azul=DNS, Rojo=ICMP",
      "Usa el buscador para filtrar por IP, puerto o nombre de proceso",
      "El icono de globo 🌐 indica que el paquete tiene información DNS asociada",
    ],
    relatedPages: [
      { name: "DNS", path: "/dns" },
      { name: "Mapa de Red", path: "/network-map" },
      { name: "Estadísticas", path: "/statistics" },
    ],
  },

  statistics: {
    whatIs:
      "Esta página analiza todos los paquetes capturados y te muestra métricas agregadas: distribución por protocolo, las IPs más activas, los puertos más usados y el tráfico por proceso.",
    whyImportant:
      "Los números individuales de paquetes no cuentan la historia completa. Las estadísticas revelan patrones: ¿Qué aplicación consume más ancho de banda? ¿Hay una IP que destaca sospechosamente? ¿El 90% del tráfico es DNS? Eso podría indicar un problema.",
    howToUse: [
      "Revisa las tarjetas superiores para ver la distribución por protocolo",
      "Consulta 'Top IPs' para identificar los principales comunicadores",
      "Usa 'Top Puertos' para ver qué servicios dominan tu tráfico",
      "Haz clic en cualquier IP o puerto para filtrar la captura",
    ],
    tips: [
      "Un alto porcentaje de 'Otros' protocolos podría indicar tráfico inusual",
      "Si una IP desconocida domina el tráfico, investígala en el Mapa de Red",
      "Puertos como 22 (SSH), 3389 (RDP) en lugares inesperados merecen atención",
    ],
    relatedPages: [
      { name: "Captura", path: "/capture" },
      { name: "Mapa de Red", path: "/network-map" },
    ],
  },

  networkMap: {
    whatIs:
      "El Mapa de Red transforma los datos de paquetes en visualizaciones: un grafo interactivo donde cada nodo es una IP y cada línea una conexión, y un mapa geográfico que muestra dónde están físicamente los servidores con los que te comunicas.",
    whyImportant:
      "Ver es entender. El grafo revela la topología de tus conexiones: ¿cuántos servicios externos usas? ¿Hay un servidor que centraliza todo? El mapa geográfico puede revelar conexiones a países inesperados que podrían ser sospechosas.",
    howToUse: [
      "Usa la pestaña 'Grafo' para ver conexiones como red de nodos",
      "Arrastra los nodos para reorganizar la vista",
      "Haz clic en un nodo para ver detalles (IP, país, ISP, tráfico)",
      "Usa la pestaña 'Geo' para ver ubicaciones en el mapa mundial",
      "Los colores indican: Azul=tu red local, Verde=externo conocido, Rojo=potencialmente sospechoso",
    ],
    tips: [
      "Las IPs locales (192.168.x.x, 10.x.x.x) aparecen agrupadas",
      "Pasa el mouse sobre una línea para ver cuánto tráfico hay entre dos IPs",
      "Si ves conexiones a países donde no tienes servicios, investiga",
    ],
    relatedPages: [
      { name: "Captura", path: "/capture" },
      { name: "Alertas", path: "/alerts" },
    ],
  },

  alerts: {
    whatIs:
      "El sistema analiza automáticamente el tráfico en busca de patrones sospechosos: posible DNS tunneling (datos ocultos en consultas DNS), escaneos de puertos, nuevas conexiones a IPs desconocidas, o tráfico a ubicaciones geográficas inusuales.",
    whyImportant:
      "No puedes revisar cada paquete manualmente. Las alertas automáticas te avisan cuando algo merece atención. Una alerta no significa necesariamente un problema, pero sí que deberías investigar.",
    howToUse: [
      "Las alertas se ordenan por severidad: Crítica > Alta > Media > Baja > Info",
      "Haz clic en una alerta para ver detalles completos",
      "Usa el botón '?' para obtener explicación con IA de qué significa",
      "Marca como 'Reconocida' las alertas que ya revisaste",
      "Filtra por tipo o severidad para enfocarte en lo importante",
    ],
    tips: [
      "DNS Tunneling: consultas DNS muy largas o con patrones extraños",
      "Port Scan: muchas conexiones a diferentes puertos en poco tiempo",
      "Las alertas 'Info' son informativas, no necesariamente problemas",
    ],
    relatedPages: [
      { name: "DNS", path: "/dns" },
      { name: "Captura", path: "/capture" },
    ],
  },

  dns: {
    whatIs:
      "DNS traduce nombres (google.com) a IPs (142.250.185.78). Esta página muestra todas las consultas DNS, las respuestas recibidas, y analiza si alguna podría ser sospechosa de 'DNS Tunneling' - una técnica para ocultar datos en consultas DNS.",
    whyImportant:
      "El DNS es esencial pero también es un vector de ataque. Malware sofisticado usa DNS para comunicarse con servidores de comando porque la mayoría de firewalls permiten DNS. Monitorear DNS puede revelar exfiltración de datos o malware.",
    howToUse: [
      "Revisa la lista de queries para ver qué dominios consulta tu sistema",
      "El 'Score de Tunneling' indica sospecha (alto = más sospechoso)",
      "Expande una query para ver los paquetes de red asociados",
      "Filtra por 'Solo sospechosos' para enfocarte en lo importante",
      "Revisa 'Top Dominios' para ver los más consultados",
    ],
    tips: [
      "Subdominios muy largos y aleatorios son señal de tunneling",
      "Muchas queries a un dominio poco común merece investigación",
      "Queries a dominios como .tk, .xyz desde apps desconocidas son sospechosas",
    ],
    relatedPages: [
      { name: "Alertas", path: "/alerts" },
      { name: "Captura", path: "/capture" },
    ],
  },

  packetBuilder: {
    whatIs:
      "Esta herramienta te permite construir paquetes de red desde cero, seleccionando cada campo: protocolo, IPs, puertos, flags TCP, payload. Es principalmente educativa para entender cómo se estructuran los paquetes.",
    whyImportant:
      "Entender la estructura de un paquete es fundamental para el análisis de red. Crear paquetes manualmente te enseña qué significa cada campo y cómo los protocolos funcionan a bajo nivel.",
    howToUse: [
      "Selecciona un protocolo (TCP, UDP, ICMP, DNS, HTTP)",
      "Usa una plantilla predefinida o configura manualmente cada campo",
      "Para TCP, experimenta con diferentes combinaciones de flags",
      "Usa el asistente de IA para obtener sugerencias y explicaciones",
      "Revisa el preview hexadecimal para ver el paquete real",
      "⚠️ CUIDADO: Enviar paquetes puede afectar la red. Usa responsablemente.",
    ],
    tips: [
      "Las plantillas son un buen punto de partida para aprender",
      "El flag SYN inicia conexiones TCP (handshake)",
      "Nunca envíes paquetes a redes que no controles",
    ],
    relatedPages: [{ name: "Captura", path: "/capture" }],
  },

  system: {
    whatIs:
      "Esta página muestra información sobre tu sistema operativo, hardware, interfaces de red disponibles, tu IP pública y privada, y los procesos que tienen conexiones de red activas.",
    whyImportant:
      "Conocer tu entorno es el primer paso para el análisis. Saber qué interfaces tienes, cuál es tu IP pública, y qué procesos se comunican te da contexto para interpretar el tráfico capturado.",
    howToUse: [
      "Revisa tu IP pública y su geolocalización",
      "Consulta las interfaces de red disponibles para captura",
      "Examina los procesos con conexiones activas",
      "Haz clic en un proceso para ver sus conexiones y filtrar por él",
    ],
    tips: [
      "Tu IP pública es la que ven los servidores externos",
      "Las interfaces 'loopback' (lo0) son solo para comunicación interna",
      "Procesos desconocidos con conexiones activas merecen investigación",
    ],
    relatedPages: [
      { name: "Captura", path: "/capture" },
      { name: "Configuración", path: "/settings" },
    ],
  },

  wifi: {
    whatIs:
      "Esta página escanea las redes WiFi circundantes, analizando su intensidad de señal (RSSI), canal de operación y protocolos de seguridad (WPA2, WPA3, etc.).",
    whyImportant:
      "La seguridad inalámbrica es crítica. Identificar redes con seguridad débil, canales saturados o puntos de acceso sospechosos es vital para mantener una red segura.",
    howToUse: [
      "Haz clic en 'Escanear Aire' para actualizar la lista de redes",
      "Usa 'AI Audit' para que la IA evalúe la seguridad de tu entorno",
      "Identifica el mejor canal para tu propio punto de acceso",
      "Detecta si hay redes duplicadas o con señales sospechosas",
    ],
    tips: [
      "RSSI más alto (más cerca de 0) indica mejor señal",
      "Los canales 1, 6 y 11 son los únicos que no se solapan en 2.4GHz",
      "La geolocalización es aproximada basada en la base de datos de BSSID",
    ],
    relatedPages: [
      { name: "Mapa de Red", path: "/map" },
      { name: "Alertas", path: "/alerts" },
    ],
  },

  settings: {
    whatIs:
      "Aquí puedes ajustar opciones de la aplicación: límites de captura, intervalos de actualización, tema visual, y notificaciones.",
    whyImportant:
      "Cada usuario tiene necesidades diferentes. Ajustar la configuración te permite optimizar la experiencia según tu caso de uso.",
    howToUse: [
      "Ajusta 'Máximo de paquetes' según tu memoria disponible",
      "Activa/desactiva auto-refrescar según prefieras",
      "Configura notificaciones para alertas importantes",
      "Los cambios se guardan automáticamente",
    ],
    tips: [
      "Más paquetes = más memoria. Si el navegador va lento, reduce el límite",
      "Las notificaciones del navegador requieren permiso la primera vez",
    ],
    relatedPages: [{ name: "Alertas", path: "/alerts" }],
  },
};

const PageHelp: React.FC<PageHelpProps> = ({ content, pageId }) => {
  const [isDismissed, setIsDismissed] = useState(true);

  // Recuperar preferencia del usuario
  useEffect(() => {
    const dismissed = localStorage.getItem(`pageHelp_${pageId}_dismissed`);
    // Por defecto ahora es true (cerrado)
    if (dismissed === "false") {
      setIsDismissed(false);
    }
  }, [pageId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`pageHelp_${pageId}_dismissed`, "true");
  };

  const handleShow = () => {
    setIsDismissed(false);
    localStorage.setItem(`pageHelp_${pageId}_dismissed`, "false");
  };

  const banner = (
    <div className="page-help">
      <div className="page-help-header">
        <div className="page-help-title"></div>
        <div className="page-help-actions">
          <button
            className="help-dismiss"
            onClick={handleDismiss}
            title="Cerrar ayuda"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="page-help-content">
        <div className="help-section">
          <div className="help-section-header">
            <span className="help-section-icon">📖</span>
            <h4>¿Qué es?</h4>
          </div>
          <p>{content.whatIs}</p>
        </div>

        <div className="help-section">
          <div className="help-section-header">
            <Target size={16} className="help-section-icon" />
            <h4>¿Por qué es importante?</h4>
          </div>
          <p>{content.whyImportant}</p>
        </div>

        <div className="help-divider" />

        <div className="help-section">
          <div className="help-section-header">
            <span className="help-section-icon">🎯</span>
            <h4>Cómo usar esta página</h4>
          </div>
          <ol className="help-steps">
            {content.howToUse.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {content.tips && content.tips.length > 0 && (
          <div className="help-section tips-section">
            <div className="help-section-header">
              <Lightbulb size={16} className="help-section-icon" />
              <h4>Consejos pro</h4>
            </div>
            <ul className="help-tips">
              {content.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        className={`page-help-info-icon ${!isDismissed ? "active" : ""}`}
        onClick={isDismissed ? handleShow : handleDismiss}
        title={isDismissed ? "Ver ayuda" : "Ocultar ayuda"}
      >
        <HelpCircle size={20} />
      </button>

      {!isDismissed && createPortal(banner, document.body)}
    </>
  );
};

export default PageHelp;
