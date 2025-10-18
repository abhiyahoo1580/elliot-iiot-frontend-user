import { WS_CONFIG } from './config';
import { WS_EVENTS } from './events';

// Singleton WebSocket instance for UserV2.0
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let pingIntervalId: ReturnType<typeof setInterval> | null = null;

export function connectWebSocket(token: string): WebSocket {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  const url = `${WS_CONFIG.URL}?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    reconnectAttempts = 0;
    // Optionally, send a ping or authentication message here
  };

  socket.onclose = () => {
    if (pingIntervalId) clearInterval(pingIntervalId);
    if (reconnectAttempts < WS_CONFIG.MAX_RETRIES) {
      setTimeout(() => {
        reconnectAttempts++;
        connectWebSocket(token);
      }, WS_CONFIG.RECONNECT_INTERVAL);
    }
  };

  socket.onerror = (error: Event) => {
    // Optionally handle error
    console.error('WebSocket error:', error);
  };

  // Heartbeat (ping) mechanism
  if (pingIntervalId) clearInterval(pingIntervalId);
  pingIntervalId = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: WS_EVENTS.PING }));
    }
  }, WS_CONFIG.PING_INTERVAL);

  return socket;
}

export function sendMessage(message: unknown) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function closeWebSocket() {
  if (socket) {
    if (pingIntervalId) clearInterval(pingIntervalId);
    socket.close();
    socket = null;
  }
}

export default {
  connect: connectWebSocket,
  send: sendMessage,
  close: closeWebSocket,
  get instance() {
    return socket;
  }
};