<template>
  <section class="resource-shell">
    <PageIntro
      title="Öneri"
      description="Bilgileri girin, önerileri alın ve teklif oluşturun."
    />

    <LoadingState v-if="initialLoading" class="page-loading-state" label="Form verileri yükleniyor" />

    <div class="resource-grid">
      <article class="card resource-card">
        <p class="eyebrow">Adım 1</p>
        <h3 class="section-title">Girdiler</h3>
        <form class="resource-form" @submit.prevent="runRecommendation">
          <label>
            Belge Türü
            <select v-model="form.documentType" :disabled="saving" @change="handleDocumentTypeChange">
              <option value="quote">Standart Teklif</option>
              <option value="service_proforma">Servis Proforma Fatura</option>
            </select>
          </label>

          <template v-if="!isServiceProforma">
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
          </template>

          <template v-else>
            <label>
              Yapılacak İş
              <textarea v-model="form.serviceDescription" rows="5" :disabled="saving" />
            </label>

            <label>
              Tutar TL
              <input v-model.number="form.serviceAmount" type="number" step="any" min="0" :disabled="saving" />
            </label>
          </template>

          <label>
            Notlar
            <textarea v-model="form.notes" rows="4" :disabled="loading || saving" />
          </label>

          <label>
            Diğer Şartlar
            <textarea v-model="form.otherTerms" rows="5" :disabled="loading || saving" />
          </label>

          <label v-if="isServiceProforma">
            Banka Detayları
            <textarea v-model="form.bankDetails" rows="5" :disabled="loading || saving" />
          </label>

          <button
            v-if="!isServiceProforma"
            class="button-primary"
            :disabled="loading || fetchingMaterials"
            aria-label="Öneri getir"
            title="Öneri getir"
          >
            <IconGlyph name="refresh" />
            {{ loading ? "Hesaplanıyor..." : "Öneri Getir" }}
          </button>

          <p v-else class="empty-state">
            Servis proforma faturada öneri hesabı yerine doğrudan iş açıklaması ve TL tutarı kullanılır.
          </p>
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

    <article v-if="!isServiceProforma" class="card resource-card table-card">
      <h3 class="section-title">Önerilen Makineler</h3>
      <LoadingState v-if="fetchingMaterials" label="Malzeme kataloğu yükleniyor" />
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

    <article v-if="!isServiceProforma" class="card resource-card table-card">
      <h3 class="section-title">Önerilen Takımlar</h3>
      <LoadingState v-if="loading && !toolingResults.length" label="Takım önerileri hazırlanıyor" />
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

    <article v-if="!isServiceProforma" class="card resource-card table-card">
      <h3 class="section-title">Mevcut Opsiyonlar</h3>
      <LoadingState v-if="loading && !options.length" label="Teklif opsiyonları yükleniyor" />
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
        <button
          class="button-primary"
          :disabled="saving || loading || fetchingMaterials"
          @click="saveQuote"
          aria-label="Teklifi kaydet"
          title="Teklifi kaydet"
        >
          <IconGlyph name="save" />
          {{ saving ? "Kaydediliyor..." : "Teklifi Kaydet" }}
        </button>
      </div>

      <section class="recommendation-sheet">
        <div class="recommendation-sheet-header">
          <div>
            <p class="eyebrow">{{ isServiceProforma ? "Servis Proforma" : "Mevcut Teklif" }}</p>
            <h4 class="recommendation-sheet-title">
              {{ isServiceProforma ? serviceSummaryTitle : (selectedMachine?.model || "Makine seçilmedi") }}
            </h4>
          </div>
          <div class="recommendation-sheet-total">{{ formatCurrency(grandTotal, displayCurrencyCode) }}</div>
        </div>

        <dl class="recommendation-facts">
          <div class="recommendation-fact-row">
            <dt>Belge Türü</dt>
            <dd>{{ isServiceProforma ? "Servis Proforma Fatura" : "Standart Teklif" }}</dd>
          </div>
          <div v-if="!isServiceProforma" class="recommendation-fact-row">
            <dt>Malzeme</dt>
            <dd>{{ form.materialNameSnapshot || "-" }}</dd>
          </div>
          <div v-if="!isServiceProforma" class="recommendation-fact-row">
            <dt>Takım</dt>
            <dd>{{ selectedTooling?.name || "-" }}</dd>
          </div>
          <div v-if="!isServiceProforma" class="recommendation-fact-row">
            <dt>Seçilen Opsiyon</dt>
            <dd>{{ selectedOptions.length }}</dd>
          </div>
          <div v-if="!isServiceProforma" class="recommendation-fact-row">
            <dt>Opsiyon Toplamı</dt>
            <dd>{{ formatCurrency(optionsTotal, displayCurrencyCode) }}</dd>
          </div>
          <div v-if="isServiceProforma" class="recommendation-fact-row">
            <dt>Yapılacak İş</dt>
            <dd>{{ form.serviceDescription || "-" }}</dd>
          </div>
          <div v-if="isServiceProforma" class="recommendation-fact-row">
            <dt>Para Birimi</dt>
            <dd>TL</dd>
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
import { useRoute, useRouter } from "vue-router";

