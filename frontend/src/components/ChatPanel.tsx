/**
 * ChatPanel - Panel de chat integrado con resize
 */

import {
  AlertCircle,
  Bot,
  GripVertical,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAI } from "../contexts/AIContext";
import { useChat } from "../contexts/ChatContext";
import "./ChatPanel.css";

// ============ Componente de mensaje ============

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  // Renderizar markdown básico
  const renderContent = (text: string) => {
    // Convertir **texto** a <strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Convertir *texto* a <em>
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Convertir `código` a <code>
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Convertir saltos de línea
    html = html.replace(/\n/g, "<br/>");

    return { __html: html };
  };

  return (
    <div className={`chat-message ${role}`}>
      <div className="message-avatar">
        {role === "user" ? <MessageSquare size={16} /> : <Bot size={16} />}
      </div>
      <div className="message-content">
        <div
          className="message-text"
          dangerouslySetInnerHTML={renderContent(content)}
        />
        {isStreaming && <span className="streaming-cursor">▊</span>}
      </div>
    </div>
  );
}

// ============ Componente principal ============

export default function ChatPanel() {
  const {
    messages,
    isOpen,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    closeChat,
    clearHistory,
    cancelStream,
    pageContext,
    panelWidth,
    setPanelWidth,
  } = useChat();

  const { status: aiStatus, isLoading: aiLoading } = useAI();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Auto-scroll al final
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setPanelWidth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Sugerencias iniciales basadas en la página
  const getSuggestions = () => {
    switch (pageContext.pageId) {
      case "capture":
        return [
          "¿Qué aplicaciones están usando más red?",
          "¿Hay tráfico sospechoso?",
          "Explica los protocolos que veo",
        ];
      case "alerts":
        return [
          "¿Qué significan estas alertas?",
          "¿Cuál es la más urgente?",
          "¿Cómo puedo resolver estas alertas?",
        ];
      case "statistics":
        return [
          "Analiza el tráfico de red",
          "¿Es normal esta distribución?",
          "¿Qué patrones ves?",
        ];
      case "network-map":
        return [
          "¿Hay conexiones sospechosas?",
          "¿A qué países me conecto?",
          "Explica la topología",
        ];
      case "dns":
        return [
          "¿Hay DNS tunneling?",
          "¿Qué dominios son sospechosos?",
          "Explica las consultas DNS",
        ];
      case "wifi":
        return [
          "¿Es segura mi red WiFi?",
          "¿Qué canal debo usar?",
          "Analiza las redes cercanas",
        ];
      default:
        return [
          "¿Cómo funciona esta página?",
          "¿Qué puedo hacer aquí?",
          "Ayúdame a entender",
        ];
    }
  };

  if (!isOpen) return null;

  const isAIAvailable = aiStatus?.available && aiStatus?.has_required_model;

  return (
    <div ref={panelRef} className="chat-panel" style={{ width: panelWidth }}>
      {/* Resize Handle */}
      <div className="chat-resize-handle" onMouseDown={handleMouseDown}>
        <GripVertical size={12} />
      </div>

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <Sparkles size={18} className="chat-icon" />
          <span>Asistente IA</span>
          {isAIAvailable && (
            <span className="chat-status-dot online" title="IA disponible" />
          )}
        </div>
        <div className="chat-header-actions">
          {messages.length > 0 && (
            <button
              className="chat-action-btn"
              onClick={clearHistory}
              title="Limpiar historial"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            className="chat-action-btn"
            onClick={closeChat}
            title="Cerrar chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Context Badge */}
      <div className="chat-context-badge">
        <MapPin size={12} />
        <span>{pageContext.pageName}</span>
        <span className="context-summary">{pageContext.summary}</span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {/* Estado de IA */}
        {aiLoading && (
          <div className="chat-status-message">
            <Loader2 size={16} className="spin" />
            <span>Verificando disponibilidad de IA...</span>
          </div>
        )}

        {!aiLoading && !isAIAvailable && (
          <div className="chat-status-message warning">
            <AlertCircle size={16} />
            <div>
              <strong>IA no disponible</strong>
              <p>
                {aiStatus?.install_hint ||
                  "Instala Ollama y ejecuta: ollama pull llama3.2"}
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de bienvenida */}
        {messages.length === 0 && isAIAvailable && (
          <div className="chat-welcome">
            <Bot size={32} className="welcome-icon" />
            <h3>¡Hola! Soy tu asistente de red</h3>
            <p>
              Tengo acceso al contexto de{" "}
              <strong>{pageContext.pageName}</strong>. Pregúntame lo que quieras
              sobre lo que ves.
            </p>
            <div className="chat-suggestions">
              {getSuggestions().map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Historial de mensajes */}
        {messages.map((msg, index) => (
          <MessageBubble key={index} role={msg.role} content={msg.content} />
        ))}

        {/* Mensaje en streaming */}
        {isStreaming && streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {/* Indicador de carga */}
        {isStreaming && !streamingContent && (
          <div className="chat-thinking">
            <Loader2 size={16} className="spin" />
            <span>Pensando...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-container" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAIAvailable ? "Pregunta sobre tu red..." : "IA no disponible"
            }
            disabled={!isAIAvailable || isStreaming}
            rows={1}
            className="chat-input"
          />
          {isStreaming ? (
            <button
              type="button"
              className="chat-send-btn cancel"
              onClick={cancelStream}
              title="Cancelar"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputValue.trim() || !isAIAvailable}
              title="Enviar"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        <div className="chat-input-hint">
          <span>Enter para enviar • Shift+Enter para nueva línea</span>
        </div>
      </form>
    </div>
  );
}
