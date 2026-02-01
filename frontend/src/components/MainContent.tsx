/**
 * MainContent - Wrapper que ajusta el contenido cuando el chat está abierto
 */

import { ReactNode } from "react";
import { useChat } from "../contexts/ChatContext";
import ChatButton from "./ChatButton";
import ChatPanel from "./ChatPanel";
import "./MainContent.css";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isOpen, panelWidth } = useChat();

  return (
    <>
      <div
        className="main-content-area"
        style={{
          marginRight: isOpen ? panelWidth : 0,
          transition: "margin-right 0.2s ease-out",
        }}
      >
        {children}
      </div>
      <ChatButton />
      <ChatPanel />
    </>
  );
}
