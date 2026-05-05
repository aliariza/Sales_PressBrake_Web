<template>
  <section class="resource-shell">
    <PageIntro
      title="Öneri"
      description="Bilgileri girin, önerileri alın ve teklif oluşturun."
    />

    <div class="resource-grid">
      <article class="card resource-card">
        <p class="eyebrow">Adım 1</p>
        <h3 class="section-title">Girdiler</h3>
        <form class="resource-form" @submit.prevent="runRecommendation">
          <label>
            Malzeme
            <select
              v-model="form.materialNameSnapshot"
              :disabled="fetchingMaterials || loading"
              @change="syncSelectedMaterial"
            >
              <option value="">Malzeme seçin</option>
              <option v-for="material in materials" :key="material.id" :value="material.name">
                {{ material.name }}
              </option>
            </select>
          </label>

          <label>
            Kalınlık mm
            <input v-model.number="form.thicknessMm" type="number" step="any" required :disabled="loading" />
          </label>

          <label>
            Büküm Boyu mm
            <input v-model.number="form.bendLengthMm" type="number" step="any" required :disabled="loading" />
          </label>

          <label>
            Notlar
            <textarea v-model="form.notes" rows="4" :disabled="loading || saving" />
          </label>

          <button class="button-primary" :disabled="loading || fetchingMaterials">
            <IconGlyph name="refresh" />
            {{ loading ? "Hesaplanıyor..." : "Öneri Getir" }}
          </button>
        </form>
      </article>

      <article class="card resource-card">
        <p class="eyebrow">Adım 2</p>
        <h3 class="section-title">Müşteri Bilgileri</h3>
        <form class="resource-form" @submit.prevent>
          <label> Firma <input v-model="customer.name" :disabled="saving" /> </label>
          <label> Yetkili <input v-model="customer.attention" :disabled="saving" /> </label>
          <label> Adres <textarea v-model="customer.address" rows="3" :disabled="saving" /> </label>
          <label> Telefon <input v-model="customer.tel" :disabled="saving" /> </label>
          <label> E-posta <input v-model="customer.email" type="email" :disabled="saving" /> </label>
          <label> Vergi Dairesi <input v-model="customer.taxOffice" :disabled="saving" /> </label>
        </form>
      </article>
    </div>

    <article class="card resource-card table-card">
      <h3 class="section-title">Önerilen Makineler</h3>
      <div v-if="fetchingMaterials" class="loading-state">
        Malzeme kataloğu yükleniyor...
      </div>
      <div v-else-if="!machineResults.length" class="empty-state">
        Uygun makineleri görmek için öneri çalıştırın.
      </div>
      <table v-else class="resource-table">
        <thead>
          <tr>
            <th>Seç</th>
            <th>Model</th>
            <th>Tonaj</th>
            <th>Boy</th>
            <th>Maks. Kalınlık</th>
            <th>Fiyat</th>
            <th>Neden</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in machineResults" :key="result.machine._id || result.machine.id || result.machine.model">
            <td>
              <input
                :checked="selectedMachineId === (result.machine._id || result.machine.id)"
                type="radio"
                name="machine"
                @change="selectMachine(result.machine)"
              />
            </td>
            <td>{{ result.machine.model }}</td>
            <td>{{ formatNumber(result.machine.maxTonnageTonf) }}</td>
            <td>{{ formatNumber(result.machine.workingLengthMm) }}</td>
            <td>{{ formatNumber(result.machine.maxThicknessMm) }}</td>
            <td>{{ formatCurrency(result.machine.basePriceUSD) }}</td>
            <td>{{ result.reason }}</td>
          </tr>
        </tbody>
      </table>
    </article>

    <article class="card resource-card table-card">
      <h3 class="section-title">Önerilen Takımlar</h3>
      <div v-if="loading && !toolingResults.length" class="loading-state">
        Takım önerileri hazırlanıyor...
      </div>
      <div v-else-if="!toolingResults.length" class="empty-state">
        Takım önerileri makine önerileriyle birlikte görünecek.
      </div>
      <table v-else class="resource-table">
        <thead>
          <tr>
            <th>Seç</th>
            <th>Ad</th>
            <th>V-kalıp</th>
            <th>Punç Yarıçapı</th>
            <th>Kalıp Yarıçapı</th>
            <th>Neden</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in toolingResults" :key="result.tooling._id || result.tooling.id || result.tooling.name">
            <td>
              <input
                :checked="selectedToolingId === (result.tooling._id || result.tooling.id)"
                type="radio"
                name="tooling"
                @change="selectTooling(result.tooling)"
              />
            </td>
            <td>{{ result.tooling.name }}</td>
            <td>{{ formatNumber(result.tooling.vDieMm) }}</td>
            <td>{{ formatNumber(result.tooling.punchRadiusMm) }}</td>
            <td>{{ formatNumber(result.tooling.dieRadiusMm) }}</td>
            <td>{{ result.reason }}</td>
          </tr>
        </tbody>
      </table>
    </article>

    <article class="card resource-card table-card">
      <h3 class="section-title">Mevcut Opsiyonlar</h3>
      <div v-if="loading && !options.length" class="loading-state">
        Teklif opsiyonları yükleniyor...
      </div>
      <div v-else-if="!options.length" class="empty-state">
        Mevcut teklif opsiyonları öneriler yüklendikten sonra burada görünecek.
      </div>
      <table v-else class="resource-table">
        <thead>
          <tr>
            <th>Seç</th>
            <th>Kod</th>
            <th>Ad</th>
            <th>Fiyat</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="option in options" :key="option._id || option.id || option.code">
            <td>
              <input
                :checked="selectedOptionIds.has(option._id || option.id)"
                type="checkbox"
                @change="toggleOption(option)"
              />
            </td>
            <td>{{ option.code }}</td>
            <td>{{ option.name }}</td>
            <td>{{ formatCurrency(option.priceUsd) }}</td>
          </tr>
        </tbody>
      </table>
    </article>

    <article class="card resource-card stack">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Adım 3</p>
          <h3 class="section-title">Teklif Özeti</h3>
        </div>
        <button class="button-primary" :disabled="saving || loading || fetchingMaterials" @click="saveQuote">
          <IconGlyph name="save" />
          {{ saving ? "Kaydediliyor..." : "Teklifi Kaydet" }}
        </button>
      </div>

      <section class="recommendation-sheet">
        <div class="recommendation-sheet-header">
          <div>
            <p class="eyebrow">Mevcut Teklif</p>
            <h4 class="recommendation-sheet-title">{{ selectedMachine?.model || "Makine seçilmedi" }}</h4>
          </div>
          <div class="recommendation-sheet-total">{{ formatCurrency(grandTotal) }}</div>
        </div>

        <dl class="recommendation-facts">
          <div class="recommendation-fact-row">
            <dt>Malzeme</dt>
            <dd>{{ form.materialNameSnapshot || "-" }}</dd>
          </div>
          <div class="recommendation-fact-row">
            <dt>Takım</dt>
            <dd>{{ selectedTooling?.name || "-" }}</dd>
          </div>
          <div class="recommendation-fact-row">
            <dt>Seçilen Opsiyon</dt>
            <dd>{{ selectedOptions.length }}</dd>
          </div>
          <div class="recommendation-fact-row">
            <dt>Opsiyon Toplamı</dt>
            <dd>{{ formatCurrency(optionsTotal) }}</dd>
          </div>
          <div class="recommendation-fact-row">
            <dt>Müşteri Hazır</dt>
            <dd>{{ customerReady ? "Evet" : "Hayır" }}</dd>
          </div>
          <div class="recommendation-fact-row">
            <dt>Teklif Hazır</dt>
            <dd>{{ quoteReady ? "Evet" : "Hayır" }}</dd>
          </div>
        </dl>
      </section>

      <p v-if="error" class="message-error">{{ error }}</p>
      <p v-if="success" class="message-success">{{ success }}</p>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";

