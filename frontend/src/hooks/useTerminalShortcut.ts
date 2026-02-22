/**
 * useTerminalShortcut - Hook para manejar el atajo de teclado de la terminal
 */

import { useEffect } from "react";
import { useTerminal } from "../contexts/TerminalContext";

export default function useTerminalShortcut() {
  const { toggleTerminal } = useTerminal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` o Cmd+` para toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTerminal]);
}
