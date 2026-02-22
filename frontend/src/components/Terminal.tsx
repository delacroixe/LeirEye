/**
 * Terminal - Componente de terminal integrada estilo VS Code
 */

import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../contexts/ChatContext";
import { useTerminal } from "../contexts/TerminalContext";
import useTerminalShortcut from "../hooks/useTerminalShortcut";
import "./Terminal.css";

export default function Terminal() {
  // Atajo de teclado Ctrl+`
  useTerminalShortcut();

  const {
    isOpen,
    isConnected,
    isMinimized,
    lines,
    currentDirectory,
    closeTerminal,
    minimizeTerminal,
    maximizeTerminal,
    sendCommand,
    interrupt,
    clear,
    panelHeight,
    setPanelHeight,
  } = useTerminal();

  // Obtener estado del chat para ajustar el ancho
  const { isOpen: isChatOpen, panelWidth: chatPanelWidth } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Detectar si el sidebar está colapsado
  useEffect(() => {
    const sidebar = document.querySelector(".app-sidebar");
    if (!sidebar) return;

    const checkCollapsed = () => {
      setIsSidebarCollapsed(sidebar.classList.contains("collapsed"));
    };

    // Verificar inmediatamente
    checkCollapsed();

    // Observer para cambios de clase
    const observer = new MutationObserver(checkCollapsed);
    observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [isOpen]);

  // Auto-scroll al final cuando hay nuevas líneas
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Manejar resize con drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newHeight = window.innerHeight - e.clientY;
      const clampedHeight = Math.max(
        150,
        Math.min(newHeight, window.innerHeight - 100),
      );
      setPanelHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setPanelHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    sendCommand(inputValue);
    setCommandHistory((prev) => [...prev.slice(-100), inputValue]);
    setHistoryIndex(-1);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+C para interrumpir
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      interrupt();
      setInputValue("");
      return;
    }

    // Ctrl+L para limpiar
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      clear();
      return;
    }

    // Navegación por historial
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputValue("");
        } else {
          setHistoryIndex(newIndex);
          setInputValue(commandHistory[newIndex]);
        }
      }
    }
  };

  const getLineClassName = (type: string) => {
    switch (type) {
      case "input":
        return "terminal-line terminal-line-input";
      case "output":
        return "terminal-line terminal-line-output";
      case "error":
        return "terminal-line terminal-line-error";
      case "system":
        return "terminal-line terminal-line-system";
      default:
        return "terminal-line";
    }
  };

  const shortDir = currentDirectory.replace(/^\/Users\/[^/]+/, "~");

  if (!isOpen) return null;

  // Calcular estilos dinámicos
  const terminalStyle: React.CSSProperties = {
    height: isMinimized ? "auto" : panelHeight,
    right: isChatOpen ? chatPanelWidth : 0,
  };

  // Clases del panel
  const panelClasses = [
    "terminal-panel",
    isMinimized && "terminal-minimized",
    isSidebarCollapsed && "sidebar-collapsed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={panelClasses} style={terminalStyle}>
      {/* Resize handle */}
      {!isMinimized && (
        <div
          ref={resizeRef}
          className="terminal-resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Header */}
      <div className="terminal-header">
        <div className="terminal-header-left">
          <TerminalIcon className="terminal-icon" size={14} />
          <span className="terminal-title">Terminal</span>
          <span
            className={`terminal-status ${
              isConnected
                ? "terminal-status-connected"
                : "terminal-status-disconnected"
            }`}
          >
            {isConnected ? "●" : "○"}
          </span>
        </div>

        <div className="terminal-header-actions">
          <button
            className="terminal-action-btn"
            onClick={clear}
            title="Limpiar (Ctrl+L)"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="terminal-action-btn"
            onClick={isMinimized ? maximizeTerminal : minimizeTerminal}
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            className="terminal-action-btn"
            onClick={() =>
              setPanelHeight(
                isMinimized ? 300 : panelHeight === 300 ? 500 : 300,
              )
            }
            title="Cambiar tamaño"
          >
            {panelHeight > 300 ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
          <button
            className="terminal-action-btn terminal-close-btn"
            onClick={closeTerminal}
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="terminal-content">
          {/* Output */}
          <div ref={outputRef} className="terminal-output">
            {lines.map((line) => (
              <div key={line.id} className={getLineClassName(line.type)}>
                {line.content}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="terminal-input-form">
            <span className="terminal-prompt">
              <span className="terminal-prompt-dir">{shortDir}</span>
              <span className="terminal-prompt-symbol">$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              placeholder={isConnected ? "" : "Conectando..."}
              disabled={!isConnected}
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      )}
    </div>
  );
}
