<template>
  <div class="fillers-widget bg-gray-800 rounded-lg p-4 border border-gray-600 mb-6">
    <div class="flex items-center gap-2 mb-3">
      <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
      </svg>
      <h3 class="text-sm font-semibold text-white">Fillers & Common Tracks</h3>
    </div>

    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search fillers, dance music..."
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-yellow-500 text-white text-sm"
        @focus="showSuggestions = true"
        @blur="handleBlur"
      />
      
      <!-- Loading State -->
      <div v-if="isLoading" class="absolute right-3 top-2.5">
        <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Suggestions Dropdown -->
      <div
        v-if="showSuggestions && searchQuery.trim() && filteredTracks.length > 0"
        class="absolute left-0 right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar"
      >
        <div
          v-for="item in filteredTracks"
          :key="item.track.id"
          class="px-3 py-2 hover:bg-gray-600 cursor-pointer flex items-center justify-between group"
          @click="playTrack(item.track, item.performanceId)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white truncate group-hover:text-yellow-400 transition-colors mb-1">{{ item.track.filename }}</p>
            <span 
              class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border"
              :class="getCategoryStyle(item.performanceName)"
            >
              {{ item.performanceName }}
            </span>
          </div>
          <button class="p-1 text-gray-400 hover:text-yellow-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- No Results -->
      <div
        v-if="showSuggestions && searchQuery.trim() && filteredTracks.length === 0 && !isLoading"
        class="absolute left-0 right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 p-3 text-center"
      >
        <p class="text-sm text-gray-400">No tracks found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import type { Performance, Track, Event } from '@/types'

const playerStore = usePlayerStore()
const searchQuery = ref('')
const showSuggestions = ref(false)
const isLoading = ref(false)
const commonPerformances = ref<Performance[]>([])

interface TrackResult {
  track: Track
  performanceName: string
  performanceId: string
}

function getCategoryStyle(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes('filler')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  if (normalized.includes('dance')) return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
  if (normalized.includes('background')) return 'bg-green-500/20 text-green-300 border-green-500/30'
  if (normalized.includes('intro') || normalized.includes('outro')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  if (normalized.includes('special')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  
  return 'bg-gray-600/40 text-gray-300 border-gray-500/30'
}

const filteredTracks = computed<TrackResult[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  const results: TrackResult[] = []

  commonPerformances.value.forEach(perf => {
    const perfNameMatch = perf.name.toLowerCase().includes(query)
    
    perf.tracks.forEach(track => {
      // Match if performance name matches OR track filename matches
      if (perfNameMatch || track.filename.toLowerCase().includes(query)) {
        results.push({
          track,
          performanceName: perf.name,
          performanceId: perf.id
        })
      }
    })
  })

  return results
})

async function fetchCommonEventData() {
  isLoading.value = true
  try {
    // 1. Fetch all events to find "Common Events"
    const eventsRes = await fetch('/api/events')
    if (!eventsRes.ok) return
    
    const events: Event[] = await eventsRes.json()
    const commonEvent = events.find(e => e.name === 'Common Events')
    
    if (commonEvent) {
      // 2. Fetch performances for Common Events
      const perfRes = await fetch(`/api/events/${commonEvent.id}/performances`)
      if (perfRes.ok) {
        commonPerformances.value = await perfRes.json()
      }
    }
  } catch (error) {
    console.error('Failed to load Fillers data:', error)
  } finally {
    isLoading.value = false
  }
}

function playTrack(track: Track, performanceId?: string) {
  playerStore.loadTrack(track, performanceId)
  showSuggestions.value = false
  // searchQuery.value = '' // Keep search query for now, or clear it? User usually wants to select and done.
  // Let's clear it to indicate selection is done.
  searchQuery.value = ''
}

function handleBlur() {
  // Delay hiding to allow click event to register
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

onMounted(() => {
  fetchCommonEventData()
})
</script>

<style scoped>
/* Custom scrollbar styling */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.6) rgba(31, 41, 55, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.6);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
</style>