import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Event, Performance } from '@/types'

export const useEventStore = defineStore('event', () => {
  const events = ref<Event[]>([])
  const selectedEvent = ref<Event | null>(null)
  const eventPerformances = ref<Performance[]>([])
  const selectedPerformanceId = ref<string | null>(null)
  const isLoading = ref(false)

  const sortedEvents = computed(() => {
    return [...events.value].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  const sortedPerformances = computed(() => {
    const performances = [...eventPerformances.value]
    performances.sort((a, b) => {
      if (a.isDone && !b.isDone) return 1
      if (!a.isDone && b.isDone) return -1
      return a.order - b.order
    })
    return performances
  })

  async function loadEvents() {
    isLoading.value = true
    try {
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to load events')
      events.value = await response.json()
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createEvent(name: string, description: string = '', remotePlayerUrl: string = '') {
    try {
      // Use FormData if sending files, but for now assuming JSON since AddEventForm handles FormData logic mostly?
      // Wait, AddEventForm sends FormData.
      // Store function uses JSON. If AddEventForm uses store, it needs to handle the multipart.
      // But AddEventForm logic is usually simpler. Let's look at AddEventForm later.
      // For now, update the store JSON method signature.
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, remotePlayerUrl }),
      })
      if (!response.ok) throw new Error('Failed to create event')
      const event = await response.json()
      events.value.push(event)
      return event
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  async function updateEvent(eventId: string, updates: Partial<Event> & { unlockCode?: string }) {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update event')
      const updatedEvent = await response.json()
      
      // Update in local list
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...updatedEvent }
      }
      
      // Update selected event if it matches
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = { ...selectedEvent.value, ...updatedEvent }
      }
      
      return updatedEvent
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete event')
      events.value = events.value.filter(e => e.id !== eventId)
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = null
        eventPerformances.value = []
        selectedPerformanceId.value = null
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  async function selectEvent(eventId: string) {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to load event')
      selectedEvent.value = await response.json()
      await loadEventPerformances(eventId)
    } catch (error) {
      console.error('Error selecting event:', error)
    }
  }

  async function loadEventPerformances(eventId: string) {
    isLoading.value = true
    try {
      const response = await fetch(`/api/events/${eventId}/performances`)
      if (!response.ok) throw new Error('Failed to load performances')
      eventPerformances.value = await response.json()
    } catch (error) {
      console.error('Error loading performances:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createPerformance(eventId: string, name: string, performer: string) {
    try {
      const response = await fetch(`/api/events/${eventId}/performances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, performer }),
      })
      if (!response.ok) throw new Error('Failed to create performance')
      const performance = await response.json()
      eventPerformances.value.push(performance)
      return performance
    } catch (error) {
      console.error('Error creating performance:', error)
      throw error
    }
  }

  async function updatePerformance(eventId: string, performanceId: string, updates: Partial<Performance>) {
    try {
      const response = await fetch(`/api/events/${eventId}/performances/${performanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update performance')
      const updatedPerformance = await response.json()
      const index = eventPerformances.value.findIndex(p => p.id === performanceId)
      if (index !== -1) {
        eventPerformances.value[index] = updatedPerformance
      }
      return updatedPerformance
    } catch (error) {
      console.error('Error updating performance:', error)
      throw error
    }
  }

  async function deletePerformance(eventId: string, performanceId: string) {
    try {
      const response = await fetch(`/api/events/${eventId}/performances/${performanceId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete performance')
      eventPerformances.value = eventPerformances.value.filter(p => p.id !== performanceId)
      if (selectedPerformanceId.value === performanceId) {
        selectedPerformanceId.value = null
      }
    } catch (error) {
      console.error('Error deleting performance:', error)
      throw error
    }
  }

  async function reorderPerformances(eventId: string, newOrder: string[]) {
    try {
      const response = await fetch(`/api/events/${eventId}/performances/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })
      if (!response.ok) throw new Error('Failed to reorder performances')

      // IMPORTANT: Update order only for performances in newOrder list
      // Preserve ALL other performances with their existing order
      const performanceMap = new Map(eventPerformances.value.map(p => [p.id, p]))

      newOrder.forEach((id, index) => {
        const perf = performanceMap.get(id)
        if (perf) {
          perf.order = index
        }
      })

      // Keep ALL performances, not just the reordered ones
      eventPerformances.value = Array.from(performanceMap.values())
    } catch (error) {
      console.error('Error reordering performances:', error)
      throw error
    }
  }

  async function togglePerformanceDone(eventId: string, performance: Performance) {
    try {
      const updatedPerformance = await updatePerformance(eventId, performance.id, {
        isDone: !performance.isDone
      })
      if (updatedPerformance.isDone && selectedPerformanceId.value === performance.id) {
        selectedPerformanceId.value = null
      }
      return updatedPerformance
    } catch (error) {
      console.error('Error toggling performance done status:', error)
      throw error
    }
  }

  function selectPerformance(performanceId: string | null) {
    selectedPerformanceId.value = performanceId
  }

  function clearSelection() {
    selectedEvent.value = null
    eventPerformances.value = []
    selectedPerformanceId.value = null
  }

  return {
    events,
    selectedEvent,
    eventPerformances,
    selectedPerformanceId,
    isLoading,
    sortedEvents,
    sortedPerformances,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
    loadEventPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
    reorderPerformances,
    togglePerformanceDone,
    selectPerformance,
    clearSelection,
  }
})