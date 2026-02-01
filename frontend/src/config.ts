/**
 * Configuración centralizada de la aplicación
 * Lee variables de entorno con fallbacks para desarrollo local
 * Vite usa import.meta.env en lugar de process.env
 */

// API Backend
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000/api";

// WebSocket
export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL?.trim() || "ws://localhost:8000/api";

// Geo IP API
export const GEO_IP_API_URL =
  import.meta.env.VITE_GEO_IP_URL?.trim() || "http://ip-api.com/json/";

// Configuración de reconexión WebSocket
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_DELAY_MS = 3000;

// Configuración de la aplicación
export const APP_NAME = "LeirEye";
export const APP_VERSION = "2.0.0";

// URLs derivadas
export const WS_CAPTURE_URL = `${WS_BASE_URL}/capture/ws`;
