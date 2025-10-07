/**
 * Integration test for the exact bug scenario reported
 *
 * Bug Description:
 * - 10 performances exist
 * - User searches and gets 3 results
 * - User deletes 1 of the 3 results (9 total remain)
 * - User refreshes page
 * - Expected: 9 performances remain
 * - Bug: Only 2 performances remain (the other 7 were deleted)
 *
 * Root Cause:
 * - Search filters the displayed performances
 * - Sortable reorder is triggered with only the filtered IDs
 * - Backend/frontend reorder was replacing entire array instead of updating order only
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventStore } from '@/stores/event'
import type { Performance } from '@/types'

// Mock fetch
global.fetch = vi.fn()

describe('Integration: Search + Delete + Refresh Bug', () => {
  let mockPerformances: Performance[]

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Create 10 initial performances
    mockPerformances = Array.from({ length: 10 }, (_, i) => ({
      id: `perf-${i}`,
      name: i === 2 || i === 5 || i === 7 ? `Special Performance ${i}` : `Performance ${i}`,
      performer: `Artist ${i}`,
      type: 'Song',
      mode: 'Solo',
      tracks: [],
      isDone: false,
      createdAt: new Date().toISOString(),
      order: i
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should preserve all performances after search, delete, and reorder', async () => {
    const store = useEventStore()
    const eventId = 'test-event-123'

    // ============ STEP 1: Initial Load ============
    // Mock initial fetch of 10 performances
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPerformances
      })
    )

    await store.loadEventPerformances(eventId)
    expect(store.eventPerformances.length).toBe(10)

    // ============ STEP 2: User Searches ============
    // Frontend filters to "Special" performances (would be perf-2, perf-5, perf-7)
    const searchResults = store.eventPerformances.filter(p =>
      p.name.includes('Special')
    )
    expect(searchResults.length).toBe(3)
    const searchResultIds = searchResults.map(p => p.id)
    expect(searchResultIds).toEqual(['perf-2', 'perf-5', 'perf-7'])

    // ============ STEP 3: User Deletes One Result ============
    // Delete perf-5 from the search results
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 204
      })
    )

    await store.deletePerformance(eventId, 'perf-5')
    expect(store.eventPerformances.length).toBe(9)

    // Now only 2 items match search: perf-2, perf-7
    const remainingSearchResults = store.eventPerformances.filter(p =>
      p.name.includes('Special')
    )
    expect(remainingSearchResults.length).toBe(2)

    // ============ STEP 4: User Refreshes / Reorder Triggered ============
    // This is where the bug occurred - sortable would send only visible IDs
    const visibleIds = remainingSearchResults.map(p => p.id) // ['perf-2', 'perf-7']

    // Mock successful reorder
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      })
    )

    // This should NOT delete the other 7 performances
    await store.reorderPerformances(eventId, visibleIds)

    // ============ STEP 5: CRITICAL VERIFICATION ============
    // BUG TEST: Before fix, this would be 2
    // AFTER FIX: This should be 9
    expect(store.eventPerformances.length).toBe(9,
      'All non-deleted performances should be preserved after reorder')

    // Verify perf-5 is deleted
    const deletedPerf = store.eventPerformances.find(p => p.id === 'perf-5')
    expect(deletedPerf).toBeUndefined()

    // Verify all other 9 performances exist
    for (let i = 0; i < 10; i++) {
      if (i === 5) continue // Skip deleted one

      const perf = store.eventPerformances.find(p => p.id === `perf-${i}`)
      expect(perf).toBeDefined(`Performance perf-${i} should exist`)
    }

    // Verify reordered items have updated order
    const perf2 = store.eventPerformances.find(p => p.id === 'perf-2')
    const perf7 = store.eventPerformances.find(p => p.id === 'perf-7')
    expect(perf2?.order).toBe(0)
    expect(perf7?.order).toBe(1)

    // Verify non-reordered items kept their original order
    const perf0 = store.eventPerformances.find(p => p.id === 'perf-0')
    const perf9 = store.eventPerformances.find(p => p.id === 'perf-9')
    expect(perf0?.order).toBe(0) // Original order
    expect(perf9?.order).toBe(9) // Original order
  })

  it('should handle multiple search-delete-reorder cycles', async () => {
    const store = useEventStore()
    const eventId = 'test-event-456'

    // Load initial 10 performances
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPerformances
      })
    )

    await store.loadEventPerformances(eventId)
    expect(store.eventPerformances.length).toBe(10)

    // ============ Cycle 1 ============
    // Delete perf-3
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, status: 204 })
    )
    await store.deletePerformance(eventId, 'perf-3')

    // Reorder with partial list
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    )
    await store.reorderPerformances(eventId, ['perf-1', 'perf-4'])
    expect(store.eventPerformances.length).toBe(9)

    // ============ Cycle 2 ============
    // Delete perf-6
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, status: 204 })
    )
    await store.deletePerformance(eventId, 'perf-6')

    // Reorder with different partial list
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    )
    await store.reorderPerformances(eventId, ['perf-0', 'perf-2'])
    expect(store.eventPerformances.length).toBe(8)

    // ============ Cycle 3 ============
    // Delete perf-9
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, status: 204 })
    )
    await store.deletePerformance(eventId, 'perf-9')

    // Final reorder
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    )
    await store.reorderPerformances(eventId, ['perf-7'])

    // Should have 7 performances (deleted 3, 6, 9)
    expect(store.eventPerformances.length).toBe(7)

    // Verify deleted ones are gone
    expect(store.eventPerformances.find(p => p.id === 'perf-3')).toBeUndefined()
    expect(store.eventPerformances.find(p => p.id === 'perf-6')).toBeUndefined()
    expect(store.eventPerformances.find(p => p.id === 'perf-9')).toBeUndefined()

    // Verify remaining 7 exist
    const expectedRemaining = [0, 1, 2, 4, 5, 7, 8]
    for (const i of expectedRemaining) {
      expect(store.eventPerformances.find(p => p.id === `perf-${i}`))
        .toBeDefined(`Performance perf-${i} should exist after multiple cycles`)
    }
  })

  it('should work correctly with no search filter (all items visible)', async () => {
    const store = useEventStore()
    const eventId = 'test-event-789'

    // Load 10 performances
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPerformances
      })
    )

    await store.loadEventPerformances(eventId)

    // Delete one WITHOUT search filter (all items visible)
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, status: 204 })
    )
    await store.deletePerformance(eventId, 'perf-4')

    // Reorder ALL remaining items
    const allRemainingIds = store.eventPerformances.map(p => p.id)
    expect(allRemainingIds.length).toBe(9)

    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    )
    await store.reorderPerformances(eventId, allRemainingIds)

    // Should still have 9
    expect(store.eventPerformances.length).toBe(9)

    // All except perf-4 should exist
    for (let i = 0; i < 10; i++) {
      const perf = store.eventPerformances.find(p => p.id === `perf-${i}`)
      if (i === 4) {
        expect(perf).toBeUndefined()
      } else {
        expect(perf).toBeDefined()
      }
    }
  })
})
