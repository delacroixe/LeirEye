/**
 * Servicio de chat con streaming via fetch + ReadableStream
 */

import { API_BASE_URL } from "../config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface PageContext {
  pageId: string;
  pageName: string;
  summary: string;
  data: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  context: PageContext;
  history: ChatMessage[];
  stream?: boolean;
}

/**
 * Envía un mensaje al chat con streaming.
 * Usa fetch + ReadableStream para recibir chunks en tiempo real.
 */
export async function sendChatMessage(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem("auth_token");

  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Request was cancelled, don't report as error
      onComplete();
      return;
    }
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Envía un mensaje sin streaming (respuesta completa)
 */
export async function sendChatMessageSync(
  request: ChatRequest,
): Promise<{ content: string }> {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
