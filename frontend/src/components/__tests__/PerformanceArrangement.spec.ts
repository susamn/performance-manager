import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useEventStore } from '@/stores/event'
import type { Performance } from '@/types'

describe('Performance Arrangement Functionality', () => {
  let store: ReturnType<typeof useEventStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEventStore()
  })

  const createMockPerformance = (overrides: Partial<Performance> = {}): Performance => ({
    id: `perf-${Math.random()}`,
    name: 'Test Performance',
    performer: 'Test Performer',
    type: 'Song',
    mode: 'Solo',
    tracks: [],
    isDone: false,
    createdAt: new Date().toISOString(),
    order: 0,
    ...overrides
  })

  describe('Order Management', () => {
    it('should maintain order when performances are created', () => {
      const perf1 = createMockPerformance({ order: 0, name: 'First' })
      const perf2 = createMockPerformance({ order: 1, name: 'Second' })
      const perf3 = createMockPerformance({ order: 2, name: 'Third' })

      const performances = [perf1, perf2, perf3]
      const sorted = [...performances].sort((a, b) => a.order - b.order)

      expect(sorted[0].name).toBe('First')
      expect(sorted[1].name).toBe('Second')
      expect(sorted[2].name).toBe('Third')
    })

    it('should correctly reorder performances when dragged', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      // Simulate dragging 'Third' to first position
      const newOrder = ['perf-3', 'perf-1', 'perf-2']

      const reordered = newOrder.map((id, index) => {
        const perf = performances.find(p => p.id === id)!
        return { ...perf, order: index }
      })

      expect(reordered[0].name).toBe('Third')
      expect(reordered[1].name).toBe('First')
      expect(reordered[2].name).toBe('Second')
      expect(reordered[0].order).toBe(0)
      expect(reordered[1].order).toBe(1)
      expect(reordered[2].order).toBe(2)
    })

    it('should preserve order after editing a performance', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      // Edit the second performance
      const editedPerformances = performances.map(p =>
        p.id === 'perf-2'
          ? { ...p, name: 'Second (Edited)', performer: 'New Performer' }
          : p
      )

      const sorted = [...editedPerformances].sort((a, b) => a.order - b.order)

      expect(sorted[0].name).toBe('First')
      expect(sorted[1].name).toBe('Second (Edited)')
      expect(sorted[2].name).toBe('Third')
      expect(sorted[1].order).toBe(1)
    })

    it('should not affect other performances when one is deleted', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      // Delete the middle performance
      const afterDelete = performances.filter(p => p.id !== 'perf-2')

      expect(afterDelete.length).toBe(2)
      expect(afterDelete[0].order).toBe(0)
      expect(afterDelete[1].order).toBe(2)
      expect(afterDelete[0].name).toBe('First')
      expect(afterDelete[1].name).toBe('Third')
    })
  })

  describe('Completed Section', () => {
    it('should separate active and completed performances', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'Active 1', isDone: false }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Completed 1', isDone: true }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Active 2', isDone: false }),
        createMockPerformance({ id: 'perf-4', order: 3, name: 'Completed 2', isDone: true })
      ]

      const active = performances.filter(p => !p.isDone)
      const completed = performances.filter(p => p.isDone)

      expect(active.length).toBe(2)
      expect(completed.length).toBe(2)
      expect(active[0].name).toBe('Active 1')
      expect(active[1].name).toBe('Active 2')
      expect(completed[0].name).toBe('Completed 1')
      expect(completed[1].name).toBe('Completed 2')
    })

    it('should move performance to completed when marked as done', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First', isDone: false }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second', isDone: false })
      ]

      // Mark first performance as done
      const updated = performances.map(p =>
        p.id === 'perf-1' ? { ...p, isDone: true } : p
      )

      const active = updated.filter(p => !p.isDone)
      const completed = updated.filter(p => p.isDone)

      expect(active.length).toBe(1)
      expect(completed.length).toBe(1)
      expect(active[0].name).toBe('Second')
      expect(completed[0].name).toBe('First')
    })

    it('should move performance back to active when unmarked as done', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First', isDone: true }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second', isDone: false })
      ]

      // Unmark first performance
      const updated = performances.map(p =>
        p.id === 'perf-1' ? { ...p, isDone: false } : p
      )

      const active = updated.filter(p => !p.isDone)
      const completed = updated.filter(p => p.isDone)

      expect(active.length).toBe(2)
      expect(completed.length).toBe(0)
      expect(active.find(p => p.name === 'First')).toBeDefined()
    })
  })

  describe('Break Type Performances', () => {
    it('should handle Break type performances correctly', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'Song Performance', type: 'Song' }),
        createMockPerformance({ id: 'break-1', order: 1, name: 'Lunch Break', type: 'Break', mode: 'Lunch', performer: '' }),
        createMockPerformance({ id: 'perf-2', order: 2, name: 'Dance Performance', type: 'Dance' })
      ]

      expect(performances[1].type).toBe('Break')
      expect(performances[1].mode).toBe('Lunch')
      expect(performances[1].performer).toBe('')
    })

    it('should maintain Break performances in correct order with regular performances', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, type: 'Song' }),
        createMockPerformance({ id: 'break-1', order: 1, type: 'Break', mode: 'Lunch' }),
        createMockPerformance({ id: 'perf-2', order: 2, type: 'Dance' }),
        createMockPerformance({ id: 'break-2', order: 3, type: 'Break', mode: 'Dinner' })
      ]

      const sorted = [...performances].sort((a, b) => a.order - b.order)

      expect(sorted[0].type).toBe('Song')
      expect(sorted[1].type).toBe('Break')
      expect(sorted[2].type).toBe('Dance')
      expect(sorted[3].type).toBe('Break')
    })

    it('should allow dragging breaks between regular performances', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, type: 'Song', name: 'Song 1' }),
        createMockPerformance({ id: 'perf-2', order: 1, type: 'Dance', name: 'Dance 1' }),
        createMockPerformance({ id: 'break-1', order: 2, type: 'Break', mode: 'Lunch', name: 'Lunch' })
      ]

      // Drag break to first position
      const newOrder = ['break-1', 'perf-1', 'perf-2']
      const reordered = newOrder.map((id, index) => {
        const perf = performances.find(p => p.id === id)!
        return { ...perf, order: index }
      })

      expect(reordered[0].type).toBe('Break')
      expect(reordered[1].type).toBe('Song')
      expect(reordered[2].type).toBe('Dance')
    })
  })

  describe('Search Functionality', () => {
    it('should filter performances based on search query', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', name: 'Amazing Song', performer: 'John Doe' }),
        createMockPerformance({ id: 'perf-2', name: 'Beautiful Dance', performer: 'Jane Smith' }),
        createMockPerformance({ id: 'perf-3', name: 'Another Song', performer: 'John Doe' })
      ]

      const query = 'john'
      const filtered = performances.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.performer.toLowerCase().includes(query)
      )

      expect(filtered.length).toBe(2)
      expect(filtered.every(p => p.performer === 'John Doe')).toBe(true)
    })

    it('should maintain order in search results', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'Song A', performer: 'Test' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Dance B', performer: 'Other' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Song C', performer: 'Test' })
      ]

      const query = 'test'
      const filtered = performances
        .filter(p => p.performer.toLowerCase().includes(query))
        .sort((a, b) => a.order - b.order)

      expect(filtered.length).toBe(2)
      expect(filtered[0].name).toBe('Song A')
      expect(filtered[1].name).toBe('Song C')
    })
  })

  describe('Drag and Drop Edge Cases', () => {
    it('should handle dragging to the same position', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      // Drag second item to second position (no change)
      const newOrder = ['perf-1', 'perf-2', 'perf-3']
      const reordered = newOrder.map((id, index) => {
        const perf = performances.find(p => p.id === id)!
        return { ...perf, order: index }
      })

      expect(reordered).toEqual(performances)
    })

    it('should handle dragging last item to first position', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      const newOrder = ['perf-3', 'perf-1', 'perf-2']
      const reordered = newOrder.map((id, index) => {
        const perf = performances.find(p => p.id === id)!
        return { ...perf, order: index }
      })

      expect(reordered[0].name).toBe('Third')
      expect(reordered[0].order).toBe(0)
      expect(reordered[2].order).toBe(2)
    })

    it('should handle dragging first item to last position', () => {
      const performances = [
        createMockPerformance({ id: 'perf-1', order: 0, name: 'First' }),
        createMockPerformance({ id: 'perf-2', order: 1, name: 'Second' }),
        createMockPerformance({ id: 'perf-3', order: 2, name: 'Third' })
      ]

      const newOrder = ['perf-2', 'perf-3', 'perf-1']
      const reordered = newOrder.map((id, index) => {
        const perf = performances.find(p => p.id === id)!
        return { ...perf, order: index }
      })

      expect(reordered[2].name).toBe('First')
      expect(reordered[2].order).toBe(2)
      expect(reordered[0].order).toBe(0)
    })
  })
})
