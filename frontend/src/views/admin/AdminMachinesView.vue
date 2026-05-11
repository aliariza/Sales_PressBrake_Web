<template>
  <section class="resource-shell">
    <PageIntro title="Makineler" description="Makine kapasitesi ve fiyatlarını yönetin." />

    <LoadingState v-if="initialLoading" class="page-loading-state" label="Makine verileri yükleniyor" />

    <div class="resource-grid">
      <article class="card resource-card stack">
        <div>
          <p class="eyebrow">Kapasite</p>
          <h3 class="section-title">{{ form.id ? "Makineyi Düzenle" : "Makine Oluştur" }}</h3>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>Toplam Makine</strong>
            <span>{{ machines.length }}</span>
          </div>
          <div class="summary-tile">
            <strong>Geçerli Fiyat</strong>
            <span>{{ formatCurrency(form.basePriceUSD) }}</span>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="saveMachine">
          <label> Model <input v-model="form.model" required /> </label>
          <label> Maks. Tonaj Tonf <input v-model.number="form.maxTonnageTonf" type="number" step="any" required /> </label>
          <label> Çalışma Boyu mm <input v-model.number="form.workingLengthMm" type="number" step="any" required /> </label>
          <label> Maks. Kalınlık mm <input v-model.number="form.maxThicknessMm" type="number" step="any" required /> </label>
          <label> Baz Fiyat USD <input v-model.number="form.basePriceUSD" type="number" step="any" required /> </label>

          <p v-if="error" class="message-error">{{ error }}</p>
          <p v-if="success" class="message-success">{{ success }}</p>

          <div class="resource-actions">
            <button class="button-primary icon-only-button" :disabled="loading || fetching" aria-label="Makineyi kaydet" title="Makineyi kaydet">
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
          <h3 class="section-title">Mevcut Makineler</h3>
          <button class="button-secondary icon-only-button" :disabled="fetching" @click="loadMachines" aria-label="Makineleri yenile" title="Makineleri yenile">
            <IconGlyph name="refresh" />
          </button>
        </div>

        <LoadingState v-if="fetching && !machines.length" label="Makineler yükleniyor" />

        <div v-else-if="!machines.length" class="empty-state">
          Henüz makine yok. Uygun önerileri etkinleştirmek için bir makine ekleyin.
        </div>

        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Tonnage</th>
              <th>Boy</th>
              <th>Maks. Kalınlık</th>
              <th>Baz Fiyat</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="machine in machines" :key="machine.id">
              <td>{{ machine.model }}</td>
              <td>{{ formatNumber(machine.maxTonnageTonf) }}</td>
              <td>{{ formatNumber(machine.workingLengthMm) }}</td>
              <td>{{ formatNumber(machine.maxThicknessMm) }}</td>
              <td>{{ formatCurrency(machine.basePriceUSD) }}</td>
              <td class="resource-actions">
                <button class="button-secondary icon-only-button" @click="startEdit(machine)" aria-label="Makineyi düzenle" title="Makineyi düzenle">
                  <IconGlyph name="edit" />
                </button>
                <button class="button-danger icon-only-button" @click="removeMachine(machine)" aria-label="Makineyi sil" title="Makineyi sil">
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
import { formatCurrency, formatNumber } from "../../utils/formatters";

const {
  items: machines,
  form,
  loading,
  fetching,
  initialLoading,
  error,
  success,
  resetForm,
  startEdit,
  loadItems: loadMachines,
  saveItem: saveMachine,
  removeItem: removeMachine
} = useAdminResource({
  resourceName: "machines",
  createInitialForm: () => ({
    id: "",
    model: "",
    maxTonnageTonf: "",
    workingLengthMm: "",
    maxThicknessMm: "",
    basePriceUSD: ""
  }),
  messages: {
    loadError: "Makineler yüklenemedi",
    saveError: "Makine kaydedilemedi",
    deleteError: "Makine silinemedi",
    createSuccess: "Makine oluşturuldu.",
    updateSuccess: "Makine güncellendi.",
    deleteSuccess: "Makine silindi."
  },
  mapToPayload: ({ id, ...payload }) => payload,
  getDeleteLabel: (machine) => machine.model
});
</script>
