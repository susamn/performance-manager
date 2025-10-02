import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Performance, Track } from '@/types'

export const usePerformanceStore = defineStore('performance', () => {
  const performances = ref<Performance[]>([])
  const selectedPerformanceId = ref<string | null>(null)
  const isLoading = ref(false)

  const selectedPerformance = computed(() =>
    performances.value.find(p => p.id === selectedPerformanceId.value)
  )

  const sortedPerformances = computed(() => {
    const done = performances.value.filter(p => p.isDone).sort((a, b) => a.order - b.order)
    const notDone = performances.value.filter(p => !p.isDone).sort((a, b) => a.order - b.order)
    return [...notDone, ...done]
  })

  async function loadPerformances() {
    try {
      isLoading.value = true
      const response = await fetch('/api/performances')
      if (response.ok) {
        performances.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to load performances:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createPerformance(name: string) {
    try {
      const response = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (response.ok) {
        const newPerformance = await response.json()
        performances.value.push(newPerformance)
        return newPerformance
      }
    } catch (error) {
      console.error('Failed to create performance:', error)
    }
  }

  async function updatePerformance(id: string, updates: Partial<Performance>) {
    try {
      const response = await fetch(`/api/performances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (response.ok) {
        const updated = await response.json()
        const index = performances.value.findIndex(p => p.id === id)
        if (index !== -1) {
          performances.value[index] = updated
        }
      }
    } catch (error) {
      console.error('Failed to update performance:', error)
    }
  }

  async function deletePerformance(id: string) {
    try {
      const response = await fetch(`/api/performances/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        performances.value = performances.value.filter(p => p.id !== id)
        if (selectedPerformanceId.value === id) {
          selectedPerformanceId.value = null
        }
      }
    } catch (error) {
      console.error('Failed to delete performance:', error)
    }
  }

  async function addTrackToPerformance(performanceId: string, track: Omit<Track, 'id'>) {
    try {
      const response = await fetch(`/api/performances/${performanceId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track)
      })
      if (response.ok) {
        const newTrack = await response.json()
        const performance = performances.value.find(p => p.id === performanceId)
        if (performance) {
          performance.tracks.push(newTrack)
        }
        return newTrack
      }
    } catch (error) {
      console.error('Failed to add track:', error)
    }
  }

  async function uploadTrackFile(performanceId: string, file: File, performer: string) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('performer', performer)

      const response = await fetch(`/api/performances/${performanceId}/upload`, {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        const newTrack = await response.json()
        const performance = performances.value.find(p => p.id === performanceId)
        if (performance) {
          performance.tracks.push(newTrack)
        }
        return newTrack
      }
    } catch (error) {
      console.error('Failed to upload track:', error)
    }
  }

  function selectPerformance(id: string | null) {
    selectedPerformanceId.value = id
  }

  function reorderPerformances(newOrder: string[]) {
    const reordered = newOrder.map((id, index) => {
      const perf = performances.value.find(p => p.id === id)
      if (perf) {
        return { ...perf, order: index }
      }
      return null
    }).filter(Boolean) as Performance[]

    performances.value = reordered

    // Update order on server
    fetch('/api/performances/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder })
    }).catch(error => console.error('Failed to update order:', error))
  }

  return {
    performances,
    selectedPerformanceId,
    selectedPerformance,
    sortedPerformances,
    isLoading,
    loadPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
    addTrackToPerformance,
    uploadTrackFile,
    selectPerformance,
    reorderPerformances
  }
})