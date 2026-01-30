<template>
  <div
    class="event-card"
    @click="$emit('select', event)"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-white truncate">{{ event.name }}</h3>
      <div class="flex items-center space-x-1">
        <button
          @click.stop="$emit('download', event)"
          class="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
          title="Download PDF"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('edit', event)"
          class="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded transition-colors"
          title="Edit Event"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('delete', event)"
          class="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
          title="Delete Event"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
          </svg>
        </button>
      </div>
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
  edit: [event: Event]
  delete: [event: Event]
  download: [event: Event]
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