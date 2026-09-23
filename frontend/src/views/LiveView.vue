<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-8">
    
    <!-- No Event State -->
    <div v-if="!activeEventId" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 mb-6 text-gray-700 animate-pulse">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" /></svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-400 mb-2">No Event Active</h1>
      <p class="text-gray-500">Waiting for the coordinator to start an event.</p>
    </div>

    <!-- Event Active, No Performance State -->
    <div v-else-if="!activePerformance" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 mb-6 text-gray-700 animate-pulse">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5V7.5L16,12"/></svg>
      </div>
      <p class="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-2">{{ eventName }}</p>
      <h1 class="text-3xl font-bold text-gray-400 mb-2">Waiting for Performance</h1>
      <p class="text-gray-500">The event coordinator hasn't activated a performance yet.</p>
    </div>

    <!-- Active Performance State -->
    <div v-else class="max-w-2xl mx-auto w-full flex-1 flex flex-col">
      <div class="text-center mb-6">
        <p class="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-1">{{ eventName }}</p>
        <h1 class="text-3xl md:text-4xl font-bold mb-1">{{ activePerformance.name }}</h1>
        <p class="text-xl text-gray-400">by {{ activePerformance.performer }}</p>
      </div>

      <!-- Playback Progress Visualization (Permanent Player Area) -->
      <div class="mb-8 relative overflow-hidden rounded-3xl bg-gray-900 border transition-all duration-300"
           :class="currentTrackId ? 'border-player-accent/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-player-accent/20' : 'border-gray-800'">
        
        <!-- Background Progress -->
        <div v-if="currentTrackId" class="absolute inset-y-0 left-0 bg-gradient-to-r from-player-accent/10 to-player-accent/5 transition-all duration-200" :style="{ width: `${progress}%` }"></div>
        
        <div class="relative z-10 p-6 sm:p-8 flex flex-col items-center">
          
          <!-- Audio Spectrum Visualization -->
          <div class="flex items-end justify-center h-12 mb-6 gap-1 w-full" :class="{'opacity-50 grayscale': !playState.isPlaying && currentTrackId, 'opacity-10': !currentTrackId}">
            <div v-for="i in 15" :key="i" 
                 class="w-1.5 sm:w-2 bg-player-accent rounded-t-sm"
                 :class="playState.isPlaying ? 'animate-soundwave' : 'h-1'"
                 :style="{ animationDelay: `${Math.random() * 0.5}s`, height: playState.isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '4px' }">
            </div>
          </div>

          <p class="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Now Playing</p>
          <p class="text-2xl font-bold text-white mb-6 text-center w-full truncate px-4"
             :class="{'text-gray-600': !currentTrackId}">
             {{ currentTrackName || 'No track selected' }}
          </p>
          
          <!-- Progress Bar & Time -->
          <div class="w-full max-w-md mx-auto mb-8 px-2">
            <div class="flex items-center justify-between text-sm font-mono text-gray-400 mb-2" :class="{'text-player-accent': currentTrackId}">
              <span>{{ formatTime(playState.currentTime) }}</span>
              <span>{{ formatTime(playState.duration) }}</span>
            </div>
            <div class="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-player-accent transition-all duration-200" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-center gap-6 sm:gap-8">
            <button @click="sendCommand('stop')" 
                    :disabled="!currentTrackId"
                    class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200"
                    :class="currentTrackId ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18,18H6V6H18V18Z" /></svg>
            </button>
            
            <button @click="sendCommand(playState.isPlaying ? 'pause' : 'play')" 
                    :disabled="!currentTrackId"
                    class="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform"
                    :class="currentTrackId ? 'bg-player-accent text-black hover:scale-105 shadow-lg shadow-player-accent/30' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'">
              <svg v-if="playState.isPlaying" class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
              <svg v-else class="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
            </button>
            
            <button class="w-14 h-14 rounded-full flex items-center justify-center bg-transparent text-transparent pointer-events-none">
              <!-- Empty spacer to balance the stop button visually -->
            </button>
          </div>
        </div>
      </div>

      <!-- Track List -->
      <div class="space-y-3 flex-1 overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-300">Tracks ({{ activePerformance.tracks.length }})</h3>
        
        <div v-for="track in activePerformance.tracks" :key="track.id" 
             class="bg-gray-800 rounded-xl p-4 flex items-center gap-4 transition-all"
             :class="{'border border-player-accent': track.id === currentTrackId}">
          
          <div class="flex-1 min-w-0">
            <p class="font-medium text-lg text-white truncate" :class="{'text-player-accent': track.id === currentTrackId}">
              {{ track.filename }}
            </p>
            <p class="text-sm text-gray-400">{{ formatTime(track.duration) }}</p>
          </div>

          <button @click="selectTrack(track)" 
                  class="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  :class="track.id === currentTrackId ? 'bg-player-accent/20 text-player-accent' : 'bg-gray-700 text-white hover:bg-gray-600'">
            {{ track.id === currentTrackId ? 'Selected' : 'Select' }}
          </button>
        </div>

        <div v-if="activePerformance.tracks.length === 0" class="text-center py-8 text-gray-500">
          No tracks uploaded for this performance.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { socket } from '@/socket'
import type { Performance, Track, PlayState } from '@/types'

const props = defineProps<{
  eventId: string
}>()

const activePerformance = ref<Performance | null>(null)
const eventName = ref<string>('')
const activeEventId = ref<string>(props.eventId)
const playState = ref<PlayState>({
  isPlaying: false,
  currentTime: 0,
  duration: 0
})

const currentTrackId = computed(() => playState.value.currentTrackId)
const progress = computed(() => playState.value.duration > 0 ? (playState.value.currentTime / playState.value.duration) * 100 : 0)
const currentTrackName = computed(() => {
  const track = activePerformance.value?.tracks.find(t => t.id === currentTrackId.value)
  return track ? track.filename : ''
})

onMounted(() => {
  // Request current state for this specific event
  socket.emit('request_live_state', { eventId: props.eventId })
  
  // Also request it if we reconnect
  socket.on('connected', () => {
    socket.emit('request_live_state', { eventId: props.eventId })
  })

  socket.on('active_live_state', (state: any) => {
    if (state.eventId === props.eventId) {
      activeEventId.value = state.eventId
      eventName.value = state.eventName
      activePerformance.value = state.performance
      if (state.playState) {
        playState.value = state.playState
      }
    }
  })

  socket.on('play_state_updated', (data: any) => {
    if (data.eventId === props.eventId) {
      playState.value = data.playState
    }
  })
})

onUnmounted(() => {
  socket.off('connected')
  socket.off('active_live_state')
  socket.off('play_state_updated')
})

function sendCommand(action: string) {
  socket.emit('performer_send_command', { action, eventId: activeEventId.value })
}

function selectTrack(track: Track) {
  if (track.id !== currentTrackId.value) {
    const originalUrl = track.url || ''
    const fixedUrl = originalUrl.includes(`/api/events/${activeEventId.value}`) 
      ? originalUrl 
      : originalUrl.replace('/api/performances/', `/api/events/${activeEventId.value}/performances/`)
      
    const trackWithUrl = {
      ...track,
      url: fixedUrl
    }
    socket.emit('performer_send_command', { action: 'loadTrack', track: trackWithUrl, eventId: activeEventId.value })
  }
}

function formatTime(seconds: number | undefined): string {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
<style scoped>
@keyframes soundwave {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-soundwave {
  animation: soundwave 1s ease-in-out infinite;
  transform-origin: bottom;
}
</style>
