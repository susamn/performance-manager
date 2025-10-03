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
        </div>

        <!-- Main Performance Cards -->
        <div class="lg:col-span-2 flex flex-col h-[calc(100vh-120px)]">
          <!-- Performance Info Card (Always Visible) -->
          <div
            class="mb-6 border border-player-accent/30 rounded-lg p-6 h-[400px] relative overflow-hidden cover-image-container"
            :class="!selectedPerformance && event?.coverImage ? 'bg-cover bg-center' : 'bg-gradient-to-r from-gray-800 to-gray-700'"
            :style="!selectedPerformance && event?.coverImage ? {
              backgroundImage: `url(${coverImageUrl})`,
              backgroundPosition: `${event.imagePosition?.x || 50}% ${event.imagePosition?.y || 50}%`
            } : {}"
            @mouseenter="!selectedPerformance && event?.coverImage ? showPositionButton = true : null"
            @mouseleave="!selectedPerformance && event?.coverImage ? showPositionButton = false : null"
          >
            <!-- Diagonal shine effect overlay (only when cover image exists) -->
            <div v-if="!selectedPerformance && event?.coverImage" class="diagonal-shine"></div>
            <!-- When a performance is selected -->
            <div v-if="selectedPerformance">
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
                    <div v-if="selectedPerformance.expectedDuration" class="flex items-center gap-2">
                      <span class="text-gray-400">Duration:</span>
                      <span class="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                        {{ formatDuration(selectedPerformance.expectedDuration) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400 mb-2">Created</p>
                  <p class="text-sm text-gray-300">{{ formatDate(selectedPerformance.createdAt) }}</p>
                </div>
              </div>

              <!-- Track Summary for Selected Performance (non-interactive, just counts) -->
              <div v-if="selectedPerformance.tracks.length > 0" class="border-t border-gray-600 pt-4 pb-8">
                <h4 class="text-sm font-medium text-gray-400 mb-3">Track Summary</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-3 bg-gray-700/30 rounded">
                    <p class="text-lg font-semibold text-white">{{ selectedPerformance.tracks.length }}</p>
                    <p class="text-xs text-gray-400">Total Tracks</p>
                  </div>
                  <div class="text-center p-3 bg-green-600/20 rounded">
                    <p class="text-lg font-semibold text-green-300">{{ selectedPerformance.tracks.filter(t => t.isCompleted).length }}</p>
                    <p class="text-xs text-gray-400">Completed</p>
                  </div>
                  <div class="text-center p-3 bg-yellow-600/20 rounded">
                    <p class="text-lg font-semibold text-yellow-300">{{ selectedPerformance.tracks.filter(t => !t.isCompleted).length }}</p>
                    <p class="text-xs text-gray-400">Remaining</p>
                  </div>
                  <div class="text-center p-3 bg-purple-600/20 rounded">
                    <p class="text-lg font-semibold text-purple-300">{{ Math.round((selectedPerformance.tracks.filter(t => t.isCompleted).length / selectedPerformance.tracks.length) * 100) }}%</p>
                    <p class="text-xs text-gray-400">Progress</p>
                  </div>
                </div>
              </div>

              <div v-else class="border-t border-gray-600 pt-4 pb-8 text-center">
                <p class="text-gray-500 text-sm">No tracks available for this performance</p>
              </div>
            </div>

            <!-- When no performance is selected - show event overview -->
            <div v-else class="h-full flex flex-col justify-center text-center relative">
              <!-- Position Button (appears on hover when cover image exists) -->
              <button
                v-if="event?.coverImage && showPositionButton && !isPositioning"
                @click="startPositioning"
                class="absolute bottom-4 right-4 bg-black/70 hover:bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 z-10"
              >
                🎨 Position Image
              </button>

              <!-- Positioning Mode Overlay -->
              <div v-if="isPositioning" class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg">
                <div class="text-center text-white">
                  <p class="text-lg font-medium mb-2">Click to position image</p>
                  <p class="text-sm text-gray-300 mb-4">Click anywhere to set the focal point</p>
                  <button
                    @click="finishPositioning"
                    class="bg-player-accent hover:bg-green-400 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

              <!-- Click handler for positioning -->
              <div
                v-if="isPositioning"
                @click="handleImageClick"
                class="absolute inset-0 cursor-crosshair z-10"
              ></div>

              <!-- Content overlay for when there's a cover image -->
              <div v-if="event?.coverImage" class="relative z-10">
                <!-- Just empty space to allow the background image to show -->
              </div>

              <!-- Fallback when no cover image -->
              <div v-else>
                <p class="text-gray-500 text-lg mb-2">Event Overview</p>
                <p class="text-gray-600 text-sm">Select a performance card to view details</p>
                <p class="text-gray-700 text-xs mt-4">Add a cover image when creating events</p>
              </div>
            </div>

            <!-- Duration Overlay Banner (Always Visible) -->
            <div class="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-gray-600 rounded-b-lg px-6 py-3">
              <!-- Expected Duration (Manually Entered) -->
              <div v-if="totalDuration > 0" class="mb-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-6 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Total:</span>
                      <span class="text-white font-medium">{{ formatDuration(totalDuration) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Completed:</span>
                      <span class="text-green-300 font-medium">{{ formatDuration(completedDuration) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Remaining:</span>
                      <span class="text-yellow-300 font-medium">{{ formatDuration(remainingDuration) }}</span>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ Math.round((completedDuration / totalDuration) * 100) }}% complete
                  </div>
                </div>
              </div>

              <!-- Resolved Duration (From Track Durations) -->
              <div v-if="totalResolvedDuration > 0" class="border-t border-gray-700 pt-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-6 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500">Resolved Total:</span>
                      <span class="text-blue-300 font-medium">{{ formatResolvedDuration(totalResolvedDuration) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500">Resolved Completed:</span>
                      <span class="text-blue-200 font-medium">{{ formatResolvedDuration(completedResolvedDuration) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500">Resolved Remaining:</span>
                      <span class="text-blue-100 font-medium">{{ formatResolvedDuration(remainingResolvedDuration) }}</span>
                    </div>
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ Math.round((completedResolvedDuration / totalResolvedDuration) * 100) }}% done
                  </div>
                </div>
              </div>

              <div v-if="totalDuration === 0 && totalResolvedDuration === 0" class="text-center text-gray-500 text-sm">
                No durations set - Add expected durations or upload tracks
              </div>
            </div>
          </div>

          <!-- Performances Section (Fixed Height) -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="mb-4">
              <h2 class="text-xl font-semibold text-white mb-3">Performances</h2>
              <!-- Search Box -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search performances, performers, types..."
                  class="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-player-accent text-white placeholder-gray-400"
                />
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <!-- Clear button -->
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="isLoading" class="flex-1 flex items-center justify-center">
              <p class="text-gray-400">Loading performances...</p>
            </div>

            <div v-else-if="sortedItems.active.length === 0 && sortedItems.completed.length === 0" class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <p v-if="searchQuery.trim()" class="text-gray-400 mb-2">
                  No results found for "{{ searchQuery }}"
                </p>
                <p v-else class="text-gray-400 mb-2">
                  No performances created yet. Create your first item!
                </p>
                <button
                  v-if="searchQuery.trim()"
                  @click="searchQuery = ''"
                  class="text-player-accent hover:text-green-400 text-sm underline"
                >
                  Clear search
                </button>
              </div>
            </div>

            <div v-else class="flex-1 overflow-hidden">
              <div class="h-full overflow-y-auto pr-2 pb-6">
                <!-- Active Performances Section -->
                <div v-if="sortedItems.active.length > 0">
                  <h3 class="text-lg font-semibold text-white mb-3 sticky top-0 bg-gray-900 py-2 z-10">
                    Performances
                  </h3>
                  <div ref="performanceContainer" class="space-y-3">
                    <template v-for="item in sortedItems.active" :key="item.id">
                      <PerformanceCard
                        v-if="item.type !== 'Break'"
                        :performance="item"
                        :is-selected="selectedPerformanceId === item.id"
                        :disabled="!!(selectedPerformanceId && selectedPerformanceId !== item.id)"
                        @select="selectPerformance"
                        @toggle-done="toggleDone"
                        @edit="editPerformance"
                        @delete="deletePerformance"
                        @track-selected="onTrackSelected"
                        @toggle-track-completion="toggleTrackCompletion"
                        @delete-track="deleteTrack"
                        class="performance-card-item"
                        :data-id="item.id"
                      />
                      <BreakCard
                        v-else
                        :break-item="convertPerformanceToBreak(item)"
                        :disabled="!!selectedPerformanceId"
                        @select="() => {}"
                        @toggle-done="() => toggleDone(item)"
                        @delete="() => deletePerformance(item)"
                        class="break-card-item"
                        :data-id="item.id"
                      />
                    </template>
                  </div>
                </div>

                <!-- Completed Section -->
                <div v-if="sortedItems.completed.length > 0" class="mt-8">
                  <h3 class="text-lg font-semibold text-gray-400 mb-3 sticky top-0 bg-gray-900 py-2 z-10">
                    Completed
                  </h3>
                  <div ref="completedContainer" class="space-y-3">
                    <template v-for="item in sortedItems.completed" :key="item.id">
                      <PerformanceCard
                        v-if="item.type !== 'Break'"
                        :performance="item"
                        :is-selected="false"
                        :disabled="false"
                        @select="selectPerformance"
                        @toggle-done="toggleDone"
                        @edit="editPerformance"
                        @delete="deletePerformance"
                        @track-selected="onTrackSelected"
                        @toggle-track-completion="toggleTrackCompletion"
                        @delete-track="deleteTrack"
                        class="performance-card-item completed-item"
                        :data-id="item.id"
                      />
                      <BreakCard
                        v-else
                        :break-item="convertPerformanceToBreak(item)"
                        :disabled="false"
                        @select="() => {}"
                        @toggle-done="() => toggleDone(item)"
                        @delete="() => deletePerformance(item)"
                        class="break-card-item completed-item"
                        :data-id="item.id"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Media Player -->
        <div class="lg:col-span-1">
          <MediaPlayer />
        </div>
      </div>
    </div>

    <!-- Edit Performance Modal -->
    <EditPerformanceModal
      v-if="performanceToEdit"
      :is-visible="editModalVisible"
      :performance="performanceToEdit"
      :event-id="eventId"
      @close="closeEditModal"
      @updated="onPerformanceUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { usePlayerStore } from '@/stores/player'
import AddPerformanceForm from '@/components/AddPerformanceForm.vue'
import PerformanceCard from '@/components/PerformanceCard.vue'
import BreakCard from '@/components/BreakCard.vue'
import MediaPlayer from '@/components/MediaPlayer.vue'
import EditPerformanceModal from '@/components/EditPerformanceModal.vue'
import Sortable from 'sortablejs'
import type { Performance, Track } from '@/types'

const route = useRoute()
const eventStore = useEventStore()
const playerStore = usePlayerStore()

const eventId = route.params.eventId as string
const performanceContainer = ref<HTMLElement>()
const searchQuery = ref('')
let sortable: Sortable | null = null

const event = computed(() => eventStore.selectedEvent)
const selectedPerformanceId = computed(() => eventStore.selectedPerformanceId)
const isLoading = computed(() => eventStore.isLoading)
const sortedPerformances = computed(() => eventStore.sortedPerformances)
const selectedPerformance = computed(() => {
  if (!selectedPerformanceId.value) return null
  return sortedPerformances.value.find(p => p.id === selectedPerformanceId.value)
})

// Cover image state
const showPositionButton = ref(false)
const isPositioning = ref(false)
const coverImageUrl = computed(() => {
  if (event.value?.coverImage) {
    return `/api/events/${eventId}/cover`
  }
  return undefined
})

// Edit modal state
const editModalVisible = ref(false)
const performanceToEdit = ref<Performance | null>(null)

// All items are now performances (including breaks which have type='Break')
const sortedItems = computed(() => {
  let allItems = [...sortedPerformances.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    allItems = allItems.filter(item => {
      // Search in performance name, performer, type, and mode
      const searchFields = [
        item.name,
        item.performer,
        item.type,
        item.mode
      ].filter(Boolean).map(field => field.toLowerCase())

      // Also search in track filenames
      if (item.tracks && item.tracks.length > 0) {
        const trackNames = item.tracks.map((track: any) => track.filename.toLowerCase())
        searchFields.push(...trackNames)
      }

      return searchFields.some(field => field.includes(query))
    })
  }

  // Separate into active and completed
  const activeItems = allItems.filter(item => !item.isDone)
  const completedItems = allItems.filter(item => item.isDone)

  return { active: activeItems, completed: completedItems }
})

// Duration calculations (expectedDuration - manually entered, in minutes)
const totalDuration = computed(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  return allItems.reduce((total, item) => {
    return total + (item.expectedDuration || 0)
  }, 0)
})

const completedDuration = computed(() => {
  return sortedItems.value.completed.reduce((total, item) => {
    return total + (item.expectedDuration || 0)
  }, 0)
})

const remainingDuration = computed(() => {
  return totalDuration.value - completedDuration.value
})

// Resolved duration calculations (from track durations, in seconds)
const calculateResolvedDuration = (performance: Performance): number => {
  if (!performance.tracks || performance.tracks.length === 0) return 0
  return performance.tracks.reduce((total, track) => {
    return total + (track.duration || 0)
  }, 0)
}

const totalResolvedDuration = computed(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  return allItems.reduce((total, item) => {
    return total + calculateResolvedDuration(item)
  }, 0)
})

const completedResolvedDuration = computed(() => {
  return sortedItems.value.completed.reduce((total, item) => {
    return total + calculateResolvedDuration(item)
  }, 0)
})

const remainingResolvedDuration = computed(() => {
  return totalResolvedDuration.value - completedResolvedDuration.value
})

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

function formatResolvedDuration(seconds: number): string {
  if (seconds === 0) return '0 min'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  } else if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  return `${secs}s`
}

onMounted(async () => {
  if (eventId) {
    await eventStore.selectEvent(eventId)
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

  if (performanceContainer.value && sortedItems.value.active.length > 0) {
    console.log('Initializing sortable with', sortedItems.value.active.length, 'items')
    sortable = new Sortable(performanceContainer.value, {
      animation: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      swapThreshold: 0.65,
      invertSwap: false,
      direction: 'vertical',
      removeCloneOnHide: true,
      onStart: (evt) => {
        console.log('Drag started', evt)
      },
      onEnd: async (evt: Sortable.SortableEvent) => {
        console.log('Drag ended', evt)
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          const newOrder = Array.from(performanceContainer.value!.children)
            .map(el => (el as HTMLElement).dataset.id!)
            .filter(id => id)
          console.log('Reordering to:', newOrder)
          await reorderPerformances(newOrder)
        }
      }
    })
    console.log('Sortable initialized:', sortable)
  }
}

async function reorderPerformances(newOrder: string[]) {
  try {
    await eventStore.reorderPerformances(eventId, newOrder)
    console.log('Performances reordering completed successfully')
  } catch (error) {
    console.error('Error reordering performances:', error)
    await eventStore.loadEventPerformances(eventId)
  }
}

async function onPerformanceCreated(performance: Performance) {
  // Calculate the order for the new performance (after all existing active items)
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  const maxOrder = Math.max(
    ...allItems.map(item => item.order),
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
}

function selectPerformance(performance: Performance) {
  if (selectedPerformanceId.value === performance.id) {
    eventStore.selectPerformance(null)
  } else {
    eventStore.selectPerformance(performance.id)
  }
}

async function toggleDone(performance: Performance) {
  const wasSelected = selectedPerformanceId.value === performance.id
  const wasDone = performance.isDone

  // If unmarking as done, we need to move it to top of active list
  if (wasDone) {
    // Find the minimum order in active items
    const activeItems = sortedPerformances.value.filter(p => !p.isDone && p.id !== performance.id)
    const minOrder = activeItems.length > 0 ? Math.min(...activeItems.map(p => p.order)) : 0

    // Update the performance to be at the top (order -1 or less than min)
    try {
      await fetch(`/api/events/${eventId}/performances/${performance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDone: false,
          order: minOrder - 1
        })
      })
      await eventStore.loadEventPerformances(eventId)
    } catch (error) {
      console.error('Error updating performance:', error)
    }
  } else {
    // Marking as done - just toggle the status
    await eventStore.togglePerformanceDone(eventId, performance)
  }

  // If the performance was marked as done and was selected, deselect it
  if (wasSelected && !wasDone) {
    eventStore.selectPerformance(null)
  }
}

function editPerformance(performance: Performance) {
  performanceToEdit.value = performance
  editModalVisible.value = true
}

function closeEditModal() {
  editModalVisible.value = false
  performanceToEdit.value = null
}

async function onPerformanceUpdated(updatedPerformance: Performance) {
  // Refresh the performances list to get the latest data
  await eventStore.loadEventPerformances(eventId)
  closeEditModal()
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

async function deleteTrack(track: Track) {
  if (!selectedPerformanceId.value) return

  if (!confirm(`Are you sure you want to delete "${track.filename}"?`)) {
    return
  }

  try {
    const response = await fetch(`/api/events/${eventId}/performances/${selectedPerformanceId.value}/tracks/${track.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) throw new Error('Failed to delete track')

    // Reload performances to get updated data with recalculated resolved duration
    await eventStore.loadEventPerformances(eventId)
  } catch (error) {
    console.error('Error deleting track:', error)
    alert('Failed to delete track. Please try again.')
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Helper function to convert Performance with type='Break' to Break format
function convertPerformanceToBreak(performance: Performance): any {
  return {
    id: performance.id,
    name: performance.name,
    type: performance.mode as any, // mode contains the break type
    isDone: performance.isDone,
    createdAt: performance.createdAt,
    order: performance.order,
    expectedDuration: performance.expectedDuration
  }
}

// Cover image positioning functions
function startPositioning() {
  isPositioning.value = true
  showPositionButton.value = false
}

function finishPositioning() {
  isPositioning.value = false
}

async function handleImageClick(event: MouseEvent) {
  if (!isPositioning.value || !event.currentTarget) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  try {
    const response = await fetch(`/api/events/${eventId}/position`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    })

    if (response.ok) {
      // Update local event data
      await eventStore.selectEvent(eventId)
      console.log('Image position updated successfully')
    }
  } catch (error) {
    console.error('Error updating image position:', error)
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
  opacity: 0.3;
  background: rgba(16, 185, 129, 0.1) !important;
  border: 2px dashed rgba(16, 185, 129, 0.5) !important;
}

.sortable-chosen {
  cursor: grabbing !important;
}

.sortable-drag {
  opacity: 1 !important;
  cursor: grabbing !important;
  transform: rotate(2deg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
  transition: none !important;
}

.performance-card-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.break-card-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
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
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

:deep(.drag-handle:active) {
  cursor: grabbing !important;
}

:deep(.sortable-chosen .drag-handle) {
  cursor: grabbing !important;
}

/* Completed items styling */
:deep(.completed-item) {
  opacity: 0.7;
}

:deep(.completed-item:hover) {
  opacity: 0.85;
}

/* Custom scrollbar styling for performance list */
:deep(.h-full.overflow-y-auto) {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.6) rgba(31, 41, 55, 0.2);
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar) {
  width: 8px;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-track) {
  background: rgba(31, 41, 55, 0.2);
  border-radius: 4px;
  margin: 4px 0;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, rgba(75, 85, 99, 0.7) 0%, rgba(55, 65, 81, 0.8) 100%);
  border-radius: 4px;
  border: 1px solid rgba(75, 85, 99, 0.3);
  transition: all 0.2s ease;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(16, 185, 129, 0.4) 100%);
  border-color: rgba(16, 185, 129, 0.5);
  transform: scaleX(1.2);
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb:active) {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-color: rgba(16, 185, 129, 0.7);
}

/* Diagonal shine animation for cover image */
.diagonal-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 50%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.1) 45%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.1) 55%,
    transparent 60%,
    transparent 100%
  );
  transform: rotate(45deg);
  animation: diagonal-shine 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes diagonal-shine {
  0% {
    left: -50%;
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  20% {
    left: 150%;
    opacity: 1;
  }
  25% {
    opacity: 0;
  }
  100% {
    left: 150%;
    opacity: 0;
  }
}

/* Ensure cover image container can show the shine effect */
.cover-image-container {
  position: relative;
}
</style>