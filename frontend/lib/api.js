import axios from "axios";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    config.baseURL = `http://${hostname}:8000`;
  }
  return config;
});

let lastRefreshTime = Date.now();
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

api.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      const url = response.config?.url || "";
      if (
        !url.includes("/auth/refresh") &&
        !url.includes("/auth/logout") &&
        !url.includes("/auth/google") &&
        !url.includes("/auth/admin-login")
      ) {
        const now = Date.now();
        if (now - lastRefreshTime > REFRESH_INTERVAL_MS) {
          lastRefreshTime = now;
          const refreshUrl = `http://${window.location.hostname || "localhost"}:8000/auth/refresh`;
          axios.post(refreshUrl, {}, { withCredentials: true }).catch(() => {
            // Silently ignore background refresh errors for non-logged-in states
          });
        }
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;