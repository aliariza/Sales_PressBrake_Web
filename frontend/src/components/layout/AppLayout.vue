<template>
  <div class="page-shell">
    <div class="layout-grid">
      <aside class="card sidebar">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Alan</p>
            <h2 class="shell-title">Satış Akışı</h2>
          </div>

          <div class="toolbar-actions">
            <button class="button-secondary icon-only-button" @click="logout" aria-label="Çıkış" title="Çıkış">
              <IconGlyph name="logout" />
            </button>
          </div>
        </div>

        <p v-if="auth.user" class="shell-subtitle">{{ auth.user.username }} olarak giriş yapıldı</p>
        <router-link class="nav-link" to="/app/recommendation">Öneri</router-link>
        <router-link class="nav-link" to="/app/quotes">Teklifler</router-link>
        <a
          class="nav-link"
          :href="manualUrl"
          target="_blank"
          rel="noopener noreferrer"
          title="Kullanım kılavuzunu yeni sekmede aç"
        >
          Kullanım Kılavuzu
        </a>
        <router-link v-if="auth.user?.role === 'admin'" class="nav-link" to="/admin/users">Yönetim</router-link>
      </aside>

      <main class="card content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

import IconGlyph from "../shared/IconGlyph.vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const manualUrl = "/kullanim-kilavuzu.html";

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 20px;
}

.sidebar,
.content {
  padding: 24px;
}

.sidebar {
  display: grid;
  gap: 10px;
  align-content: start;
  min-height: calc(100vh - 56px);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
