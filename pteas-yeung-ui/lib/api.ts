// lib/api.ts
import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    // 'Content-Type': 'application/json',
    Accept: "application/json",
  },
});

// ចាប់យក Token ពី Cookies ទៅដាក់ក្នុង Header រាល់ពេលបាញ់ Request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ស្ទាក់ចាប់ Response Error (401 Unauthorized Session Expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      // Avoid redirect loops on public login/auth pages
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/auth") && !path.startsWith("/register")) {
        Cookies.remove("access_token", { path: "/" });
        Cookies.remove("user_role", { path: "/" });
        localStorage.removeItem("user");
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
