import axios from "axios";

// Create an Axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Backend URL from environment variables
  timeout: 5000, // Request timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors for request/response handling
apiClient.interceptors.request.use((config) => {
  // Add authorization token (if available)
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
