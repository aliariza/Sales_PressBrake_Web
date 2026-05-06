<template>
  <div class="page-intro">
    <h1 class="page-intro-title">{{ title }}</h1>
    <p class="page-intro-description">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true }
});
</script>

<style scoped>
.page-intro {
  display: grid;
  gap: 10px;
  padding: 8px 0 2px;
}

.page-intro-title {
  margin: 0;
  font-size: clamp(2.1rem, 3vw, 3rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
  font-weight: 700;
  color: var(--ink-strong);
}

.page-intro-description {
  margin: 0;
  max-width: 60ch;
  color: var(--ink-soft);
  font-size: 1.03rem;
  line-height: 1.7;
}
</style>
