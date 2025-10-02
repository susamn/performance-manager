<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-gray-400">Loading performances...</p>
    </div>

    <div v-else-if="sortedPerformances.length === 0" class="text-center py-8">
      <p class="text-gray-400">No performances created yet. Create your first performance above!</p>
    </div>

    <div v-else ref="performanceContainer" class="space-y-3">
      <PerformanceCard
        v-for="performance in sortedPerformances"
        :key="performance.id"
        :performance="performance"
        :is-selected="selectedPerformanceId === performance.id"
        :compact="!selectedPerformanceId"
        @select="selectPerformance"
        @toggle-done="toggleDone"
        @delete="deletePerformance"
        @track-selected="onTrackSelected"
        class="performance-card-item"
        :data-id="performance.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEventStore } from '@/stores/event'
import { usePlayerStore } from '@/stores/player'
import PerformanceCard from './PerformanceCard.vue'
import Sortable from 'sortablejs'
import type { Performance, Track } from '@/types'

const props = defineProps<{
  eventId: string
}>()

const emit = defineEmits<{
  performanceDone: []
}>()

const eventStore = useEventStore()
const playerStore = usePlayerStore()

const performanceContainer = ref<HTMLElement>()
let sortable: Sortable | null = null

const isLoading = computed(() => eventStore.isLoading)
const sortedPerformances = computed(() => eventStore.sortedPerformances)
const selectedPerformanceId = computed(() => eventStore.selectedPerformanceId)

onMounted(() => {
  eventStore.loadEventPerformances(props.eventId)
  initializeSortable()
})

onUnmounted(() => {
  if (sortable) {
    sortable.destroy()
  }
})

function initializeSortable() {
  if (performanceContainer.value) {
    sortable = new Sortable(performanceContainer.value, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: (evt: Sortable.SortableEvent) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          const newOrder = Array.from(performanceContainer.value!.children)
            .map(el => (el as HTMLElement).dataset.id!)
            .filter(Boolean)

          eventStore.reorderPerformances(props.eventId, newOrder)
        }
      }
    })
  }
}

function selectPerformance(performance: Performance) {
  eventStore.selectPerformance(performance.id)
}

async function toggleDone(performance: Performance) {
  await eventStore.updatePerformance(props.eventId, performance.id, {
    isDone: !performance.isDone
  })

  // If performance was marked as done, emit event to return to main view
  if (!performance.isDone) {
    emit('performanceDone')
  }
}

async function deletePerformance(performance: Performance) {
  if (confirm(`Are you sure you want to delete "${performance.name}"?`)) {
    await eventStore.deletePerformance(props.eventId, performance.id)
  }
}

function onTrackSelected(track: Track) {
  // Update the track URL to include event ID
  const updatedTrack = {
    ...track,
    url: track.url?.replace('/api/performances/', `/api/events/${props.eventId}/performances/`)
  }
  playerStore.loadTrack(updatedTrack)
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
</style>