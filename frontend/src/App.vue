<template>
  <router-view v-slot="{ Component, route }">
    <Transition name="page-fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </router-view>
  <ConfirmDialog />
</template>

<script setup>
import ConfirmDialog from "./components/shared/ConfirmDialog.vue";
</script>
