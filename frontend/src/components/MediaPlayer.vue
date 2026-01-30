<template>
  <div class="media-player">
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-player-accent">Media Player</h3>
        
        <!-- Remote Player Toggle -->
        <button 
            @click="toggleRemote"
            class="p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs font-medium border"
            :class="isRemoteEnabled ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'"
            title="Toggle Remote Player (Docker Node)"
        >
            <span class="w-2 h-2 rounded-full" :class="isRemoteEnabled ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'"></span>
            Remote
        </button>
    </div>

    <!-- Music Visualizer Panel -->
    <div class="visualizer-panel mb-4 bg-gray-800 rounded-lg p-4 border border-gray-600 relative">
      <canvas
        ref="visualizerCanvas"
        class="w-full h-20 rounded"
        :class="{ 'opacity-50': !isPlaying || !currentTrack }"
      ></canvas>
      <div v-if="!isPlaying && currentTrack" class="absolute inset-4 flex items-center justify-center">
        <p class="text-xs text-gray-500">Visualizer will show when playing</p>
      </div>
      <div v-if="!currentTrack" class="absolute inset-4 flex items-center justify-center">
        <p class="text-xs text-gray-500">Load a track to see visualizer</p>
      </div>
    </div>

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
        <span v-if="isRemoteEnabled" class="ml-2 text-xs text-purple-400">• Remote Active</span>
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
      <div v-if="isRemoteEnabled" class="mt-1 flex flex-col items-center">
        <p class="text-purple-400 font-medium">🎵 Dual Streaming Active</p>
        <p v-if="connectedRemoteUrl" class="text-[10px] text-gray-500 truncate max-w-[200px]">
            To: {{ connectedRemoteUrl }}
        </p>
      </div>
      <p v-else class="mt-1 text-green-400">🎵 Local Streaming Only</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useEventStore } from '@/stores/event'

const playerStore = usePlayerStore()
const eventStore = useEventStore()
const visualizerCanvas = ref<HTMLCanvasElement>()

// Simple visualizer variables
let animationFrame: number | null = null
let animationTime = 0
let targetIntensity = 0
let currentIntensity = 0

const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.playState.isPlaying)
const isLoading = computed(() => playerStore.isLoading)
const progress = computed(() => playerStore.progress)
const formattedCurrentTime = computed(() => playerStore.formattedCurrentTime)
const formattedDuration = computed(() => playerStore.formattedDuration)
const formattedLoadProgress = computed(() => playerStore.formattedLoadProgress)
const howlInstance = computed(() => playerStore.howlInstance)
const isRemoteEnabled = computed(() => playerStore.isRemoteEnabled)
const connectedRemoteUrl = computed(() => eventStore.selectedEvent?.remotePlayerUrl)

function toggleRemote() {
    playerStore.toggleRemote()
}

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

// Simple visualizer functions
function initializeVisualizer() {
  if (!visualizerCanvas.value) return

  const canvas = visualizerCanvas.value
  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) return

  // Set canvas size based on container
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

// Simple drawing function
function startVisualizer() {
  drawVisualizer()
}

function stopVisualizer() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

function drawVisualizer() {
  if (!visualizerCanvas.value) return

  const canvas = visualizerCanvas.value
  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) return

  const width = canvas.width / window.devicePixelRatio
  const height = canvas.height / window.devicePixelRatio

  // Clear canvas
  canvasContext.fillStyle = '#1f2937' // bg-gray-800
  canvasContext.fillRect(0, 0, width, height)

  // Only animate when playing
  if (isPlaying.value) {
    animationTime += 0.08

    const barCount = 32
    const barWidth = width / barCount
    const gradient = canvasContext.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, '#10b981') // player-accent (green)
    gradient.addColorStop(0.5, '#34d399') // lighter green
    gradient.addColorStop(1, '#6ee7b7') // lightest green

    for (let i = 0; i < barCount; i++) {
      // Create smooth animated wave pattern
      const frequency1 = i * 0.3 + animationTime
      const frequency2 = i * 0.15 + animationTime * 0.7
      const wave1 = Math.sin(frequency1) * 0.4
      const wave2 = Math.sin(frequency2) * 0.3
      const combined = wave1 + wave2
      const barHeight = (combined * 0.5 + 0.5) * height * 0.7 + height * 0.1

      canvasContext.fillStyle = gradient
      canvasContext.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      )
    }

    // Continue animation only when playing
    animationFrame = requestAnimationFrame(drawVisualizer)
  }
}

// Simple start function - just starts the animation
function simpleStartVisualizer() {
  if (!animationFrame) {
    drawVisualizer()
  }
}

// Simple stop function - completely clear canvas and stop animation
function simpleStopVisualizer() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  // Clear the canvas completely when stopped
  if (visualizerCanvas.value) {
    const canvas = visualizerCanvas.value
    const canvasContext = canvas.getContext('2d')
    if (canvasContext) {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      canvasContext.fillStyle = '#1f2937' // bg-gray-800
      canvasContext.fillRect(0, 0, width, height)
    }
  }
}

// Simple watch for play state changes
watch(isPlaying, (playing) => {
  if (playing) {
    simpleStartVisualizer()
  } else {
    simpleStopVisualizer()
  }
})

// Initialize on mount
onMounted(() => {
  initializeVisualizer()
})

// Cleanup on unmount
onUnmounted(() => {
  simpleStopVisualizer()
})
</script>