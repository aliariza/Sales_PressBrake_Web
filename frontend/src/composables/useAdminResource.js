import { computed, onMounted, reactive, ref } from "vue";

import { createResource, deleteResource, listResource, updateResource } from "../api/resources";
import { getErrorMessage } from "../utils/errors";

export function useAdminResource(config) {
  const {
    resourceName,
    createInitialForm,
    messages,
    mapToForm = (item) => ({ ...item }),
    mapToPayload = (form) => ({ ...form }),
    getDeleteLabel = (item) => item?.name || item?.code || item?.model || item?.username || "Kayıt"
  } = config;

  const items = ref([]);
  const loading = ref(false);
  const fetching = ref(false);
  const error = ref("");
  const success = ref("");
  const form = reactive(createInitialForm());
  const initialLoading = computed(() => fetching.value && !items.value.length);

  function resetForm() {
    Object.assign(form, createInitialForm());
  }

  function clearMessages() {
    error.value = "";
    success.value = "";
  }

  function startEdit(item) {
    Object.assign(form, createInitialForm(), mapToForm(item));
    clearMessages();
  }

  async function loadItems() {
    fetching.value = true;

    try {
      items.value = await listResource(resourceName);
    } catch (err) {
      error.value = getErrorMessage(err, messages.loadError);
    } finally {
      fetching.value = false;
    }
  }

  async function saveItem() {
    loading.value = true;
    clearMessages();

    try {
      const payload = mapToPayload(form);

      if (form.id) {
        await updateResource(resourceName, form.id, payload);
        success.value = messages.updateSuccess;
      } else {
        await createResource(resourceName, payload);
        success.value = messages.createSuccess;
      }

      resetForm();
      await loadItems();
    } catch (err) {
      error.value = getErrorMessage(err, messages.saveError);
    } finally {
      loading.value = false;
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`${getDeleteLabel(item)} silinsin mi?`)) {
      return;
    }

    try {
      await deleteResource(resourceName, item.id);
      if (form.id === item.id) {
        resetForm();
      }
      success.value = messages.deleteSuccess;
      error.value = "";
      await loadItems();
    } catch (err) {
      error.value = getErrorMessage(err, messages.deleteError);
    }
  }

  onMounted(loadItems);

  return {
    items,
    form,
    loading,
    fetching,
    initialLoading,
    error,
    success,
    resetForm,
    startEdit,
    loadItems,
    saveItem,
    removeItem
  };
}
