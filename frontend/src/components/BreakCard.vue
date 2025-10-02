<template>
  <div
    class="break-card"
    :class="{
      'done': breakItem.isDone,
      'disabled': disabled
    }"
  >
    <div class="flex items-center justify-between py-3 px-4">
      <!-- Drag Handle -->
      <div
        class="drag-handle p-2 text-gray-400 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
        @click.stop
        title="Drag to reorder"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z" />
        </svg>
      </div>

      <!-- Break Info -->
      <div class="flex-1 min-w-0 text-center" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'" @click="!disabled && $emit('select', breakItem)">
        <h4 class="text-lg font-medium text-white mb-1">{{ breakItem.name }}</h4>
        <div class="flex items-center justify-center gap-3 text-sm text-gray-400">
          <span class="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">{{ breakItem.type }}</span>
          <span>{{ formatDate(breakItem.createdAt) }}</span>
          <span :class="breakItem.isDone ? 'text-green-400' : 'text-yellow-400'">
            {{ breakItem.isDone ? 'Completed' : 'Pending' }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-1 flex-shrink-0">
        <button
          @click.stop="!disabled && $emit('toggleDone', breakItem)"
          :disabled="disabled"
          :class="[
            'px-2 py-1 text-xs rounded border transition-colors',
            disabled
              ? 'bg-gray-700/30 border-gray-600 text-gray-500 cursor-not-allowed'
              : breakItem.isDone
                ? 'bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30'
                : 'bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30'
          ]"
          :title="disabled ? 'Another performance is selected' : breakItem.isDone ? 'Mark as incomplete' : 'Mark as completed'"
        >
          {{ breakItem.isDone ? '✓' : '○' }}
        </button>

        <button
          @click.stop="!disabled && $emit('delete', breakItem)"
          :disabled="disabled"
          :class="[
            'p-1 rounded transition-colors',
            disabled
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
          ]"
          :title="disabled ? 'Another performance is selected' : 'Delete break'"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Break } from '@/types'

defineProps<{
  breakItem: Break
  disabled?: boolean
}>()

defineEmits<{
  select: [breakItem: Break]
  toggleDone: [breakItem: Break]
  delete: [breakItem: Break]
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
.break-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1));
  border: 1px dashed rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  min-height: 70px;
  backdrop-filter: blur(1px);
}

.break-card:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2));
  border-color: rgba(59, 130, 246, 0.5);
  backdrop-filter: blur(2px);
}

.break-card.done {
  opacity: 0.6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05));
}

.drag-handle {
  cursor: grab !important;
}

.drag-handle:active {
  cursor: grabbing !important;
}

/* Sortable styles for breaks */
.sortable-ghost {
  opacity: 0.4;
}

.sortable-chosen {
  transform: scale(1.02);
}

.sortable-drag {
  transform: rotate(2deg);
}

.break-card.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.break-card.disabled .drag-handle {
  pointer-events: auto;
}
</style>