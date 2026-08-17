import axios from "axios";
import toast from "react-hot-toast";

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

/**
 * Extracts a user-friendly error message from backend responses (e.g., FastAPI details, validation errors).
 */
const extractErrorMessage = (error) => {
  if (!error) return "An unexpected server error occurred. Please try again.";

  const data = error.response?.data;

  if (data) {
    // 1. FastAPI HTTPException: {"detail": "Error string"}
    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }

    // 2. FastAPI RequestValidationError (422): {"detail": [{"msg": "...", "loc": [...]}]}
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const firstError = data.detail[0];
      if (typeof firstError === "string") return firstError;
      if (firstError && typeof firstError === "object" && firstError.msg) {
        const field = Array.isArray(firstError.loc) ? firstError.loc[firstError.loc.length - 1] : "";
        return field && typeof field === "string" && !field.startsWith("__")
          ? `${field.charAt(0).toUpperCase() + field.slice(1)}: ${firstError.msg}`
          : firstError.msg;
      }
    }

    // 3. Custom message or error fields
    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  }

  // 4. Axios standard error messages
  if (error.message && typeof error.message === "string") {
    if (error.message === "Network Error") {
      return "Unable to connect to the server. Please check your network connection.";
    }
    return error.message;
  }

  return "An unexpected server error occurred. Please try again.";
};

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
  (error) => {
    if (typeof window !== "undefined") {
      const status = error.response?.status;
      const url = error.config?.url || "";

      // Bypass toast notifications for 401 Unauthorized handled by silent token refresh or auth checks
      const isSilentAuthUrl =
        url.includes("/auth/refresh") ||
        url.includes("/auth/me");

      const isHandled401 = status === 401 && isSilentAuthUrl;

      // Display global error toast for all other 4xx and 5xx errors
      if (!isHandled401 && (!status || (status >= 400 && status <= 599))) {
        const message = extractErrorMessage(error);
        toast.error(message, { id: `api-error-${url}-${message.slice(0, 20)}` });
      }
    }
    return Promise.reject(error);
  }
);

export default api;