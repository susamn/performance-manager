<template>
  <div id="app" class="min-h-screen">
    <RouterView />
    <ModalDialog />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ModalDialog from '@/components/ModalDialog.vue'
</script>