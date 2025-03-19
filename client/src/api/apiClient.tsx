import axios from "axios";

console.log("API_URL:", import.meta.env.VITE_API_URL); // Debugging

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:5001/api", // Fallback
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("apiClient created with baseURL:", apiClient.defaults.baseURL);

// Optional: Add interceptors for request/response handling
//apiClient.interceptors.request.use((config) => {
//  // Add authorization token (if available)
//  const token = localStorage.getItem("token");
//  if (token) {
//    config.headers.Authorization = `Bearer ${token}`;
//  }
//  return config;
//});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
