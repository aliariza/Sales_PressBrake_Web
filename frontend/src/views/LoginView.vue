<template>
  <div class="page-shell login-shell">
    <section class="card login-card">
      <p class="eyebrow">Sales Press Brake</p>
      <PageIntro
        title="Giriş Yap"
        description="Tekliflendirme, öneriler ve yönetim alanına erişin."
      />

      <form class="login-form" @submit.prevent="submit">
        <label>
          Kullanıcı Adı
          <input v-model.trim="username" placeholder="Kullanıcı adı" :disabled="auth.loading" />
        </label>
        <label>
          Şifre
          <input v-model="password" type="password" placeholder="Şifre" :disabled="auth.loading" />
        </label>
        <p v-if="auth.error" class="message-error">{{ auth.error }}</p>
        <button class="button-primary" :disabled="auth.loading" aria-label="Giriş yap" title="Giriş yap">
          <IconGlyph name="login" />
          Giriş Yap
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import IconGlyph from "../components/shared/IconGlyph.vue";
import PageIntro from "../components/shared/PageIntro.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const username = ref("");
const password = ref("");

async function submit() {
  if (!username.value || !password.value) {
    auth.error = "Kullanıcı adı ve şifreyi girin.";
    return;
  }

  try {
    const user = await auth.login(username.value, password.value);
    router.push(user.role === "admin" ? "/admin/users" : "/app/recommendation");
  } catch {
    // handled by store state
  }
}
</script>

<style scoped>
.login-shell {
  display: grid;
  place-items: center;
}

.login-card {
  width: min(420px, 100%);
  padding: 30px;
}

.login-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 0.92rem;
  font-weight: 600;
}

input {
  border: 1px solid var(--line-soft);
  border-radius: 0;
  padding: 12px 14px;
}
</style>
