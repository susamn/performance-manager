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
              @delete="deleteEvent"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import AddEventForm from '@/components/AddEventForm.vue'
import EventCard from '@/components/EventCard.vue'
import type { Event } from '@/types'

const router = useRouter()
const eventStore = useEventStore()

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

async function deleteEvent(event: Event) {
  if (confirm(`Are you sure you want to delete "${event.name}"? This will delete all performances and tracks within this event.`)) {
    try {
      await eventStore.deleteEvent(event.id)
    } catch (error) {
      alert('Failed to delete event. Please try again.')
    }
  }
}

function getEventPerformanceCount(event: Event): number {
  // For now, return 0 as we don't load performance counts on the main page
  // This could be enhanced to load counts from the API if needed
  return 0
}
</script>