import { http } from "../../api/http";
import { listResource } from "../../api/resources";
import IconGlyph from "../../components/shared/IconGlyph.vue";
import LoadingState from "../../components/shared/LoadingState.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const materials = ref([]);
const machineResults = ref([]);
const toolingResults = ref([]);
const options = ref([]);
const editingQuoteId = ref("");
const fetchingMaterials = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const route = useRoute();
const router = useRouter();

const form = reactive({
  documentType: "quote",
  materialId: "",
  materialNameSnapshot: "",
  thicknessMm: "",
  bendLengthMm: "",
  notes: "",
  otherTerms: "",
  bankDetails: "",
  serviceDescription: "",
  serviceAmount: ""
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
const isServiceProforma = computed(() => form.documentType === "service_proforma");
const selectedOptionIds = computed(
  () => new Set(selectedOptions.value.map((option) => option._id || option.id))
);
const optionsTotal = computed(() =>
  selectedOptions.value.reduce((sum, option) => sum + Number(option.priceUsd || 0), 0)
);
const grandTotal = computed(() =>
  isServiceProforma.value
    ? Number(form.serviceAmount || 0)
    : Number(selectedMachine.value?.basePriceUSD || 0) + optionsTotal.value
);
const displayCurrencyCode = computed(() => (isServiceProforma.value ? "TRY" : "USD"));
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
  () =>
    isServiceProforma.value
      ? Boolean(form.serviceDescription.trim() && Number(form.serviceAmount) > 0)
      : Boolean(form.materialNameSnapshot && form.thicknessMm && form.bendLengthMm)
);
const quoteReady = computed(() =>
  isServiceProforma.value
    ? Boolean(customerReady.value && recommendationReady.value)
    : Boolean(customerReady.value && selectedMachine.value && recommendationReady.value)
);
const isEditing = computed(() => Boolean(editingQuoteId.value));
const initialLoading = computed(() => fetchingMaterials.value && !materials.value.length);
const serviceSummaryTitle = computed(() => {
  const value = form.serviceDescription.trim();
  return value ? value.slice(0, 80) : "Servis işi girilmedi";
});

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getUuidOrNull(...values) {
  for (const value of values) {
    if (isUuid(value)) {
      return value;
    }
  }

  return null;
}

function applyQuoteToForm(quote) {
  editingQuoteId.value = quote.id;
  form.documentType = quote.documentType || "quote";
  form.materialId = quote.materialId || "";
  form.materialNameSnapshot = quote.materialNameSnapshot || "";
  form.thicknessMm = quote.thicknessMm || "";
  form.bendLengthMm = quote.bendLengthMm || "";
  form.notes = quote.notes || "";
  form.otherTerms = quote.otherTerms || "";
  form.bankDetails = quote.bankDetails || DEFAULT_BANK_DETAILS;
  form.serviceDescription = quote.serviceDescription || "";
  form.serviceAmount = quote.documentType === "service_proforma" ? quote.grandTotalUsd || "" : "";

  customer.name = quote.customer?.name || "";
  customer.attention = quote.customer?.attention || "";
  customer.address = quote.customer?.address || "";
  customer.tel = quote.customer?.tel || "";
  customer.email = quote.customer?.email || "";
  customer.taxOffice = quote.customer?.taxOffice || "";

  selectedMachine.value = quote.documentType === "service_proforma"
    ? null
    : {
        id: quote.machineId || null,
        model: quote.machineModelSnapshot || "",
        basePriceUSD: quote.machinePriceUsd || 0
      };

  selectedTooling.value = quote.documentType === "service_proforma"
    ? null
    : quote.toolingNameSnapshot
      ? {
          id: quote.toolingId || null,
          name: quote.toolingNameSnapshot
        }
      : null;

  selectedOptions.value = quote.documentType === "service_proforma"
    ? []
    : (quote.selectedOptions || []).map((option) => ({
        id: option.optionId || null,
        code: option.code,
        name: option.name,
        priceUsd: option.priceUsd
      }));
}

function restoreSelections(previousMachine, previousTooling, previousOptions) {
  if (previousMachine) {
    const matchedMachine = machineResults.value.find(({ machine }) => {
      const candidateId = machine._id || machine.id || null;
      return (previousMachine.id && candidateId === previousMachine.id) || machine.model === previousMachine.model;
    });
    selectedMachine.value = matchedMachine?.machine || previousMachine;
  }

  if (previousTooling) {
    const matchedTooling = toolingResults.value.find(({ tooling }) => {
      const candidateId = tooling._id || tooling.id || null;
      return (previousTooling.id && candidateId === previousTooling.id) || tooling.name === previousTooling.name;
    });
    selectedTooling.value = matchedTooling?.tooling || previousTooling;
  }

  if (previousOptions.length) {
    const selectedCodes = new Set(previousOptions.map((option) => option.code));
    selectedOptions.value = options.value.filter((option) => selectedCodes.has(option.code));
  }
}

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

function handleDocumentTypeChange() {
  error.value = "";
  success.value = "";

  if (isServiceProforma.value) {
    machineResults.value = [];
    toolingResults.value = [];
    options.value = [];
    selectedMachine.value = null;
    selectedTooling.value = null;
    selectedOptions.value = [];
    form.materialId = "";
    form.materialNameSnapshot = "";
    form.thicknessMm = "";
    form.bendLengthMm = "";
    form.bankDetails = form.bankDetails.trim() || DEFAULT_BANK_DETAILS;
    return;
  }

  form.serviceDescription = "";
  form.serviceAmount = "";
  form.bankDetails = "";
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

async function loadQuoteForEditing(id) {
  try {
    loading.value = true;
    error.value = "";
    const { data } = await http.get(`/quotes/${id}`);
    applyQuoteToForm(data.item);
    if (!isServiceProforma.value) {
      await runRecommendation({ preserveSelections: true, suppressSuccess: true });
    }
  } catch (err) {
    error.value = getErrorMessage(err, "Teklif düzenleme için yüklenemedi");
  } finally {
    loading.value = false;
  }
}

async function runRecommendation(config = {}) {
  if (isServiceProforma.value) {
    return;
  }

  const { preserveSelections = false, suppressSuccess = false } = config;
  const previousMachine = preserveSelections ? selectedMachine.value : null;
  const previousTooling = preserveSelections ? selectedTooling.value : null;
  const previousOptions = preserveSelections ? [...selectedOptions.value] : [];

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

    if (preserveSelections) {
      restoreSelections(previousMachine, previousTooling, previousOptions);
    } else {
      selectedMachine.value = machineResults.value[0]?.machine || null;
      selectedTooling.value = toolingResults.value[0]?.tooling || null;
      selectedOptions.value = [];
    }

    if (!suppressSuccess) {
      success.value = "Öneriler yüklendi.";
    }
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
      documentType: form.documentType,
      materialId: getUuidOrNull(form.materialId),
      materialNameSnapshot: form.materialNameSnapshot,
      thicknessMm: form.thicknessMm,
      bendLengthMm: form.bendLengthMm,
      machineId: getUuidOrNull(selectedMachine.value?._id, selectedMachine.value?.id),
      machineModelSnapshot: selectedMachine.value?.model || "",
      serviceDescription: form.serviceDescription,
      serviceAmount: form.serviceAmount,
      machinePriceUsd: selectedMachine.value?.basePriceUSD || 0,
      toolingId: getUuidOrNull(selectedTooling.value?._id, selectedTooling.value?.id),
      toolingNameSnapshot: selectedTooling.value?.name || "",
      selectedOptions: selectedOptions.value.map((option) => ({
        optionId: getUuidOrNull(option._id, option.id),
        code: option.code,
        name: option.name,
        priceUsd: option.priceUsd
      })),
      notes: form.notes,
      otherTerms: form.otherTerms,
      bankDetails: form.bankDetails
    };

    const { data } = isEditing.value
      ? await http.patch(`/quotes/${editingQuoteId.value}`, payload)
      : await http.post("/quotes", payload);
    success.value = isEditing.value
      ? `Teklif güncellendi. Kod: ${data.item.quoteCode}`
      : `Teklif kaydedildi. Kod: ${data.item.quoteCode}`;

    if (isEditing.value) {
      router.push("/app/quotes");
    }
  } catch (err) {
    error.value = getErrorMessage(err, "Teklif kaydedilemedi");
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  form.bankDetails = DEFAULT_BANK_DETAILS;
  await loadMaterials();

  if (typeof route.query.edit === "string" && route.query.edit) {
    await loadQuoteForEditing(route.query.edit);
  }
});

const DEFAULT_BANK_DETAILS = [
  "Tumex Mümessillik ve Dış Ticaret Ltd. Şti.",
  "GARANTİ BBVA",
  "IBAN: TR28 0006 2001 1820 0006 2974 64"
].join("\n");
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
