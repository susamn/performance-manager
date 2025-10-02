<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/')"
              class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            </button>
            <div>
              <h1 class="text-xl font-bold">{{ event?.name || 'Event' }}</h1>
              <p v-if="event?.description" class="text-sm text-gray-400">{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Sidebar - Add Performance Form -->
        <div class="lg:col-span-1">
          <AddPerformanceForm
            :event-id="eventId"
            @performance-created="onPerformanceCreated"
          />
          <AddBreakForm
            :event-id="eventId"
            @break-created="onBreakCreated"
          />
        </div>

        <!-- Main Performance Cards -->
        <div class="lg:col-span-2">
          <!-- Selected Performance Info Card -->
          <div v-if="selectedPerformance" class="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 border border-player-accent/30 rounded-lg p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-xl font-bold text-white mb-2">{{ selectedPerformance.name }}</h3>
                <p class="text-lg text-gray-300 mb-3">by {{ selectedPerformance.performer }}</p>
                <div class="flex flex-wrap gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">Type:</span>
                    <span class="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">{{ selectedPerformance.type }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">Mode:</span>
                    <span class="px-2 py-1 bg-purple-600/20 text-purple-300 rounded">{{ selectedPerformance.mode }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">Status:</span>
                    <span :class="selectedPerformance.isDone ? 'px-2 py-1 bg-green-600/20 text-green-300 rounded' : 'px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded'">
                      {{ selectedPerformance.isDone ? 'Completed' : 'Pending' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">Tracks:</span>
                    <span class="px-2 py-1 bg-gray-600/50 text-gray-300 rounded">
                      {{ selectedPerformance.tracks.length === 0 ? 'No tracks' : selectedPerformance.tracks.length }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400 mb-2">Created</p>
                <p class="text-sm text-gray-300">{{ formatDate(selectedPerformance.createdAt) }}</p>
              </div>
            </div>

            <!-- Track List for Selected Performance -->
            <div v-if="selectedPerformance.tracks.length > 0" class="border-t border-gray-600 pt-4">
              <h4 class="text-sm font-medium text-gray-400 mb-3">Tracks ({{ selectedPerformance.tracks.length }})</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                  v-for="(track, index) in selectedPerformance.tracks"
                  :key="track.id"
                  class="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors"
                  :class="{ 'opacity-60': track.isCompleted }"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" @click="onTrackSelected(track)">
                    <span class="text-xs text-gray-400 font-mono bg-gray-600 px-2 py-1 rounded">{{ index + 1 }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate" :class="{ 'line-through': track.isCompleted }">{{ track.filename }}</p>
                      <p class="text-xs text-gray-400">{{ track.performer }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click.stop="toggleTrackCompletion(track)"
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
                      @click.stop="onTrackSelected(track)"
                      class="p-1 text-player-accent hover:text-green-400 transition-colors"
                      title="Play track"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="border-t border-gray-600 pt-4 text-center">
              <p class="text-gray-500 text-sm">No tracks available for this performance</p>
            </div>
          </div>

          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white mb-4">Performances</h2>
          </div>

          <div v-if="isLoading" class="text-center py-8">
            <p class="text-gray-400">Loading performances...</p>
          </div>

          <div v-else-if="sortedItems.length === 0" class="text-center py-8">
            <p class="text-gray-400">No performances or breaks created yet. Create your first item!</p>
          </div>

          <div v-else ref="performanceContainer" class="space-y-3">
            <template v-for="item in sortedItems" :key="item.id">
              <PerformanceCard
                v-if="item.type === 'performance'"
                :performance="getPerformanceFromItem(item)"
                :is-selected="selectedPerformanceId === item.id"
                :disabled="!!(selectedPerformanceId && selectedPerformanceId !== item.id)"
                @select="selectPerformance"
                @toggle-done="toggleDone"
                @delete="deletePerformance"
                @track-selected="onTrackSelected"
                @toggle-track-completion="toggleTrackCompletion"
                class="performance-card-item"
                :data-id="item.id"
                :data-type="item.type"
              />
              <BreakCard
                v-else-if="item.type === 'break'"
                :break-item="getBreakFromItem(item)"
                :disabled="!!selectedPerformanceId"
                @select="selectBreak"
                @toggle-done="toggleBreakDone"
                @delete="deleteBreak"
                class="break-card-item"
                :data-id="item.id"
                :data-type="item.type"
              />
            </template>
          </div>
        </div>

        <!-- Right Media Player -->
        <div class="lg:col-span-1">
          <MediaPlayer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { usePlayerStore } from '@/stores/player'
import AddPerformanceForm from '@/components/AddPerformanceForm.vue'
import AddBreakForm from '@/components/AddBreakForm.vue'
import PerformanceCard from '@/components/PerformanceCard.vue'
import BreakCard from '@/components/BreakCard.vue'
import MediaPlayer from '@/components/MediaPlayer.vue'
import Sortable from 'sortablejs'
import type { Performance, Track, Break } from '@/types'

const route = useRoute()
const eventStore = useEventStore()
const playerStore = usePlayerStore()

const eventId = route.params.eventId as string
const performanceContainer = ref<HTMLElement>()
let sortable: Sortable | null = null

const event = computed(() => eventStore.selectedEvent)
const selectedPerformanceId = computed(() => eventStore.selectedPerformanceId)
const isLoading = computed(() => eventStore.isLoading)
const sortedPerformances = computed(() => eventStore.sortedPerformances)
const selectedPerformance = computed(() => {
  if (!selectedPerformanceId.value) return null
  return sortedPerformances.value.find(p => p.id === selectedPerformanceId.value)
})

// Break state
const breaks = ref<Break[]>([])
const sortedBreaks = computed(() =>
  [...breaks.value].sort((a, b) => a.order - b.order)
)

// Combined items (performances + breaks) sorted by order
const sortedItems = computed(() => {
  const performances = sortedPerformances.value.map(p => ({ ...p, type: 'performance' as const }))
  const breaksWithType = sortedBreaks.value.map(b => ({ ...b, type: 'break' as const }))

  return [...performances, ...breaksWithType].sort((a, b) => a.order - b.order)
})

onMounted(async () => {
  if (eventId) {
    await eventStore.selectEvent(eventId)
    await loadEventBreaks()
  }
  document.addEventListener('keydown', handleKeydown)
})

// Watch for changes in combined items and reinitialize sortable
watch(sortedItems, async () => {
  await nextTick()
  initializeSortable()
}, { immediate: true })

onUnmounted(() => {
  if (sortable) {
    sortable.destroy()
  }
  document.removeEventListener('keydown', handleKeydown)
})

function initializeSortable() {
  // Clean up existing sortable instance
  if (sortable) {
    sortable.destroy()
    sortable = null
  }

  if (performanceContainer.value && sortedItems.value.length > 0) {
    console.log('Initializing sortable with', sortedItems.value.length, 'items')
    sortable = new Sortable(performanceContainer.value, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: '.performance-card.done, .break-card.done',
      preventOnFilter: false,
      onStart: (evt) => {
        console.log('Drag started', evt)
      },
      onEnd: (evt: Sortable.SortableEvent) => {
        console.log('Drag ended', evt)
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          const newOrder = Array.from(performanceContainer.value!.children)
            .map(el => {
              const id = (el as HTMLElement).dataset.id!
              const type = (el as HTMLElement).dataset.type!
              return { id, type }
            })
            .filter(item => item.id && item.type)
          console.log('Reordering to:', newOrder)
          reorderMixedItems(newOrder)
        }
      }
    })
    console.log('Sortable initialized:', sortable)
  }
}

async function reorderMixedItems(newOrder: { id: string, type: string }[]) {
  try {
    // Separate performances and breaks from the new order
    const performanceIds: string[] = []
    const breakIds: string[] = []

    newOrder.forEach((item, index) => {
      if (item.type === 'performance') {
        performanceIds.push(item.id)
        // Update performance order in the store
        const performance = sortedPerformances.value.find(p => p.id === item.id)
        if (performance) {
          performance.order = index
        }
      } else if (item.type === 'break') {
        breakIds.push(item.id)
        // Update break order locally
        const breakItem = breaks.value.find(b => b.id === item.id)
        if (breakItem) {
          breakItem.order = index
        }
      }
    })

    // Send requests to both endpoints in parallel
    const promises = []

    if (performanceIds.length > 0) {
      promises.push(eventStore.reorderPerformances(eventId, performanceIds))
    }

    if (breakIds.length > 0) {
      promises.push(fetch(`/api/events/${eventId}/breaks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: breakIds })
      }))
    }

    await Promise.all(promises)
    console.log('Mixed items reordering completed successfully')
  } catch (error) {
    console.error('Error reordering mixed items:', error)
    // Reload both performances and breaks to restore correct order
    await eventStore.loadEventPerformances(eventId)
    await loadEventBreaks()
  }
}

async function onPerformanceCreated(performance: Performance) {
  // Calculate the order for the new performance (after all existing items)
  const maxOrder = Math.max(
    ...sortedItems.value.map(item => item.order),
    -1
  )

  // Update the performance order to be after all existing items
  try {
    const response = await fetch(`/api/events/${eventId}/performances/${performance.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: maxOrder + 1 })
    })

    if (!response.ok) {
      console.error('Failed to update performance order')
    }
  } catch (error) {
    console.error('Error setting performance order:', error)
  }

  await eventStore.loadEventPerformances(eventId)
  eventStore.selectPerformance(performance.id)
}

function selectPerformance(performance: Performance) {
  if (selectedPerformanceId.value === performance.id) {
    eventStore.selectPerformance(null)
  } else {
    eventStore.selectPerformance(performance.id)
  }
}

async function toggleDone(performance: Performance) {
  await eventStore.togglePerformanceDone(eventId, performance)
}

async function deletePerformance(performance: Performance) {
  if (confirm(`Are you sure you want to delete "${performance.name}" by ${performance.performer}?`)) {
    await eventStore.deletePerformance(eventId, performance.id)
    if (selectedPerformanceId.value === performance.id) {
      eventStore.selectPerformance(null)
    }
  }
}

function onTrackSelected(track: Track) {
  // Only play tracks from the selected performance
  if (selectedPerformanceId.value) {
    const updatedTrack = {
      ...track,
      url: track.url?.replace('/api/performances/', `/api/events/${eventId}/performances/`)
    }
    playerStore.loadTrack(updatedTrack)
  }
}

async function toggleTrackCompletion(track: Track) {
  if (!selectedPerformanceId.value) return

  try {
    const response = await fetch(`/api/events/${eventId}/performances/${selectedPerformanceId.value}/tracks/${track.id}/completion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !track.isCompleted })
    })

    if (!response.ok) throw new Error('Failed to update track completion')

    // Reload performances to get updated data
    await eventStore.loadEventPerformances(eventId)
  } catch (error) {
    console.error('Error updating track completion:', error)
    alert('Failed to update track completion. Please try again.')
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Helper functions to extract original types from items with added type property
function getPerformanceFromItem(item: any): Performance {
  const { type, ...performance } = item
  return performance as Performance
}

function getBreakFromItem(item: any): Break {
  const { type: itemType, ...breakItem } = item
  return breakItem as Break
}

// Break management functions
async function loadEventBreaks() {
  try {
    const response = await fetch(`/api/events/${eventId}/breaks`)
    if (response.ok) {
      breaks.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading breaks:', error)
  }
}

async function onBreakCreated(breakObj: Break) {
  // Calculate the order for the new break (after last performance)
  const maxOrder = Math.max(
    ...sortedItems.value.map(item => item.order),
    -1
  )

  // Update the break order to be after all existing items
  try {
    await fetch(`/api/events/${eventId}/breaks/${breakObj.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: maxOrder + 1 })
    })
  } catch (error) {
    console.error('Error setting break order:', error)
  }

  await loadEventBreaks()
}

function selectBreak(breakItem: Break) {
  // User specified that clicking on a break should NOT load the performance info dialog
  // So we'll just handle this as a simple click without affecting the selected performance
  console.log('Break selected:', breakItem.name)
}

async function toggleBreakDone(breakItem: Break) {
  try {
    const response = await fetch(`/api/events/${eventId}/breaks/${breakItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !breakItem.isDone })
    })

    if (response.ok) {
      await loadEventBreaks()
    }
  } catch (error) {
    console.error('Error updating break:', error)
    alert('Failed to update break. Please try again.')
  }
}

async function deleteBreak(breakItem: Break) {
  if (confirm(`Are you sure you want to delete the break "${breakItem.name}"?`)) {
    try {
      const response = await fetch(`/api/events/${eventId}/breaks/${breakItem.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadEventBreaks()
      }
    } catch (error) {
      console.error('Error deleting break:', error)
      alert('Failed to delete break. Please try again.')
    }
  }
}

// Handle space key for play/pause
function handleKeydown(event: KeyboardEvent) {
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault()
    // Media player will handle this through the player store
  }
}
</script>

<style scoped>
.sortable-ghost {
  opacity: 0.4;
}

.sortable-chosen {
  transform: scale(1.02);
}

.sortable-drag {
  transform: rotate(5deg);
}

.performance-card-item {
  transition: transform 0.2s ease;
}

.break-card-item {
  transition: transform 0.2s ease;
}

/* Ensure performance cards have proper styling for drag and drop */
:deep(.performance-card) {
  background: rgba(55, 65, 81, 1);
  border: 1px solid rgba(75, 85, 99, 1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.performance-card:hover) {
  background: rgba(75, 85, 99, 1);
}

:deep(.performance-card.selected) {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

:deep(.performance-card.done) {
  opacity: 0.6;
  background: rgba(55, 65, 81, 0.5);
}

:deep(.drag-handle) {
  cursor: grab !important;
}

:deep(.drag-handle:active) {
  cursor: grabbing !important;
}
</style>