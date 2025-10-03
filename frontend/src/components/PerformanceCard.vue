<template>
  <div
    class="performance-card"
    :class="{
      'selected': isSelected,
      'done': performance.isDone,
      'disabled': disabled,
      'break-type': performance.type === 'Break'
    }"
  >
    <!-- Main Performance Card View -->
    <div class="performance-card-content">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <div
            class="drag-handle p-2 text-gray-400 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
            @click.stop
            title="Drag to reorder"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-base font-semibold text-white truncate">{{ performance.name }}</h4>
            <p class="text-sm text-gray-300 truncate">by {{ performance.performer }}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium border"
                :style="getTypeStyle(performance.type)"
              >
                {{ performance.type }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium border"
                :style="getModeStyle(performance.mode)"
              >
                {{ performance.mode }}
              </span>
              <span class="text-xs text-gray-400">
                {{ performance.tracks.length === 0 ? 'No tracks' : `${performance.tracks.length} track${performance.tracks.length !== 1 ? 's' : ''}` }}
              </span>
              <span class="text-xs text-gray-400">
                {{ formatDate(performance.createdAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-1 ml-4">
          <!-- Selection Button -->
          <button
            @click.stop="!disabled && !performance.isDone && $emit('select', performance)"
            :disabled="disabled || performance.isDone"
            :class="[
              'px-3 py-1 text-xs rounded border-2 transition-all font-medium',
              disabled || performance.isDone
                ? 'bg-gray-700/30 border-gray-600 text-gray-500 cursor-not-allowed'
                : isSelected
                  ? 'bg-player-accent/20 border-player-accent text-player-accent hover:bg-player-accent/30 shadow-md'
                  : 'bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30 hover:border-gray-400'
            ]"
            :title="performance.isDone ? 'Completed performances cannot be selected' : disabled ? 'Another performance is selected' : isSelected ? 'Deselect performance' : 'Select performance'"
          >
            {{ isSelected ? 'Selected' : 'Select' }}
          </button>

          <button
            @click.stop="!disabled && $emit('toggleDone', performance)"
            :disabled="disabled"
            :class="[
              'px-2 py-1 text-xs rounded border transition-colors',
              disabled
                ? 'bg-gray-700/30 border-gray-600 text-gray-500 cursor-not-allowed'
                : performance.isDone
                  ? 'bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30'
                  : 'bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30'
            ]"
            :title="disabled ? 'Another performance is selected' : performance.isDone ? 'Mark as incomplete' : 'Mark as completed'"
          >
            {{ performance.isDone ? '✓' : '○' }}
          </button>

          <button
            @click.stop="!disabled && $emit('edit', performance)"
            :disabled="disabled"
            :class="[
              'p-1 rounded transition-colors',
              disabled
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20'
            ]"
            :title="disabled ? 'Another performance is selected' : 'Edit performance'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
            </svg>
          </button>

          <button
            @click.stop="!disabled && $emit('delete', performance)"
            :disabled="disabled"
            :class="[
              'p-1 rounded transition-colors',
              disabled
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
            ]"
            :title="disabled ? 'Another performance is selected' : 'Delete performance'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Expanded Track List (shown when selected) -->
      <div v-if="isSelected && performance.tracks.length > 0" class="mt-4 pt-4 border-t border-gray-600">
        <div class="text-sm text-gray-400 mb-2">Tracks:</div>
        <div class="max-h-40 overflow-y-auto space-y-1">
          <div
            v-for="track in performance.tracks"
            :key="track.id"
            class="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors"
            :class="{ 'opacity-60': track.isCompleted }"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" @click.stop="$emit('trackSelected', track)">
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate" :class="{ 'line-through': track.isCompleted }">{{ track.filename }}</p>
                <p class="text-xs text-gray-400">{{ track.performer }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="$emit('toggleTrackCompletion', track)"
                :class="[
                  'px-2 py-1 text-xs rounded border transition-colors',
                  track.isCompleted
                    ? 'bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30'
                    : 'bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30'
                ]"
                :title="track.isCompleted ? 'Mark as incomplete' : 'Mark as completed'"
              >
                {{ track.isCompleted ? '✓' : '○' }}
              </button>
              <button
                @click.stop="$emit('trackSelected', track)"
                class="p-1 text-player-accent hover:text-green-400 transition-colors"
                title="Play track"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
              </button>
              <button
                @click.stop="$emit('deleteTrack', track)"
                class="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                title="Delete track"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State for selected card with no tracks -->
      <div v-else-if="isSelected && performance.tracks.length === 0" class="mt-4 pt-4 border-t border-gray-600 text-center py-4 text-gray-500 text-sm">
        No tracks added yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Performance, Track } from '@/types'

defineProps<{
  performance: Performance
  isSelected: boolean
  disabled?: boolean
}>()

defineEmits<{
  select: [performance: Performance]
  toggleDone: [performance: Performance]
  edit: [performance: Performance]
  delete: [performance: Performance]
  trackSelected: [track: Track]
  toggleTrackCompletion: [track: Track]
  deleteTrack: [track: Track]
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Color schemes for performance types
function getTypeStyle(type: string): { backgroundColor: string; borderColor: string; color: string } {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    'Song': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(147, 197, 253)' },
    'Dance': { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: 'rgb(249, 168, 212)' },
    'Recitation': { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(216, 180, 254)' },
    'Break': { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(253, 224, 71)' }
  }

  const style = styles[type] || { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)', text: 'rgb(156, 163, 175)' }
  return {
    backgroundColor: style.bg,
    borderColor: style.border,
    color: style.text
  }
}

// Color schemes for performance modes
function getModeStyle(mode: string): { backgroundColor: string; borderColor: string; color: string } {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    'Solo': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: 'rgb(110, 231, 183)' },
    'Duet': { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: 'rgb(251, 191, 36)' },
    'Group': { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: 'rgb(252, 165, 165)' },
    'Lunch': { bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.4)', text: 'rgb(94, 234, 212)' },
    'Dinner': { bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.4)', text: 'rgb(253, 186, 116)' },
    'Broadcast': { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', text: 'rgb(165, 180, 252)' },
    'Announcement': { bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)', text: 'rgb(240, 171, 252)' },
    'Appearence': { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: 'rgb(125, 211, 252)' },
    'Special Show': { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)', text: 'rgb(253, 186, 116)' }
  }

  const style = styles[mode] || { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)', text: 'rgb(156, 163, 175)' }
  return {
    backgroundColor: style.bg,
    borderColor: style.border,
    color: style.text
  }
}
</script>

<style scoped>
.performance-card.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.performance-card.disabled .drag-handle {
  pointer-events: auto;
}

.performance-card.break-type {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1));
  border: 1px dashed rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(1px);
}

.performance-card.break-type:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2));
  border-color: rgba(59, 130, 246, 0.5);
  backdrop-filter: blur(2px);
}

.performance-card.break-type.done {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05));
}
</style>