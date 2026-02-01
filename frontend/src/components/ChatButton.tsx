/**
 * ChatButton - Botón flotante para abrir el chat
 */

import { MessageCircle, Sparkles, X } from "lucide-react";
import { useAI } from "../contexts/AIContext";
import { useChat } from "../contexts/ChatContext";
import "./ChatButton.css";

export default function ChatButton() {
  const { isOpen, toggleChat, messages } = useChat();
  const { status: aiStatus, isLoading } = useAI();

  const isAvailable = aiStatus?.available && aiStatus?.has_required_model;
  const hasMessages = messages.length > 0;

  return (
    <button
      className={`chat-fab ${isOpen ? "active" : ""} ${!isAvailable && !isLoading ? "unavailable" : ""}`}
      onClick={toggleChat}
      title={isOpen ? "Cerrar asistente" : "Abrir asistente IA"}
      aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente IA"}
    >
      {isOpen ? (
        <X size={24} />
      ) : (
        <>
          <Sparkles size={22} className="fab-icon-sparkle" />
          <MessageCircle size={22} className="fab-icon-chat" />

          {/* Badge de estado */}
          {isAvailable && <span className="fab-status-badge online" />}

          {/* Badge de mensajes */}
          {hasMessages && !isOpen && (
            <span className="fab-message-badge">{messages.length}</span>
          )}
        </>
      )}
    </button>
  );
}
