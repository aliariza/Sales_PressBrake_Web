<template>
  <div class="page-shell">
    <div class="layout-grid">
      <aside class="card sidebar">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Alan</p>
            <h2 class="shell-title">Yönetim Paneli</h2>
          </div>
          <button class="button-secondary icon-only-button" @click="logout" aria-label="Çıkış" title="Çıkış">
            <IconGlyph name="logout" />
          </button>
        </div>
        <p v-if="auth.user" class="shell-subtitle">{{ auth.user.username }} olarak giriş yapıldı</p>
        <router-link class="nav-link" to="/admin/users">Kullanıcılar</router-link>
        <router-link class="nav-link" to="/admin/materials">Malzemeler</router-link>
        <router-link class="nav-link" to="/admin/machines">Makineler</router-link>
        <router-link class="nav-link" to="/admin/tooling">Takımlar</router-link>
        <router-link class="nav-link" to="/admin/options">Opsiyonlar</router-link>
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

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
}

.sidebar,
.content {
  padding: 24px;
}

.sidebar {
  display: grid;
  gap: 10px;
  align-content: start;
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
