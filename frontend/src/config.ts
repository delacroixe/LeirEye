/**
 * Configuración centralizada de la aplicación
 * Lee variables de entorno con fallbacks para desarrollo local
 */

// API Backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// WebSocket
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api';

// Configuración de reconexión WebSocket
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_DELAY_MS = 3000;

// Configuración de la aplicación
export const APP_NAME = 'LeirEye';
export const APP_VERSION = '2.0.0';

// URLs derivadas
export const WS_CAPTURE_URL = `${WS_BASE_URL}/capture/ws`;
