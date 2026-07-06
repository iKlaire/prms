import axios from "axios";
import type { AuthState } from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Inject auth header on every request based on stored session
api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem("auth");
  if (raw) {
    const auth: AuthState = JSON.parse(raw);
    if (auth.role === "crew") {
      config.headers["x-crew-lead-id"] = auth.id;
    } else {
      config.headers["x-passenger-id"] = auth.id;
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
