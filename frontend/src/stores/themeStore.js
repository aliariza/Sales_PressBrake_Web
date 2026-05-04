import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem('theme-mode') || 'light'
  }),

  getters: {
    isDark: (state) => state.mode === 'dark'
  },

  actions: {
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.mode)
      localStorage.setItem('theme-mode', this.mode)
    },

    toggleTheme() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark'
      this.applyTheme()
    },

    setTheme(mode) {
      this.mode = mode
      this.applyTheme()
    }
  }
})