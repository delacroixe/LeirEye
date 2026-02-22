/**
 * MainContent - Wrapper que ajusta el contenido cuando el chat está abierto
 * y cuando la terminal está visible
 */

import { ReactNode } from "react";
import { useChat } from "../contexts/ChatContext";
import { useTerminal } from "../contexts/TerminalContext";
import ChatButton from "./ChatButton";
import ChatPanel from "./ChatPanel";
import "./MainContent.css";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isOpen: isChatOpen, panelWidth } = useChat();
  const { isOpen: isTerminalOpen, isMinimized, panelHeight } = useTerminal();

  // Calcular padding inferior para la terminal
  const bottomPadding = isTerminalOpen && !isMinimized ? panelHeight : 0;

  return (
    <>
      <div
        className="main-content-area"
        style={{
          marginRight: isChatOpen ? panelWidth : 0,
          paddingBottom: bottomPadding,
          transition: "margin-right 0.2s ease-out, padding-bottom 0.15s ease-out",
        }}
      >
        {children}
      </div>
      <ChatButton />
      <ChatPanel />
    </>
  );
}
