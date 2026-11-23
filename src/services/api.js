import axios from "axios";

/**
 * Axios instance — points to a placeholder base URL.
 * When a real backend is introduced, set VITE_API_BASE_URL and swap
 * the mock services for real HTTP calls without touching the UI layer.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
});

/**
 * Simulates network latency so loading states behave like a real API.
 */
export function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
