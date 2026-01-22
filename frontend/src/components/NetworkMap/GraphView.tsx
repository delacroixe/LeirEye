/**
 * Vista de grafo de red con vis-network
 */
import React, { useEffect, useRef } from "react";
import { DataSet, Network, Options } from "vis-network/standalone";
import { NetworkMapData, NetworkMapNode } from "../../services/api";

interface GraphViewProps {
  mapData: NetworkMapData;
  onNodeSelect: (node: NetworkMapNode | null) => void;
}

const GraphView: React.FC<GraphViewProps> = ({ mapData, onNodeSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Preparar nodos
    const nodes = new DataSet(
      mapData.nodes.map((node) => {
        const isLocal = node.isLocal;
        const size = Math.max(
          25,
          Math.min(60, 15 + Math.log(node.traffic + 1) * 8),
        );

        return {
          id: node.id,
          label: node.label,
          title: createTooltip(node),
          size,
          color: {
            background: isLocal ? "#22c55e" : "#3b82f6",
            border: isLocal ? "#16a34a" : "#2563eb",
            highlight: {
              background: isLocal ? "#4ade80" : "#60a5fa",
              border: isLocal ? "#22c55e" : "#3b82f6",
            },
            hover: {
              background: isLocal ? "#4ade80" : "#60a5fa",
              border: isLocal ? "#22c55e" : "#3b82f6",
            },
          },
          font: {
            color: "#ffffff",
            size: 12,
            face: "SF Pro Display, -apple-system, sans-serif",
            strokeWidth: 3,
            strokeColor: "#0a0e27",
          },
          borderWidth: 2,
          borderWidthSelected: 4,
          shadow: {
            enabled: true,
            color: isLocal
              ? "rgba(34, 197, 94, 0.5)"
              : "rgba(59, 130, 246, 0.5)",
            size: 15,
            x: 0,
            y: 0,
          },
          shape: "dot",
        };
      }),
    );

    // Preparar aristas
    const maxValue = Math.max(...mapData.links.map((l) => l.value));
    const edges = new DataSet(
      mapData.links.map((link, index) => ({
        id: index,
        from: link.source,
        to: link.target,
        width: 1 + (link.value / maxValue) * 6,
        color: {
          color: "rgba(100, 116, 139, 0.4)",
          highlight: "#64c8ff",
          hover: "#64c8ff",
        },
        smooth: {
          enabled: true,
          type: "continuous" as const,
          roundness: 0.5,
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 },
        },
        title: `${link.value} paquetes`,
      })),
    );

    // Opciones
    const options: Options = {
      nodes: {
        shape: "dot",
        scaling: { min: 20, max: 60 },
      },
      edges: {
        smooth: { enabled: true, type: "continuous", roundness: 0.5 },
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.8,
        },
        stabilization: { enabled: true, iterations: 200, updateInterval: 25 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        navigationButtons: false,
        keyboard: true,
      },
      layout: { improvedLayout: true },
    };

    // Crear red
    if (networkRef.current) {
      networkRef.current.setData({ nodes, edges });
    } else {
      networkRef.current = new Network(
        containerRef.current,
        { nodes, edges },
        options,
      );

      networkRef.current.on("click", (params) => {
        if (params.nodes.length > 0) {
          const node = mapData.nodes.find((n) => n.id === params.nodes[0]);
          onNodeSelect(node || null);
        } else {
          onNodeSelect(null);
        }
      });
    }

    return () => {
      // Mantener instancia para re-renders
    };
  }, [mapData, onNodeSelect]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

function createTooltip(node: NetworkMapNode): string {
  let html = `<div class="vis-tooltip-custom">
    <div class="tooltip-header">${node.isLocal ? "🏠" : "🌐"} ${node.label}</div>
    <div class="tooltip-body">
      <div class="tooltip-row"><span>Tipo:</span> ${node.networkType}</div>
      <div class="tooltip-row"><span>Tráfico:</span> ${node.traffic} paquetes</div>`;

  if (node.geo && !node.isLocal) {
    html += `
      <div class="tooltip-divider"></div>
      <div class="tooltip-row"><span>País:</span> ${node.geo.country}</div>
      <div class="tooltip-row"><span>Ciudad:</span> ${node.geo.city}</div>
      <div class="tooltip-row"><span>ISP:</span> ${node.geo.isp}</div>`;
  }

  html += "</div></div>";
  return html;
}

export default GraphView;
