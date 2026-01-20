// Servicio para WebSocket
import { WS_CAPTURE_URL, WS_RECONNECT_ATTEMPTS, WS_RECONNECT_DELAY_MS } from '../config';

export interface WebSocketMessage {
  type: 'packet' | 'status' | 'stats';
  data: any;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = WS_CAPTURE_URL;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WS_RECONNECT_ATTEMPTS;
  private reconnectDelay = WS_RECONNECT_DELAY_MS;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket conectado');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log(`📨 WS mensaje recibido: type=${message.type}`, message.data);
            this.emit(message.type, message.data);
          } catch (error) {
            console.error('Error parseando mensaje WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Error WebSocket:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket desconectado');
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reintentando conexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      setTimeout(() => this.connect().catch(console.error), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const callbacks = this.listeners.get(event)!;
    // Evitar duplicados
    if (!callbacks.includes(callback as any)) {
      callbacks.push(callback);
    }
  }

  once(event: string, callback: Function) {
    const wrapper = (data?: any) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    console.log(`📤 emit('${event}'): ${callbacks?.length || 0} listeners registrados`);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
