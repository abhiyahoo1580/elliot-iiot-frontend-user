interface WsConfig {
  URL: string;
  RECONNECT_INTERVAL: number;
  MAX_RETRIES: number;
  PING_INTERVAL: number;
}

export const WS_CONFIG: WsConfig = {
  URL: import.meta.env.VITE_WS_URL as string,
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL),
  MAX_RETRIES: Number(import.meta.env.VITE_WS_MAX_RETRIES),
  PING_INTERVAL: Number(import.meta.env.VITE_WS_PING_INTERVAL),
};