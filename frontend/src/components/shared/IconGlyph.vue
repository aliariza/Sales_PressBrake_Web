<template>
  <svg
    class="button-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(shape, index) in shapes" :key="`${name}-${index}`">
      <path v-if="shape.type === 'path'" :d="shape.d" />
      <circle v-else-if="shape.type === 'circle'" :cx="shape.cx" :cy="shape.cy" :r="shape.r" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: {
    type: String,
    required: true
  }
});

const iconMap = {
  login: [
    { type: "path", d: "M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" },
    { type: "path", d: "M10 17l5-5-5-5" },
    { type: "path", d: "M15 12H4" }
  ],
  logout: [
    { type: "path", d: "M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" },
    { type: "path", d: "M14 7l5 5-5 5" },
    { type: "path", d: "M19 12H8" }
  ],
  refresh: [
    { type: "path", d: "M21 12a9 9 0 1 1-2.64-6.36" },
    { type: "path", d: "M21 3v6h-6" }
  ],
  edit: [
    { type: "path", d: "M12 20h9" },
    { type: "path", d: "M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" }
  ],
  delete: [
    { type: "path", d: "M3 6h18" },
    { type: "path", d: "M8 6V4h8v2" },
    { type: "path", d: "M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" },
    { type: "path", d: "M10 11v6" },
    { type: "path", d: "M14 11v6" }
  ],
  save: [
    { type: "path", d: "M12 3v12" },
    { type: "path", d: "m7 10 5 5 5-5" },
    { type: "path", d: "M5 21h14" }
  ],
  cancel: [
    { type: "path", d: "M18 6 6 18" },
    { type: "path", d: "M6 6l12 12" }
  ],
  view: [
    { type: "path", d: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" },
    { type: "circle", cx: "12", cy: "12", r: "2.8" }
  ],
  pdf: [
    { type: "path", d: "M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" },
    { type: "path", d: "M14 2v5h5" },
    { type: "path", d: "M8 13h2a2 2 0 0 1 0 4H8Z" },
    { type: "path", d: "M13 17v-4h1.5a2 2 0 0 1 0 4Z" },
    { type: "path", d: "M18 13h-2.5V17" }
  ]
};

const shapes = computed(() => iconMap[props.name] || iconMap.view);
</script>
