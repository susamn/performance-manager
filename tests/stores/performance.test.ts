import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePerformanceStore } from '@/stores/performance'
import type { Performance } from '@/types'

describe('Performance Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = usePerformanceStore()

    expect(store.performances).toEqual([])
    expect(store.selectedPerformanceId).toBeNull()
    expect(store.selectedPerformance).toBeUndefined()
    expect(store.isLoading).toBe(false)
  })

  it('loads performances from API', async () => {
    const mockPerformances: Performance[] = [
      {
        id: '1',
        name: 'Test Performance',
        tracks: [],
        isDone: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        order: 0
      }
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPerformances)
    })

    const store = usePerformanceStore()
    await store.loadPerformances()

    expect(store.performances).toEqual(mockPerformances)
    expect(fetch).toHaveBeenCalledWith('/api/performances')
  })

  it('creates new performance', async () => {
    const newPerformance: Performance = {
      id: '2',
      name: 'New Performance',
      tracks: [],
      isDone: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      order: 0
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newPerformance)
    })

    const store = usePerformanceStore()
    const result = await store.createPerformance('New Performance')

    expect(result).toEqual(newPerformance)
    expect(store.performances).toContain(newPerformance)
    expect(fetch).toHaveBeenCalledWith('/api/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Performance' })
    })
  })

  it('selects performance correctly', () => {
    const store = usePerformanceStore()
    store.performances = [{
      id: '1',
      name: 'Test Performance',
      tracks: [],
      isDone: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      order: 0
    }]

    store.selectPerformance('1')
    expect(store.selectedPerformanceId).toBe('1')
    expect(store.selectedPerformance?.name).toBe('Test Performance')
  })

  it('sorts performances correctly (active first, then done)', () => {
    const store = usePerformanceStore()
    store.performances = [
      {
        id: '1',
        name: 'Done Performance',
        tracks: [],
        isDone: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        order: 0
      },
      {
        id: '2',
        name: 'Active Performance',
        tracks: [],
        isDone: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        order: 1
      }
    ]

    const sorted = store.sortedPerformances
    expect(sorted[0].isDone).toBe(false)
    expect(sorted[1].isDone).toBe(true)
  })

  it('uploads track file', async () => {
    const mockTrack = {
      id: 'track-1',
      filename: 'test.mp3',
      performer: 'Test Artist',
      url: '/api/performances/1/files/test.mp3'
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTrack)
    })

    const store = usePerformanceStore()
    store.performances = [{
      id: '1',
      name: 'Test Performance',
      tracks: [],
      isDone: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      order: 0
    }]

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
    const result = await store.uploadTrackFile('1', file, 'Test Artist')

    expect(result).toEqual(mockTrack)
    expect(store.performances[0].tracks).toContain(mockTrack)
  })

  it('reorders performances', () => {
    const store = usePerformanceStore()
    store.performances = [
      { id: '1', name: 'First', tracks: [], isDone: false, createdAt: '2023-01-01T00:00:00.000Z', order: 0 },
      { id: '2', name: 'Second', tracks: [], isDone: false, createdAt: '2023-01-01T00:00:00.000Z', order: 1 }
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

    store.reorderPerformances(['2', '1'])

    expect(store.performances[0].id).toBe('2')
    expect(store.performances[1].id).toBe('1')
    expect(store.performances[0].order).toBe(0)
    expect(store.performances[1].order).toBe(1)
  })
})