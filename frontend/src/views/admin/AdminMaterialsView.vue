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
import { onMounted, reactive, ref } from "vue";

import { createResource, deleteResource, listResource, updateResource } from "../../api/resources";
import IconGlyph from "../../components/shared/IconGlyph.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { getErrorMessage } from "../../utils/errors";
import { formatNumber } from "../../utils/formatters";

const materials = ref([]);
const loading = ref(false);
const fetching = ref(false);
const error = ref("");
const success = ref("");
const form = reactive({
  id: "",
  name: "",
  tensileStrengthMPa: "",
  yieldStrengthMPa: "",
  kFactorDefault: 0.42,
  youngsModulusMPa: "",
  recommendedVdieFactor: "",
  minThicknessMm: "",
  maxThicknessMm: ""
});

function resetForm() {
  form.id = "";
  form.name = "";
  form.tensileStrengthMPa = "";
  form.yieldStrengthMPa = "";
  form.kFactorDefault = 0.42;
  form.youngsModulusMPa = "";
  form.recommendedVdieFactor = "";
  form.minThicknessMm = "";
  form.maxThicknessMm = "";
}

function startEdit(material) {
  Object.assign(form, material);
  error.value = "";
  success.value = "";
}

async function loadMaterials() {
  fetching.value = true;

  try {
    materials.value = await listResource("materials");
  } catch (err) {
    error.value = getErrorMessage(err, "Malzemeler yüklenemedi");
  } finally {
    fetching.value = false;
  }
}

async function saveMaterial() {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload = { ...form };
    delete payload.id;

    if (form.id) {
      await updateResource("materials", form.id, payload);
      success.value = "Malzeme güncellendi.";
    } else {
      await createResource("materials", payload);
      success.value = "Malzeme oluşturuldu.";
    }

    resetForm();
    await loadMaterials();
  } catch (err) {
    error.value = getErrorMessage(err, "Malzeme kaydedilemedi");
  } finally {
    loading.value = false;
  }
}

async function removeMaterial(material) {
  if (!window.confirm(`${material.name} silinsin mi?`)) {
    return;
  }

  try {
    await deleteResource("materials", material.id);
    if (form.id === material.id) {
      resetForm();
    }
    success.value = "Malzeme silindi.";
    error.value = "";
    await loadMaterials();
  } catch (err) {
    error.value = getErrorMessage(err, "Malzeme silinemedi");
  }
}

onMounted(loadMaterials);
</script>
