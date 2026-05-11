<template>
  <section class="resource-shell">
    <PageIntro title="Takımlar" description="V-kalıp ve takım yapılandırmasını yönetin." />

    <div v-if="initialLoading" class="loading-state page-loading-state">
      Takım verileri yükleniyor...
    </div>

    <div class="resource-grid">
      <article class="card resource-card stack">
        <div>
          <p class="eyebrow">Şekillendirme Takımları</p>
          <h3 class="section-title">{{ form.id ? "Takımı Düzenle" : "Takım Oluştur" }}</h3>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>Toplam Takım</strong>
            <span>{{ toolings.length }}</span>
          </div>
          <div class="summary-tile">
            <strong>Seçili V-kalıp</strong>
            <span>{{ formatNumber(form.vDieMm) }}</span>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="saveTooling">
          <label> Ad <input v-model="form.name" required /> </label>
          <label> V-kalıp mm <input v-model.number="form.vDieMm" type="number" step="any" required /> </label>
          <label> Punç Yarıçapı mm <input v-model.number="form.punchRadiusMm" type="number" step="any" required /> </label>
          <label> Kalıp Yarıçapı mm <input v-model.number="form.dieRadiusMm" type="number" step="any" required /> </label>

          <p v-if="error" class="message-error">{{ error }}</p>
          <p v-if="success" class="message-success">{{ success }}</p>

          <div class="resource-actions">
            <button class="button-primary icon-only-button" :disabled="loading || fetching" aria-label="Takımı kaydet" title="Takımı kaydet">
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
          <h3 class="section-title">Mevcut Takımlar</h3>
          <button class="button-secondary icon-only-button" :disabled="fetching" @click="loadToolings" aria-label="Takımları yenile" title="Takımları yenile">
            <IconGlyph name="refresh" />
          </button>
        </div>

        <div v-if="fetching && !toolings.length" class="loading-state">
          Takımlar yükleniyor...
        </div>

        <div v-else-if="!toolings.length" class="empty-state">
          Henüz takım yok. Başlamak için standart V-kalıplar ve punçlar ekleyin.
        </div>

        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>V-kalıp</th>
              <th>Punç Yarıçapı</th>
              <th>Kalıp Yarıçapı</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tooling in toolings" :key="tooling.id">
              <td>{{ tooling.name }}</td>
              <td>{{ formatNumber(tooling.vDieMm) }}</td>
              <td>{{ formatNumber(tooling.punchRadiusMm) }}</td>
              <td>{{ formatNumber(tooling.dieRadiusMm) }}</td>
              <td class="resource-actions">
                <button class="button-secondary icon-only-button" @click="startEdit(tooling)" aria-label="Takımı düzenle" title="Takımı düzenle">
                  <IconGlyph name="edit" />
                </button>
                <button class="button-danger icon-only-button" @click="removeTooling(tooling)" aria-label="Takımı sil" title="Takımı sil">
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
import PageIntro from "../../components/shared/PageIntro.vue";
import { useAdminResource } from "../../composables/useAdminResource";
import { formatNumber } from "../../utils/formatters";

const {
  items: toolings,
  form,
  loading,
  fetching,
  initialLoading,
  error,
  success,
  resetForm,
  startEdit,
  loadItems: loadToolings,
  saveItem: saveTooling,
  removeItem: removeTooling
} = useAdminResource({
  resourceName: "toolings",
  createInitialForm: () => ({
    id: "",
    name: "",
    vDieMm: "",
    punchRadiusMm: "",
    dieRadiusMm: ""
  }),
  messages: {
    loadError: "Takımlar yüklenemedi",
    saveError: "Takım kaydedilemedi",
    deleteError: "Takım silinemedi",
    createSuccess: "Takım oluşturuldu.",
    updateSuccess: "Takım güncellendi.",
    deleteSuccess: "Takım silindi."
  },
  mapToPayload: ({ id, ...payload }) => payload,
  getDeleteLabel: (tooling) => tooling.name
});
</script>
