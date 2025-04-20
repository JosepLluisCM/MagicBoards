import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Verify that the API URL environment variable exists
const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  throw new Error("VITE_API_URL environment variable is not defined");
}

// Define error types for better categorization
export enum ErrorType {
  AUTH = "auth",
  VALIDATION = "validation",
  SERVER = "server",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

export interface ApiError {
  type: ErrorType;
  status?: number;
  message: string;
  originalError: Error | AxiosError;
  data?: any;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 5000000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("apiClient created with baseURL:", apiClient.defaults.baseURL);

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You could add common headers or logging here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let apiError: ApiError = {
      type: ErrorType.UNKNOWN,
      message: "An unknown error occurred",
      originalError: error,
    };

    if (axios.isAxiosError(error)) {
      // Get the status code
      const status = error.response?.status;
      apiError.status = status;

      // Based on status code, categorize the error
      if (status === 401) {
        apiError.type = ErrorType.AUTH;
        apiError.message = "Authentication required";

        // Skip auth:unauthorized event for logout requests
        if (error.config?.headers?.["X-Logout-Flow"]) {
          console.log("Ignoring 401 during logout flow");
          return Promise.reject(apiError);
        }

        // Handle auth checks vs. actual auth failures
        if (error.config?.headers?.["X-Auth-Check"]) {
          console.log("Auth check failed - expected for non-logged in users");
          // For expected auth checks, just return the error without dispatching event
          return Promise.reject(apiError);
        } else {
          console.log("Unauthorized access detected, triggering logout event");
          window.dispatchEvent(new Event("auth:unauthorized"));
        }
      } else if (status === 403) {
        apiError.type = ErrorType.AUTH;
        apiError.message = "You don't have permission to access this resource";
      } else if (status === 400) {
        apiError.type = ErrorType.VALIDATION;
        apiError.message = "Invalid request";
        apiError.data = error.response?.data;
      } else if (status && status >= 500) {
        apiError.type = ErrorType.SERVER;
        apiError.message = "Server error occurred";
      } else if (error.code === "ECONNABORTED" || !error.response) {
        apiError.type = ErrorType.NETWORK;
        apiError.message = "Network error - please check your connection";
      }

      // Add response data if available
      if (error.response?.data) {
        apiError.data = error.response.data;
      }
    }

    // Log error (but not 401 auth checks which are expected)
    if (
      !(
        apiError.type === ErrorType.AUTH &&
        apiError.status === 401 &&
        error.config?.headers?.["X-Auth-Check"]
      )
    ) {
      console.error(
        `API Error [${apiError.type}]:`,
        apiError.message,
        apiError.data || apiError.originalError
      );
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
