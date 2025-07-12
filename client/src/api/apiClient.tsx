import axios, { AxiosError } from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl)
  throw new Error("VITE_API_URL environment variable is not defined");

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

const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.title;
    let type = ErrorType.UNKNOWN;

    if (status === 401 || status === 403) type = ErrorType.AUTH;
    else if (status === 400) type = ErrorType.VALIDATION;
    else if (status && status >= 500) type = ErrorType.SERVER;
    else if (error.code === "ECONNABORTED" || !error.response)
      type = ErrorType.NETWORK;

    const apiError: ApiError = {
      type,
      status,
      message: backendMessage || "An error occurred",
      originalError: error,
      data: error.response?.data,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;
