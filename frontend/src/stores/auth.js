import { defineStore } from "pinia";

import { http } from "../api/http";
import { getErrorMessage } from "../utils/errors";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("spb_token"),
    user: JSON.parse(localStorage.getItem("spb_user") || "null"),
    loading: false,
    error: ""
  }),
  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await http.post("/auth/login", { username, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem("spb_token", data.token);
        localStorage.setItem("spb_user", JSON.stringify(data.user));
        return data.user;
      } catch (error) {
        this.error = getErrorMessage(error, "Giriş başarısız");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.error = "";
      localStorage.removeItem("spb_token");
      localStorage.removeItem("spb_user");
    },
    hydrate() {
      this.token = localStorage.getItem("spb_token");
      this.user = JSON.parse(localStorage.getItem("spb_user") || "null");
    }
  }
});
