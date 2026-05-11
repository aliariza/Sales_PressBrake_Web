<template>
  <Teleport to="body">
    <div v-if="isOpen" class="confirm-overlay" @click.self="cancel">
      <div
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>

        <div class="confirm-actions">
          <button class="button-secondary" type="button" @click="cancel">
            {{ cancelText }}
          </button>
          <button
            :class="tone === 'danger' ? 'button-danger' : 'button-primary'"
            type="button"
            @click="confirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";

import { useConfirmDialog } from "../../composables/useConfirmDialog";

const {
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  tone,
  confirm,
  cancel
} = useConfirmDialog();

function handleKeydown(event) {
  if (!isOpen.value) {
    return;
  }

  if (event.key === "Escape") {
    cancel();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 12, 20, 0.58);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 1000;
}

.confirm-dialog {
  width: min(460px, 100%);
  padding: 24px;
  border: 1px solid var(--card-border);
  background: var(--surface-card);
  box-shadow: var(--card-shadow-strong);
}

.confirm-title {
  margin: 0 0 10px;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ink-strong);
}

.confirm-message {
  margin: 0;
  color: var(--ink-soft);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: end;
  gap: 12px;
  margin-top: 22px;
}
</style>
