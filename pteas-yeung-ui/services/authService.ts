import api from "@/lib/api";
import Cookies from "js-cookie";

export const authService = {
  // មុខងារ Login
  login: async (email: string, password: string) => {
    const response = await api.post("/login", { email, password });
    const { access_token, user } = response.data;
    const isProduction = process.env.NODE_ENV === "production";

    if (access_token && user) {
      Cookies.set("access_token", access_token, {
        expires: 7,
        path: "/",
        secure: isProduction, // 🟢 ប្រើ false ពេលនៅលើ Localhost HTTP
        sameSite: "lax",
      });

      Cookies.set("user_role", user.role, {
        expires: 7,
        path: "/",
        secure: isProduction,
        sameSite: "lax",
      });

      localStorage.setItem("user", JSON.stringify(user));
    }
    return response.data;
  },

  // មុខងារ Logout
  logout: async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // 🟢 សម្អាត Cookies និង localStorage ចេញឱ្យអស់ (កុំភ្លេចលុប user_role ជាមួយ path: "/")
      Cookies.remove("access_token", { path: "/" });
      Cookies.remove("user_role", { path: "/" }); // 👈 ថែមជួរនេះ

      localStorage.removeItem("user");

      // បង្វែរទៅទំព័រ Login វិញ
      window.location.href = "/login";
    }
  },
};
