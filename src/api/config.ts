//config.js
// api/config.js
interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  HEADERS: Record<string, string>;
}

// export const API_CONFIG: ApiConfig = {
//   BASE_URL: import.meta.env.VITE_API_URL as string,
//   TIMEOUT: import.meta.env.VITE_API_TIMEOUT as string,
//   HEADERS: {
//     'Content-Type': 'application/json',
//   },
export const API_CONFIG: ApiConfig = {
  BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8003",
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  HEADERS: { "Content-Type": "application/json"},
};
