/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_WS_URL: string;
  readonly VITE_WS_RECONNECT_INTERVAL: string;
  readonly VITE_WS_MAX_RETRIES: string;
  readonly VITE_WS_PING_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 