<template>
  <section class="resource-shell">
    <PageIntro title="Opsiyonlar" description="Teklif opsiyonlarını ve fiyatlarını yönetin." />

    <div class="resource-grid">
      <article class="card resource-card stack">
        <div>
          <p class="eyebrow">Ticari Ekstralar</p>
          <h3 class="section-title">{{ form.id ? "Opsiyonu Düzenle" : "Opsiyon Oluştur" }}</h3>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>Toplam Opsiyon</strong>
            <span>{{ options.length }}</span>
          </div>
          <div class="summary-tile">
            <strong>Geçerli Fiyat</strong>
            <span>{{ formatCurrency(form.priceUsd) }}</span>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="saveOption">
          <label> Kod <input v-model="form.code" required /> </label>
          <label> Ad <input v-model="form.name" required /> </label>
          <label> Fiyat USD <input v-model.number="form.priceUsd" type="number" step="any" required /> </label>

          <p v-if="error" class="message-error">{{ error }}</p>
          <p v-if="success" class="message-success">{{ success }}</p>

          <div class="resource-actions">
            <button class="button-primary icon-only-button" :disabled="loading || fetching" aria-label="Opsiyonu kaydet" title="Opsiyonu kaydet">
              <IconGlyph name="save" />
            </button>
            <button v-if="form.id" type="button" class="button-secondary icon-only-button" :disabled="loading" @click="resetForm" aria-label="Düzenlemeyi iptal et" title="Düzenlemeyi iptal et">
              <IconGlyph name="cancel" />
            </button>
          </div>
        </form>
      </article>

      <article class="card resource-card table-card">
        <div class="toolbar">
          <h3 class="section-title">Mevcut Opsiyonlar</h3>
          <button class="button-secondary icon-only-button" :disabled="fetching" @click="loadOptions" aria-label="Opsiyonları yenile" title="Opsiyonları yenile">
            <IconGlyph name="refresh" />
          </button>
        </div>

        <LoadingState v-if="fetching && !options.length" label="Opsiyonlar yükleniyor" />

        <div v-else-if="!options.length" class="empty-state">
          Henüz ticari opsiyon yok. Yükseltme paketlerini veya güvenlik özelliklerini buraya ekleyin.
        </div>

        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Ad</th>
              <th>Fiyat</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in options" :key="option.id">
              <td>{{ option.code }}</td>
              <td>{{ option.name }}</td>
              <td>{{ formatCurrency(option.priceUsd) }}</td>
              <td class="resource-actions">
                <button class="button-secondary icon-only-button" @click="startEdit(option)" aria-label="Opsiyonu düzenle" title="Opsiyonu düzenle">
                  <IconGlyph name="edit" />
                </button>
                <button class="button-danger icon-only-button" @click="removeOption(option)" aria-label="Opsiyonu sil" title="Opsiyonu sil">
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
import IconGlyph from "../../components/shared/IconGlyph.vue";
import LoadingState from "../../components/shared/LoadingState.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { useAdminResource } from "../../composables/useAdminResource";
import { formatCurrency } from "../../utils/formatters";

const {
  items: options,
  form,
  loading,
  fetching,
  error,
  success,
  resetForm,
  startEdit,
  loadItems: loadOptions,
  saveItem: saveOption,
  removeItem: removeOption
} = useAdminResource({
  resourceName: "options",
  createInitialForm: () => ({
    id: "",
    code: "",
    name: "",
    priceUsd: ""
  }),
  messages: {
    loadError: "Opsiyonlar yüklenemedi",
    saveError: "Opsiyon kaydedilemedi",
    deleteError: "Opsiyon silinemedi",
    createSuccess: "Opsiyon oluşturuldu.",
    updateSuccess: "Opsiyon güncellendi.",
    deleteSuccess: "Opsiyon silindi."
  },
  mapToPayload: ({ id, ...payload }) => payload,
  getDeleteLabel: (option) => option.code
});
</script>
