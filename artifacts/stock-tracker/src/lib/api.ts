/**
 * API base URL configuration.
 *
 * In development (Replit): proxy routes requests through Vite, so
 * relative paths like /api/... work without any base URL.
 *
 * In production (Vercel or standalone): set VITE_API_BASE_URL to the
 * full URL of your deployed API server, e.g.:
 *   VITE_API_BASE_URL=https://api.yourdomain.com
 *
 * If the env var is not set, the helper falls back to an empty string
 * so relative paths continue to work (Replit dev, same-origin deploys).
 */
const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "https://stock-api-server-e146.onrender.com";

/**
 * Constructs a full API URL from a path.
 *
 * @example
 *   apiUrl("/api/stocks/AAPL")       // → "/api/stocks/AAPL" (dev)
 *   apiUrl("/api/stocks/AAPL")       // → "https://api.example.com/api/stocks/AAPL" (prod)
 */
export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}
