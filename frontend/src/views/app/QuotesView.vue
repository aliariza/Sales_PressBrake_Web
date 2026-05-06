<template>
  <section class="resource-shell">
    <PageIntro title="Teklifler" description="Teklifleri görüntüleyin, inceleyin, silin ve dışa aktarın." />

    <div class="quotes-layout">
      <article class="card resource-card table-card quotes-list-card">
        <div class="toolbar">
          <h3 class="section-title">Kayıtlı Teklifler</h3>
          <button
            class="button-secondary icon-only-button"
            :disabled="loadingList"
            @click="loadQuotes"
            aria-label="Teklifleri yenile"
            title="Teklifleri yenile"
          >
            <IconGlyph name="refresh" />
          </button>
        </div>

        <div v-if="loadingList && !quotes.length" class="loading-state">
          Teklifler yükleniyor...
        </div>
        <div v-else-if="!quotes.length" class="empty-state">
          Henüz teklif yok. Öneri sayfasından bir teklif kaydedin; burada görünecektir.
        </div>
        <table v-else class="resource-table">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Malzeme</th>
              <th>Makine</th>
              <th>Toplam</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quote in quotes" :key="quote.id">
              <td>{{ quote.quoteCode }}</td>
              <td>{{ quote.materialNameSnapshot }}</td>
              <td>{{ quote.machineModelSnapshot }}</td>
              <td>{{ formatCurrency(quote.grandTotalUsd) }}</td>
              <td>{{ formatDate(quote.createdAt) }}</td>
              <td class="resource-actions">
                <button
                  class="button-secondary icon-only-button"
                  :disabled="loadingDetail || deletingId === quote.id || downloadingId === quote.id"
                  @click="showQuote(quote)"
                  aria-label="Teklifi görüntüle"
                  title="Teklifi görüntüle"
                >
                  <IconGlyph name="view" />
                </button>
                <button
                  class="button-secondary icon-only-button"
                  :disabled="downloadingId === quote.id || deletingId === quote.id"
                  @click="editQuote(quote)"
                  aria-label="Teklifi düzenle"
                  title="Teklifi düzenle"
                >
                  <IconGlyph name="edit" />
                </button>
                <button
                  class="button-secondary icon-only-button"
                  :disabled="downloadingId === quote.id || deletingId === quote.id"
                  @click="downloadQuotePdf(quote)"
                  aria-label="PDF indir"
                  title="PDF indir"
                >
                  <IconGlyph name="pdf" />
                </button>
                <button
                  v-if="canDeleteQuotes"
                  class="button-danger icon-only-button"
                  :disabled="deletingId === quote.id"
                  @click="removeQuote(quote)"
                  aria-label="Teklifi sil"
                  title="Teklifi sil"
                >
                  <IconGlyph name="delete" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="card resource-card stack quotes-detail-card">
        <h3 class="section-title">Teklif Detayları</h3>

        <div v-if="loadingDetail" class="loading-state">
          Teklif detayları yükleniyor...
        </div>

        <template v-else-if="selectedQuote">
          <section class="quote-detail-section">
            <div class="quote-sheet-header">
              <div>
                <p class="eyebrow">Teklif</p>
                <h4 class="quote-sheet-title">{{ selectedQuote.quoteCode }}</h4>
                <p class="quote-sheet-subtitle">{{ selectedQuote.customer.name }}</p>
              </div>
              <div class="quote-sheet-total">{{ formatCurrency(selectedQuote.grandTotalUsd) }}</div>
            </div>

            <dl class="quote-facts">
              <div class="quote-fact-row">
                <dt>Malzeme</dt>
                <dd>{{ selectedQuote.materialNameSnapshot }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Kalınlık</dt>
                <dd>{{ formatNumber(selectedQuote.thicknessMm, " mm") }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Büküm Boyu</dt>
                <dd>{{ formatNumber(selectedQuote.bendLengthMm, " mm") }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Makine</dt>
                <dd>{{ selectedQuote.machineModelSnapshot }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Takım</dt>
                <dd>{{ selectedQuote.toolingNameSnapshot || "-" }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Makine Fiyatı</dt>
                <dd>{{ formatCurrency(selectedQuote.machinePriceUsd) }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Opsiyon Toplamı</dt>
                <dd>{{ formatCurrency(selectedQuote.optionsTotalUsd) }}</dd>
              </div>
              <div class="quote-fact-row">
                <dt>Oluşturulma</dt>
                <dd>{{ formatDate(selectedQuote.createdAt) }}</dd>
              </div>
            </dl>
          </section>

          <section class="quote-detail-section">
            <h4 class="section-title quote-subsection-title">Notlar</h4>
            <div class="quote-note">
              {{ selectedQuote.notes || "Ek not bulunmuyor." }}
            </div>
          </section>

          <section class="quote-detail-section">
            <h4 class="section-title quote-subsection-title">Seçilen Opsiyonlar</h4>

            <div v-if="selectedQuote.selectedOptions.length" class="quote-option-list">
              <div
                v-for="option in selectedQuote.selectedOptions"
                :key="`${option.code}-${option.name}`"
                class="quote-option-row"
              >
                <span class="quote-option-code">{{ option.code }}</span>
                <span class="quote-option-name">{{ option.name }}</span>
                <span class="quote-option-price">{{ formatCurrency(option.priceUsd) }}</span>
              </div>
            </div>
            <div v-else class="empty-state">
              Bu teklif için ek opsiyon seçilmedi.
            </div>
          </section>
        </template>

        <div v-else class="empty-state">
          Detaylarını görmek için bir teklif seçin.
        </div>

        <p v-if="error" class="message-error">{{ error }}</p>
        <p v-if="success" class="message-success">{{ success }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { http } from "../../api/http";
import { listResource } from "../../api/resources";
import IconGlyph from "../../components/shared/IconGlyph.vue";
import PageIntro from "../../components/shared/PageIntro.vue";
import { useAuthStore } from "../../stores/auth";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const auth = useAuthStore();
const router = useRouter();
const quotes = ref([]);
const selectedQuote = ref(null);
const loadingList = ref(false);
const loadingDetail = ref(false);
const activeQuoteId = ref("");
const deletingId = ref("");
const downloadingId = ref("");
const error = ref("");
const success = ref("");
const canDeleteQuotes = computed(() => auth.user?.role === "admin");

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

async function loadQuotes() {
  loadingList.value = true;

  try {
    quotes.value = await listResource("quotes");
  } catch (err) {
    error.value = getErrorMessage(err, "Teklifler yüklenemedi");
  } finally {
    loadingList.value = false;
  }
}

async function showQuote(quote) {
  try {
    loadingDetail.value = true;
    activeQuoteId.value = quote.id;
    const { data } = await http.get(`/quotes/${quote.id}`);
    selectedQuote.value = data.item;
    error.value = "";
  } catch (err) {
    error.value = getErrorMessage(err, "Teklif yüklenemedi");
  } finally {
    loadingDetail.value = false;
  }
}

async function removeQuote(quote) {
  if (!window.confirm(`${quote.quoteCode} kodlu teklif silinsin mi?`)) {
    return;
  }

  try {
    deletingId.value = quote.id;
    await http.delete(`/quotes/${quote.id}`);
    if (selectedQuote.value?.id === quote.id) {
      selectedQuote.value = null;
    }
    success.value = "Teklif silindi.";
    error.value = "";
    await loadQuotes();
  } catch (err) {
    error.value = getErrorMessage(err, "Teklif silinemedi");
  } finally {
    deletingId.value = "";
  }
}

function editQuote(quote) {
  router.push({
    path: "/app/recommendation",
    query: { edit: quote.id }
  });
}

async function downloadQuotePdf(quote) {
  try {
    downloadingId.value = quote.id;
    error.value = "";
    const response = await http.get(`/quotes/${quote.id}/pdf`, {
      responseType: "blob"
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quote.quoteCode}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    success.value = `${quote.quoteCode} için PDF indirildi.`;
  } catch (err) {
    error.value = getErrorMessage(err, "PDF dışa aktarılamadı");
  } finally {
    downloadingId.value = "";
  }
}

onMounted(loadQuotes);
</script>

<style scoped>
.quotes-layout {
  display: grid;
  gap: 20px;
}

.quotes-list-card {
  min-height: 360px;
}

.quotes-detail-card {
  min-height: 280px;
}

.quote-detail-section {
  display: grid;
  gap: 12px;
  padding-top: 2px;
}

.quote-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(191, 205, 219, 0.42);
}

.quote-sheet-title {
  margin: 4px 0 2px;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.quote-sheet-subtitle {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.96rem;
}

.quote-sheet-total {
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.quote-facts {
  margin: 0;
  display: grid;
}

.quote-fact-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(191, 205, 219, 0.34);
}

.quote-fact-row dt {
  color: var(--ink-soft);
  font-size: 0.96rem;
}

.quote-fact-row dd {
  margin: 0;
  color: var(--ink-strong);
  font-size: 0.96rem;
}

.quote-subsection-title {
  margin-bottom: 0;
}

.quote-note {
  padding: 0 0 12px;
  color: var(--ink-strong);
  line-height: 1.6;
  border-bottom: 1px solid rgba(191, 205, 219, 0.38);
}

.quote-option-list {
  display: grid;
  gap: 0;
}

.quote-option-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(191, 205, 219, 0.38);
}

.quote-option-code {
  color: var(--ink-soft);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.quote-option-name {
  color: var(--ink-strong);
  font-weight: 500;
}

.quote-option-price {
  color: var(--ink-strong);
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .quote-sheet-header {
    align-items: start;
    flex-direction: column;
  }

  .quote-fact-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .quote-option-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
