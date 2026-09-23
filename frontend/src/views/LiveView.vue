<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-8">
    <div v-if="!activePerformance" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 mb-6 text-gray-700 animate-pulse">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5V7.5L16,12"/></svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-400 mb-2">Waiting for Performance</h1>
      <p class="text-gray-500">The event coordinator hasn't activated a performance yet.</p>
    </div>

    <div v-else class="max-w-2xl mx-auto w-full flex-1 flex flex-col">
      <div class="text-center mb-8">
        <p class="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-2">{{ eventName }}</p>
        <h1 class="text-4xl md:text-5xl font-bold mb-2">{{ activePerformance.name }}</h1>
        <p class="text-2xl text-gray-400">by {{ activePerformance.performer }}</p>
      </div>

      <!-- Playback Progress Visualization -->
      <div v-if="currentTrackId" class="mb-8 p-6 bg-gray-800 rounded-2xl border-2 border-player-accent/30 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-player-accent/5" :style="{ width: `${progress}%` }"></div>
        <div class="relative z-10">
          <p class="text-sm text-gray-400 mb-1">Now Playing</p>
          <p class="text-xl font-bold text-white mb-4 truncate">{{ currentTrackName }}</p>
          
          <div class="flex items-center justify-between text-sm font-mono text-player-accent mb-4">
            <span>{{ formatTime(playState.currentTime) }}</span>
            <span>{{ formatTime(playState.duration) }}</span>
          </div>

          <div class="flex justify-center gap-6">
            <button @click="sendCommand('stop')" class="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18,18H6V6H18V18Z" /></svg>
            </button>
            <button @click="sendCommand(playState.isPlaying ? 'pause' : 'play')" class="w-20 h-20 rounded-full bg-player-accent hover:bg-green-400 flex items-center justify-center text-black transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <svg v-if="playState.isPlaying" class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
              <svg v-else class="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Track List -->
      <div class="space-y-4 flex-1">
        <h3 class="text-lg font-semibold text-gray-300">Tracks ({{ activePerformance.tracks.length }})</h3>
        
        <div v-for="track in activePerformance.tracks" :key="track.id" 
             class="bg-gray-800 rounded-xl p-4 flex items-center gap-4 transition-all"
             :class="{'border-2 border-player-accent shadow-[0_0_15px_rgba(16,185,129,0.2)]': track.id === currentTrackId}">
          
          <button @click="playTrack(track)" 
                  class="w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-colors"
                  :class="track.id === currentTrackId && playState.isPlaying ? 'bg-player-accent text-black animate-pulse' : 'bg-gray-700 text-white hover:bg-gray-600'">
            <svg v-if="track.id === currentTrackId && playState.isPlaying" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
            <svg v-else class="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
          </button>
          
          <div class="flex-1 min-w-0" @click="playTrack(track)">
            <p class="font-medium text-lg text-white truncate cursor-pointer">{{ track.filename }}</p>
            <p class="text-sm text-gray-400">{{ formatTime(track.duration) }}</p>
          </div>
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

const activePerformance = ref<Performance | null>(null)
const eventName = ref<string>('')
const activeEventId = ref<string>('')
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
  socket.on('active_live_state', (state: any) => {
    activeEventId.value = state.eventId
    eventName.value = state.eventName
    activePerformance.value = state.performance
    if (state.playState) {
      playState.value = state.playState
    }
  })

  socket.on('play_state_updated', (state: PlayState) => {
    playState.value = state
  })
})

onUnmounted(() => {
  socket.off('active_live_state')
  socket.off('play_state_updated')
})

function sendCommand(action: string) {
  socket.emit('performer_send_command', { action })
}

function playTrack(track: Track) {
  if (track.id === currentTrackId.value) {
    sendCommand(playState.value.isPlaying ? 'pause' : 'play')
  } else {
    const trackWithUrl = {
      ...track,
      url: `/api/events/${activeEventId.value}/performances/${activePerformance.value?.id}/tracks/${track.id}/file`
    }
    socket.emit('performer_send_command', { action: 'loadTrack', track: trackWithUrl })
  }
}

function formatTime(seconds: number): string {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
