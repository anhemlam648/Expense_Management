import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

export const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default api;
