<template>
  <section class="resource-shell">
    <PageIntro title="Kullanıcılar" description="Kullanıcıları ve rollerini yönetin." />

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
import { onMounted, reactive, ref } from "vue";
import { computed } from "vue";

import { createResource, deleteResource, listResource, updateResource } from "../../api/resources";
import IconGlyph from "../../components/shared/IconGlyph.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { getErrorMessage } from "../../utils/errors";

const users = ref([]);
const adminCount = computed(() => users.value.filter((user) => user.role === "admin").length);
const loading = ref(false);
const fetching = ref(false);
const error = ref("");
const success = ref("");
const form = reactive({
  id: "",
  username: "",
  password: "",
  role: "user",
  comments: ""
});

function resetForm() {
  form.id = "";
  form.username = "";
  form.password = "";
  form.role = "user";
  form.comments = "";
}

function startEdit(user) {
  form.id = user.id;
  form.username = user.username;
  form.password = "";
  form.role = user.role;
  form.comments = user.comments || "";
  error.value = "";
  success.value = "";
}

async function loadUsers() {
  fetching.value = true;

  try {
    users.value = await listResource("users");
  } catch (err) {
    error.value = getErrorMessage(err, "Kullanıcılar yüklenemedi");
  } finally {
    fetching.value = false;
  }
}

async function saveUser() {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload = {
      username: form.username,
      password: form.password,
      role: form.role,
      comments: form.comments
    };

    if (form.id) {
      await updateResource("users", form.id, payload);
      success.value = "Kullanıcı güncellendi.";
    } else {
      await createResource("users", payload);
      success.value = "Kullanıcı oluşturuldu.";
    }

    resetForm();
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err, "Kullanıcı kaydedilemedi");
  } finally {
    loading.value = false;
  }
}

async function removeUser(user) {
  if (!window.confirm(`${user.username} silinsin mi?`)) {
    return;
  }

  try {
    await deleteResource("users", user.id);
    if (form.id === user.id) {
      resetForm();
    }
    success.value = "Kullanıcı silindi.";
    error.value = "";
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err, "Kullanıcı silinemedi");
  }
}

onMounted(loadUsers);
</script>
