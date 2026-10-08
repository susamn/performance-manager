<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-white">Performance Manager</h1>
        <p class="text-gray-400 mt-1">Manage your events and performances</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Sidebar - Add Event Form -->
        <div class="lg:col-span-1">
          <AddEventForm @event-created="onEventCreated" />
        </div>

        <!-- Main Event List -->
        <div class="lg:col-span-3">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white mb-4">Events</h2>
          </div>

          <div v-if="isLoading" class="text-center py-8">
            <p class="text-gray-400">Loading events...</p>
          </div>

          <div v-else-if="sortedEvents.length === 0" class="text-center py-8">
            <p class="text-gray-400">No events created yet. Create your first event!</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EventCard
              v-for="event in sortedEvents"
              :key="event.id"
              :event="event"
              :performance-count="getEventPerformanceCount(event)"
              @select="selectEvent"
              @delete="confirmDeleteEvent"
              @download="downloadEventPDF"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Event Modal with Admin PIN -->
    <DeleteEventModal
      v-if="eventToDelete"
      :event="eventToDelete"
      @close="eventToDelete = null"
      @deleted="onEventDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { useDialogStore } from '@/stores/dialog'
import AddEventForm from '@/components/AddEventForm.vue'
import EventCard from '@/components/EventCard.vue'
import DeleteEventModal from '@/components/DeleteEventModal.vue'
import { downloadEventProgram } from '@/utils/export'
import type { Event, Performance, Break } from '@/types'

const router = useRouter()
const eventStore = useEventStore()
const dialogStore = useDialogStore()
const eventToDelete = ref<Event | null>(null)

const isLoading = computed(() => eventStore.isLoading)
const sortedEvents = computed(() => eventStore.sortedEvents)

onMounted(() => {
  eventStore.loadEvents()
})

async function onEventCreated(event: Event) {
  await eventStore.loadEvents()
  // Auto-navigate to the newly created event
  router.push(`/events/${event.id}`)
}

function selectEvent(event: Event) {
  router.push(`/events/${event.id}`)
}

function confirmDeleteEvent(event: Event) {
  eventToDelete.value = event
}

function onEventDeleted() {
  eventToDelete.value = null
}

function getEventPerformanceCount(event: Event): number {
  // Get the count from the event's performanceCount property if available
  return (event as any).performanceCount || 0
}

async function downloadEventPDF(event: Event) {
  try {
    const [performancesRes, breaksRes] = await Promise.all([
      fetch(`/api/events/${event.id}/performances`),
      fetch(`/api/events/${event.id}/breaks`)
    ])

    const performances: Performance[] = performancesRes.ok ? await performancesRes.json() : []
    const breaks: Break[] = breaksRes.ok ? await breaksRes.json() : []

    downloadEventProgram(event, performances, breaks)
  } catch (error) {
    console.error('Error generating HTML report:', error)
    await dialogStore.alert('Failed to generate report. Please try again.', 'Export Error', 'error')
  }
}
</script>