import { http } from "../../api/http";
import { listResource } from "../../api/resources";
import IconGlyph from "../../components/shared/IconGlyph.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const materials = ref([]);
const machineResults = ref([]);
const toolingResults = ref([]);
const options = ref([]);
const fetchingMaterials = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");

const form = reactive({
  materialId: "",
  materialNameSnapshot: "",
  thicknessMm: "",
  bendLengthMm: "",
  notes: ""
});

const customer = reactive({
  name: "",
  attention: "",
  address: "",
  tel: "",
  email: "",
  taxOffice: ""
});

const selectedMachine = ref(null);
const selectedTooling = ref(null);
const selectedOptions = ref([]);

const selectedMachineId = computed(() => selectedMachine.value?._id || selectedMachine.value?.id || "");
const selectedToolingId = computed(() => selectedTooling.value?._id || selectedTooling.value?.id || "");
const selectedOptionIds = computed(
  () => new Set(selectedOptions.value.map((option) => option._id || option.id))
);
const optionsTotal = computed(() =>
  selectedOptions.value.reduce((sum, option) => sum + Number(option.priceUsd || 0), 0)
);
const grandTotal = computed(() => Number(selectedMachine.value?.basePriceUSD || 0) + optionsTotal.value);
const customerReady = computed(
  () =>
    Boolean(
      customer.name.trim() &&
        customer.address.trim() &&
        customer.tel.trim() &&
        customer.taxOffice.trim()
    )
);
const recommendationReady = computed(
  () => Boolean(form.materialNameSnapshot && form.thicknessMm && form.bendLengthMm)
);
const quoteReady = computed(() => Boolean(customerReady.value && selectedMachine.value && recommendationReady.value));

