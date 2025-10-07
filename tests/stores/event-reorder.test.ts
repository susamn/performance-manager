/**
 * Frontend tests for event store reorder operations
 * Tests specifically for the fatal flaw fixed in reorderPerformances
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventStore } from '@/stores/event'
import type { Performance } from '@/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('Event Store - Reorder Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should preserve all performances when reordering filtered subset', async () => {
    /**
     * CRITICAL TEST: Reproduce the fatal bug scenario
     * 1. Load 10 performances
     * 2. User searches and filters to 3 results
     * 3. User deletes 1 (now 2 filtered, 9 total)
     * 4. Reorder is called with only 2 IDs (the filtered ones)
     * 5. Verify all 9 performances are preserved in local state
     */
    const store = useEventStore()

    // Create 10 performances
    const allPerformances: Performance[] = Array.from({ length: 10 }, (_, i) => ({
      id: `perf-${i}`,
      name: `Performance ${i}`,
      performer: `Artist ${i}`,
      type: 'Song',
      mode: 'Solo',
      tracks: [],
      isDone: false,
      createdAt: new Date().toISOString(),
      order: i
    }))

    // Set initial state with all 10 performances
    store.eventPerformances = allPerformances

    // Mock successful reorder response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Simulate reorder with only 2 IDs (as if filtered by search)
    const filteredIds = ['perf-2', 'perf-7']
    await store.reorderPerformances('test-event', filteredIds)

    // CRITICAL ASSERTION: All 10 performances should still be in store
    expect(store.eventPerformances.length).toBe(10)

    // Verify the reordered items have updated order
    const perf2 = store.eventPerformances.find(p => p.id === 'perf-2')
    const perf7 = store.eventPerformances.find(p => p.id === 'perf-7')
    expect(perf2?.order).toBe(0)
    expect(perf7?.order).toBe(1)

    // Verify all other performances are still present
    for (let i = 0; i < 10; i++) {
      const perf = store.eventPerformances.find(p => p.id === `perf-${i}`)
      expect(perf).toBeDefined()
    }
  })

  it('should update only specified performances order', async () => {
    const store = useEventStore()

    const performances: Performance[] = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'Artist 1',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 0
      },
      {
        id: 'perf-2',
        name: 'Perf 2',
        performer: 'Artist 2',
        type: 'Dance',
        mode: 'Group',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 1
      },
      {
        id: 'perf-3',
        name: 'Perf 3',
        performer: 'Artist 3',
        type: 'Song',
        mode: 'Duet',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 2
      }
    ]

    store.eventPerformances = performances

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Reorder only perf-1 and perf-3, skip perf-2
    await store.reorderPerformances('test-event', ['perf-1', 'perf-3'])

    // perf-2 should still exist with original order
    const perf2 = store.eventPerformances.find(p => p.id === 'perf-2')
    expect(perf2).toBeDefined()
    expect(perf2?.order).toBe(1) // Original order preserved

    // perf-1 and perf-3 should have new order
    const perf1 = store.eventPerformances.find(p => p.id === 'perf-1')
    const perf3 = store.eventPerformances.find(p => p.id === 'perf-3')
    expect(perf1?.order).toBe(0)
    expect(perf3?.order).toBe(1)
  })

  it('should handle reorder API failure gracefully', async () => {
    const store = useEventStore()

    const performances: Performance[] = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'Artist 1',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 0
      },
      {
        id: 'perf-2',
        name: 'Perf 2',
        performer: 'Artist 2',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 1
      }
    ]

    store.eventPerformances = [...performances]

    // Mock failed response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // Should throw error
    await expect(
      store.reorderPerformances('test-event', ['perf-2', 'perf-1'])
    ).rejects.toThrow('Failed to reorder performances')

    // State should not be modified on failure
    expect(store.eventPerformances).toEqual(performances)
  })

  it('should preserve performance properties when reordering', async () => {
    const store = useEventStore()

    const performances: Performance[] = [
      {
        id: 'perf-1',
        name: 'First Song',
        performer: 'Artist A',
        type: 'Song',
        mode: 'Solo',
        tracks: [
          {
            id: 'track-1',
            filename: 'song.mp3',
            performer: 'Artist A',
            url: '/api/track-1',
            isCompleted: false
          }
        ],
        isDone: false,
        createdAt: '2025-01-01T00:00:00Z',
        order: 0,
        expectedDuration: 5
      },
      {
        id: 'perf-2',
        name: 'Second Dance',
        performer: 'Artist B',
        type: 'Dance',
        mode: 'Group',
        tracks: [],
        isDone: true,
        createdAt: '2025-01-02T00:00:00Z',
        order: 1,
        expectedDuration: 10
      }
    ]

    store.eventPerformances = performances

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Reorder only one
    await store.reorderPerformances('test-event', ['perf-2'])

    // Verify all properties are preserved
    const perf1 = store.eventPerformances.find(p => p.id === 'perf-1')!
    expect(perf1.name).toBe('First Song')
    expect(perf1.performer).toBe('Artist A')
    expect(perf1.type).toBe('Song')
    expect(perf1.tracks.length).toBe(1)
    expect(perf1.expectedDuration).toBe(5)

    const perf2 = store.eventPerformances.find(p => p.id === 'perf-2')!
    expect(perf2.name).toBe('Second Dance')
    expect(perf2.isDone).toBe(true)
    expect(perf2.expectedDuration).toBe(10)
  })

  it('should handle empty reorder array', async () => {
    const store = useEventStore()

    const performances: Performance[] = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'Artist 1',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 0
      }
    ]

    store.eventPerformances = [...performances]

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Empty reorder array
    await store.reorderPerformances('test-event', [])

    // All performances should remain
    expect(store.eventPerformances.length).toBe(1)
    expect(store.eventPerformances[0].id).toBe('perf-1')
  })

  it('should handle non-existent performance IDs in reorder array', async () => {
    const store = useEventStore()

    const performances: Performance[] = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'Artist 1',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 0
      },
      {
        id: 'perf-2',
        name: 'Perf 2',
        performer: 'Artist 2',
        type: 'Song',
        mode: 'Solo',
        tracks: [],
        isDone: false,
        createdAt: new Date().toISOString(),
        order: 1
      }
    ]

    store.eventPerformances = [...performances]

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Include non-existent ID
    await store.reorderPerformances('test-event', ['perf-999', 'perf-1'])

    // Both real performances should still exist
    expect(store.eventPerformances.length).toBe(2)

    // perf-1 should have order updated
    const perf1 = store.eventPerformances.find(p => p.id === 'perf-1')
    expect(perf1?.order).toBe(1) // Second in the reorder list

    // perf-2 should keep original order
    const perf2 = store.eventPerformances.find(p => p.id === 'perf-2')
    expect(perf2?.order).toBe(1) // Original order
  })
})
