<template>
  <div class="bg-card-bg border border-gray-600 rounded-lg p-6">
    <h3 class="text-lg font-semibold mb-4">Performance Info</h3>

    <div v-if="selectedPerformance" class="space-y-3">
      <div>
        <label class="text-sm text-gray-400">Performance:</label>
        <p class="text-white font-medium">{{ selectedPerformance.name }}</p>
      </div>

      <div v-if="currentTrack">
        <label class="text-sm text-gray-400">Current Track:</label>
        <p class="text-white font-medium">{{ currentTrack.filename }}</p>
      </div>

      <div v-if="currentTrack">
        <label class="text-sm text-gray-400">Performer:</label>
        <p class="text-white font-medium">{{ currentTrack.performer }}</p>
      </div>

      <div v-if="formattedDuration">
        <label class="text-sm text-gray-400">Duration:</label>
        <p class="text-white font-medium">{{ formattedDuration }}</p>
      </div>

      <div>
        <label class="text-sm text-gray-400">Type:</label>
        <p class="text-white font-medium">
          {{ selectedPerformance.isDone ? 'Completed' : 'Active' }}
        </p>
      </div>

      <div>
        <label class="text-sm text-gray-400">Tracks:</label>
        <p class="text-white font-medium">{{ selectedPerformance.tracks.length }}</p>
      </div>
    </div>

    <div v-else class="text-gray-500 text-center py-8">
      <p>Select a performance to view details</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePerformanceStore } from '@/stores/performance'
import { usePlayerStore } from '@/stores/player'

const performanceStore = usePerformanceStore()
const playerStore = usePlayerStore()

const selectedPerformance = computed(() => performanceStore.selectedPerformance)
const currentTrack = computed(() => playerStore.currentTrack)
const formattedDuration = computed(() => playerStore.formattedDuration)
</script>