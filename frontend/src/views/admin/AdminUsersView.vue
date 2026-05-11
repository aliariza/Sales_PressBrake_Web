<template>
  <section class="resource-shell">
    <PageIntro title="Kullanıcılar" description="Kullanıcıları ve rollerini yönetin." />

    <div v-if="initialLoading" class="loading-state page-loading-state">
      Kullanıcı verileri yükleniyor...
    </div>

    <div class="resource-grid">
      <article class="card resource-card stack">
        <div>
          <p class="eyebrow">Kimlik</p>
          <h3 class="section-title">{{ form.id ? "Kullanıcı Düzenle" : "Kullanıcı Oluştur" }}</h3>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>Toplam Kullanıcı</strong>
            <span>{{ users.length }}</span>
          </div>
          <div class="summary-tile">
            <strong>Yöneticiler</strong>
            <span>{{ adminCount }}</span>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="saveUser">
          <label>
            Kullanıcı Adı
            <input v-model="form.username" required />
          </label>

          <label>
            Şifre
            <input v-model="form.password" :placeholder="form.id ? 'Mevcut şifreyi korumak için boş bırakın' : 'Zorunlu'" />
          </label>

          <label>
            Rol
            <select v-model="form.role">
              <option value="user">Kullanıcı</option>
              <option value="admin">Yönetici</option>
            </select>
          </label>

          <label>
            Yorumlar
            <textarea v-model="form.comments" rows="4" />
          </label>

          <p v-if="error" class="message-error">{{ error }}</p>
          <p v-if="success" class="message-success">{{ success }}</p>

          <div class="resource-actions">
            <button class="button-primary icon-only-button" :disabled="loading || fetching" aria-label="Kullanıcıyı kaydet" title="Kullanıcıyı kaydet">
              <IconGlyph :name="form.id ? 'save' : 'save'" />
            </button>
            <button v-if="form.id" type="button" class="button-secondary icon-only-button" :disabled="loading" @click="resetForm" aria-label="Düzenlemeyi iptal et" title="Düzenlemeyi iptal et">
              <IconGlyph name="cancel" />
            </button>
          </div>
        </form>
      </article>

      <article class="card resource-card table-card">
        <div class="toolbar">
          <h3 class="section-title">Mevcut Kullanıcılar</h3>
          <button class="button-secondary icon-only-button" :disabled="fetching" @click="loadUsers" aria-label="Kullanıcıları yenile" title="Kullanıcıları yenile">
            <IconGlyph name="refresh" />
          </button>
        </div>

        <div v-if="fetching && !users.length" class="loading-state">
          Kullanıcılar yükleniyor...
        </div>

        <div v-else-if="!users.length" class="empty-state">
          Henüz kullanıcı yok. Soldaki formdan ilk kullanıcıyı oluşturun.
        </div>

        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Rol</th>
              <th>Yorumlar</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.comments || "-" }}</td>
              <td class="resource-actions">
                <button class="button-secondary icon-only-button" @click="startEdit(user)" aria-label="Kullanıcıyı düzenle" title="Kullanıcıyı düzenle">
                  <IconGlyph name="edit" />
                </button>
                <button class="button-danger icon-only-button" @click="removeUser(user)" aria-label="Kullanıcıyı sil" title="Kullanıcıyı sil">
                  <IconGlyph name="delete" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

import IconGlyph from "../../components/shared/IconGlyph.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { useAdminResource } from "../../composables/useAdminResource";

const {
  items: users,
  form,
  loading,
  fetching,
  initialLoading,
  error,
  success,
  resetForm,
  startEdit,
  loadItems: loadUsers,
  saveItem: saveUser,
  removeItem: removeUser
} = useAdminResource({
  resourceName: "users",
  createInitialForm: () => ({
    id: "",
    username: "",
    password: "",
    role: "user",
    comments: ""
  }),
  messages: {
    loadError: "Kullanıcılar yüklenemedi",
    saveError: "Kullanıcı kaydedilemedi",
    deleteError: "Kullanıcı silinemedi",
    createSuccess: "Kullanıcı oluşturuldu.",
    updateSuccess: "Kullanıcı güncellendi.",
    deleteSuccess: "Kullanıcı silindi."
  },
  mapToForm: (user) => ({
    id: user.id,
    username: user.username,
    password: "",
    role: user.role,
    comments: user.comments || ""
  }),
  mapToPayload: ({ username, password, role, comments }) => ({
    username,
    password,
    role,
    comments
  }),
  getDeleteLabel: (user) => user.username
});

const adminCount = computed(() => users.value.filter((user) => user.role === "admin").length);
</script>
