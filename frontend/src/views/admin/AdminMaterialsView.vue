<template>
  <section class="resource-shell">
    <PageIntro title="Malzemeler" description="Büküm malzemesi verilerini yönetin." />

    <div class="resource-grid">
      <article class="card resource-card stack">
        <div>
          <p class="eyebrow">Malzeme Verisi</p>
          <h3 class="section-title">{{ form.id ? "Malzemeyi Düzenle" : "Malzeme Oluştur" }}</h3>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>Toplam Malzeme</strong>
            <span>{{ materials.length }}</span>
          </div>
          <div class="summary-tile">
            <strong>Varsayılan K Faktörü</strong>
            <span>{{ formatNumber(form.kFactorDefault) }}</span>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="saveMaterial">
          <label> Ad <input v-model="form.name" required /> </label>
          <label> Çekme Dayanımı MPa <input v-model.number="form.tensileStrengthMPa" type="number" step="any" required /> </label>
          <label> Akma Dayanımı MPa <input v-model.number="form.yieldStrengthMPa" type="number" step="any" required /> </label>
          <label> K Faktörü <input v-model.number="form.kFactorDefault" type="number" step="0.01" min="0" max="1" required /> </label>
          <label> Young Modülü MPa <input v-model.number="form.youngsModulusMPa" type="number" step="any" required /> </label>
          <label> Önerilen V-kalıp Faktörü <input v-model.number="form.recommendedVdieFactor" type="number" step="any" required /> </label>
          <label> Min. Kalınlık mm <input v-model.number="form.minThicknessMm" type="number" step="any" required /> </label>
          <label> Maks. Kalınlık mm <input v-model.number="form.maxThicknessMm" type="number" step="any" required /> </label>

          <p v-if="error" class="message-error">{{ error }}</p>
          <p v-if="success" class="message-success">{{ success }}</p>

          <div class="resource-actions">
            <button class="button-primary icon-only-button" :disabled="loading || fetching" aria-label="Malzemeyi kaydet" title="Malzemeyi kaydet">
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
          <h3 class="section-title">Mevcut Malzemeler</h3>
          <button class="button-secondary icon-only-button" :disabled="fetching" @click="loadMaterials" aria-label="Malzemeleri yenile" title="Malzemeleri yenile">
            <IconGlyph name="refresh" />
          </button>
        </div>

        <div v-if="fetching && !materials.length" class="loading-state">
          Malzemeler yükleniyor...
        </div>

        <div v-else-if="!materials.length" class="empty-state">
          Henüz malzeme yok. Öneri üretmeye başlamak için bir tane ekleyin.
        </div>

        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Rm</th>
              <th>Re</th>
              <th>K</th>
              <th>Kalınlık Aralığı</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="material in materials" :key="material.id">
              <td>{{ material.name }}</td>
              <td>{{ formatNumber(material.tensileStrengthMPa) }}</td>
              <td>{{ formatNumber(material.yieldStrengthMPa) }}</td>
              <td>{{ formatNumber(material.kFactorDefault) }}</td>
              <td>{{ formatNumber(material.minThicknessMm) }} - {{ formatNumber(material.maxThicknessMm) }}</td>
              <td class="resource-actions">
                <button class="button-secondary icon-only-button" @click="startEdit(material)" aria-label="Malzemeyi düzenle" title="Malzemeyi düzenle">
                  <IconGlyph name="edit" />
                </button>
                <button class="button-danger icon-only-button" @click="removeMaterial(material)" aria-label="Malzemeyi sil" title="Malzemeyi sil">
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
  items: materials,
  form,
  loading,
  fetching,
  error,
  success,
  resetForm,
  startEdit,
  loadItems: loadMaterials,
  saveItem: saveMaterial,
  removeItem: removeMaterial
} = useAdminResource({
  resourceName: "materials",
  createInitialForm: () => ({
    id: "",
    name: "",
    tensileStrengthMPa: "",
    yieldStrengthMPa: "",
    kFactorDefault: 0.42,
    youngsModulusMPa: "",
    recommendedVdieFactor: "",
    minThicknessMm: "",
    maxThicknessMm: ""
  }),
  messages: {
    loadError: "Malzemeler yüklenemedi",
    saveError: "Malzeme kaydedilemedi",
    deleteError: "Malzeme silinemedi",
    createSuccess: "Malzeme oluşturuldu.",
    updateSuccess: "Malzeme güncellendi.",
    deleteSuccess: "Malzeme silindi."
  },
  mapToPayload: ({ id, ...payload }) => payload,
  getDeleteLabel: (material) => material.name
});
</script>
