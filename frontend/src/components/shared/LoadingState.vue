<template>
  <div class="loading-state" role="status" :aria-label="label">
    <span class="loading-spinner" aria-hidden="true" />
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: "Yükleniyor"
  }
});
</script>
