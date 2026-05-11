import { computed, ref } from "vue";

const isOpen = ref(false);
const title = ref("Onay Gerekli");
const message = ref("");
const confirmText = ref("Onayla");
const cancelText = ref("İptal");
const tone = ref("danger");

let resolver = null;

function closeWith(result) {
  isOpen.value = false;

  if (resolver) {
    resolver(result);
    resolver = null;
  }
}

export function openConfirmDialog(options = {}) {
  title.value = options.title || "Onay Gerekli";
  message.value = options.message || "";
  confirmText.value = options.confirmText || "Onayla";
  cancelText.value = options.cancelText || "İptal";
  tone.value = options.tone || "danger";
  isOpen.value = true;

  return new Promise((resolve) => {
    resolver = resolve;
  });
}

export function useConfirmDialog() {
  return {
    isOpen: computed(() => isOpen.value),
    title: computed(() => title.value),
    message: computed(() => message.value),
    confirmText: computed(() => confirmText.value),
    cancelText: computed(() => cancelText.value),
    tone: computed(() => tone.value),
    confirm: () => closeWith(true),
    cancel: () => closeWith(false)
  };
}
