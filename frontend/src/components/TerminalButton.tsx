/**
 * TerminalButton - Botón flotante para abrir/cerrar la terminal
 */

import { Terminal } from "lucide-react";
import { useTerminal } from "../contexts/TerminalContext";
import "./TerminalButton.css";

export default function TerminalButton() {
  const { isOpen, toggleTerminal, isConnected } = useTerminal();

  return (
    <button
      className={`terminal-toggle-btn ${isOpen ? "terminal-toggle-active" : ""}`}
      onClick={toggleTerminal}
      title="Terminal (Ctrl+`)"
    >
      <Terminal size={18} />
      {isConnected && <span className="terminal-toggle-indicator" />}
    </button>
  );
}
