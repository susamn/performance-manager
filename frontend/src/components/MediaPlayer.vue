<template>
  <div class="media-player">
    <h3 class="text-lg font-semibold mb-4 text-player-accent">Media Player</h3>

    <!-- Track Display -->
    <div v-if="currentTrack" class="mb-4">
      <p class="text-sm text-gray-400">Now Playing:</p>
      <p class="text-white font-medium truncate">{{ currentTrack.filename }}</p>
      <p class="text-sm text-gray-400">{{ currentTrack.performer }}</p>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="mt-2 flex items-center gap-2">
        <div class="w-4 h-4 border-2 border-player-accent border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs text-gray-400">Preparing stream... {{ formattedLoadProgress }}</span>
      </div>
      <div v-else class="mt-1">
        <span class="text-xs text-green-400">✓ Ready to stream</span>
      </div>
    </div>

    <!-- Seekbar -->
    <div class="mb-4">
      <div class="relative h-2 bg-gray-600 rounded-full cursor-pointer" @click="handleSeekClick">
        <div
          class="absolute top-0 left-0 h-2 bg-player-accent rounded-full transition-all"
          :style="{ width: `${progress}%` }"
        ></div>
        <div
          class="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-player-accent rounded-full border-2 border-player-bg transition-all"
          :style="{ left: `calc(${progress}% - 8px)` }"
        ></div>
      </div>

      <!-- Time Display -->
      <div class="flex justify-between text-sm text-gray-400 mt-2">
        <span>{{ formattedCurrentTime }}</span>
        <span>{{ formattedDuration }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center space-x-4">
      <button
        @click="rewind"
        class="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
        :disabled="!currentTrack || isLoading"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z" />
        </svg>
      </button>

      <button
        @click="togglePlayPause"
        class="p-3 bg-player-accent hover:bg-green-400 text-black rounded-full transition-colors"
        :disabled="!currentTrack || isLoading"
      >
        <svg v-if="!isPlaying" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
        </svg>
        <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
        </svg>
      </button>

      <button
        @click="stop"
        class="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
        :disabled="!currentTrack || isLoading"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18,18H6V6H18V18Z" />
        </svg>
      </button>
    </div>

    <!-- Instructions -->
    <div class="mt-4 text-xs text-gray-500 text-center">
      <p>Space: Play/Pause • Space x2: Stop & Reset</p>
      <p class="mt-1 text-green-400">🎵 Streaming enabled - No full downloads!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()

const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.playState.isPlaying)
const isLoading = computed(() => playerStore.isLoading)
const progress = computed(() => playerStore.progress)
const formattedCurrentTime = computed(() => playerStore.formattedCurrentTime)
const formattedDuration = computed(() => playerStore.formattedDuration)
const formattedLoadProgress = computed(() => playerStore.formattedLoadProgress)

function togglePlayPause() {
  playerStore.togglePlayPause()
}

function stop() {
  playerStore.stop()
}

function rewind() {
  playerStore.rewind()
}

function handleSeekClick(event: MouseEvent) {
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  playerStore.seek(Math.max(0, Math.min(100, percentage)))
}
</script>