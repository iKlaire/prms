import axios from "axios";
import type { AuthState } from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Inject auth token on every request based on stored session
api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem("auth");
  if (raw) {
    try {
      const auth = JSON.parse(raw) as Partial<AuthState>;
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch {
      sessionStorage.removeItem("auth");
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: { response?: { data?: { error?: string } }; message?: string }) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export default api;
