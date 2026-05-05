import { defineStore } from "pinia";

function getSystemMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "system",
    resolvedMode: "light",
    mediaQueryList: null,
    mediaQueryHandler: null
  }),

  getters: {
    isDark: (state) => state.resolvedMode === "dark"
  },

  actions: {
    applyTheme() {
      this.resolvedMode = getSystemMode();
      document.documentElement.setAttribute("data-theme", this.resolvedMode);
    },

    startSystemSync() {
      this.applyTheme();

      if (this.mediaQueryList && this.mediaQueryHandler) {
        this.mediaQueryList.removeEventListener("change", this.mediaQueryHandler);
      }

      this.mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
      this.mediaQueryHandler = () => this.applyTheme();
      this.mediaQueryList.addEventListener("change", this.mediaQueryHandler);
    }
  }
});
