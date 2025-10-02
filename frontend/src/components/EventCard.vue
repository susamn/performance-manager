<template>
  <div
    class="event-card"
    @click="$emit('select', event)"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-white truncate">{{ event.name }}</h3>
      <button
        @click.stop="$emit('delete', event)"
        class="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>
      </button>
    </div>

    <div v-if="event.description" class="text-sm text-gray-300 mb-3">
      {{ event.description }}
    </div>

    <div class="flex items-center justify-between text-xs text-gray-400">
      <span>{{ performanceCount }} performance{{ performanceCount !== 1 ? 's' : '' }}</span>
      <span>{{ formatDate(event.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/types'

defineProps<{
  event: Event
  performanceCount: number
}>()

defineEmits<{
  select: [event: Event]
  delete: [event: Event]
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.event-card {
  @apply bg-card-bg border border-gray-600 rounded-lg p-4 cursor-pointer transition-all hover:bg-card-selected hover:border-player-accent;
}
</style>