import axios from "axios";

// Verify that the API URL environment variable exists
const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  throw new Error("VITE_API_URL environment variable is not defined");
}

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 5000000,
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