function selectMachine(machine) {
  selectedMachine.value = machine;
}

function selectTooling(tooling) {
  selectedTooling.value = tooling;
}

function toggleOption(option) {
  const optionId = option._id || option.id;
  const exists = selectedOptions.value.some((entry) => (entry._id || entry.id) === optionId);

  if (exists) {
    selectedOptions.value = selectedOptions.value.filter(
      (entry) => (entry._id || entry.id) !== optionId
    );
    return;
  }

  selectedOptions.value = [...selectedOptions.value, option];
}

function syncSelectedMaterial() {
  const material = materials.value.find(
    (entry) => entry.name === form.materialNameSnapshot
  );

  form.materialId = material?.id || "";
}

async function loadMaterials() {
  fetchingMaterials.value = true;
  error.value = "";

  try {
    materials.value = await listResource("materials");
    syncSelectedMaterial();
  } catch (err) {
    error.value = getErrorMessage(err, "Malzemeler yüklenemedi");
  } finally {
    fetchingMaterials.value = false;
  }
}

async function runRecommendation() {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const { data } = await http.post("/recommendations", {
      materialId: form.materialId || null,
      materialName: form.materialNameSnapshot,
      thicknessMm: form.thicknessMm,
      bendLengthMm: form.bendLengthMm
    });

    machineResults.value = data.machines || [];
    toolingResults.value = data.toolings || [];
    options.value = data.options || [];

    selectedMachine.value = machineResults.value[0]?.machine || null;
    selectedTooling.value = toolingResults.value[0]?.tooling || null;
    selectedOptions.value = [];
    success.value = "Öneriler yüklendi.";
  } catch (err) {
    error.value = getErrorMessage(err, "Öneriler yüklenemedi");
  } finally {
    loading.value = false;
  }
}

async function saveQuote() {
  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload = {
      customer: { ...customer },
      materialId: form.materialId || null,
      materialNameSnapshot: form.materialNameSnapshot,
      thicknessMm: form.thicknessMm,
      bendLengthMm: form.bendLengthMm,
      machineId: selectedMachine.value?._id || selectedMachine.value?.id || null,
      machineModelSnapshot: selectedMachine.value?.model || "",
      machinePriceUsd: selectedMachine.value?.basePriceUSD || 0,
      toolingId: selectedTooling.value?._id || selectedTooling.value?.id || null,
      toolingNameSnapshot: selectedTooling.value?.name || "",
      selectedOptions: selectedOptions.value.map((option) => ({
        optionId: option._id || option.id || null,
        code: option.code,
        name: option.name,
        priceUsd: option.priceUsd
      })),
      notes: form.notes
    };

    const { data } = await http.post("/quotes", payload);
    success.value = `Teklif kaydedildi. Kod: ${data.item.quoteCode}`;
  } catch (err) {
    error.value = getErrorMessage(err, "Teklif kaydedilemedi");
  } finally {
    saving.value = false;
  }
}

onMounted(loadMaterials);
</script>

<style scoped>
.recommendation-sheet {
  display: grid;
  gap: 12px;
}

.recommendation-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(191, 205, 219, 0.42);
}

.recommendation-sheet-title {
  margin: 4px 0 2px;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.recommendation-sheet-total {
  font-size: 1.15rem;
  font-weight: 500;
  white-space: nowrap;
}

.recommendation-facts {
  margin: 0;
  display: grid;
}

.recommendation-fact-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(191, 205, 219, 0.34);
}

.recommendation-fact-row dt {
  color: var(--ink-soft);
  font-size: 0.95rem;
}

.recommendation-fact-row dd {
  margin: 0;
  color: var(--ink-strong);
  font-size: 0.95rem;
}

@media (max-width: 720px) {
  .recommendation-sheet-header {
    flex-direction: column;
    align-items: start;
  }

  .recommendation-fact-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
