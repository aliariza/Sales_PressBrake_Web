<template>
  <button class="theme-toggle" type="button" @click="themeStore.toggleTheme">
    <span v-if="themeStore.isDark">☀️ Light</span>
    <span v-else>🌙 Dark</span>
  </button>
</template>

<script setup>
import { useThemeStore } from '../../stores/themeStore'

const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  min-height: 36px;
  padding: 8px 14px;

  border-radius: 999px;
  border: 1px solid var(--border-color);

  background: var(--bg-card);
  color: var(--text-main);

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
}

.theme-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
}
</style>