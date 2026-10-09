import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from './player'
import { useEventStore } from './event'
import { socket } from '@/socket'

// Mock socket
vi.mock('@/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
  }
}))

// Mock howler
vi.mock('howler', () => {
  return {
    Howl: vi.fn().mockImplementation((options) => {
      const instance = {
        play: vi.fn().mockImplementation(() => {
          if (options.onplay) options.onplay()
        }),
        pause: vi.fn().mockImplementation(() => {
          if (options.onpause) options.onpause()
        }),
        stop: vi.fn().mockImplementation(() => {
          if (options.onstop) options.onstop()
        }),
        seek: vi.fn().mockReturnValue(0),
        duration: vi.fn().mockReturnValue(120),
        unload: vi.fn(),
        off: vi.fn(),
        on: vi.fn(),
        _triggerLoad: () => {
          if (options.onload) options.onload()
        }
      }
      if (options.autoplay && options.onplay) {
        options.onplay()
      }
      return instance
    })
  }
})

describe('Player Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const store = usePlayerStore()
    expect(store.playState.isPlaying).toBe(false)
    expect(store.playState.currentTime).toBe(0)
    expect(store.playState.duration).toBe(0)
    expect(store.currentTrack).toBeNull()
  })

  it('broadcasts state when socket receives command', () => {
    const store = usePlayerStore()
    
    // Simulate socket receive
    const onCall = (socket.on as any).mock.calls.find((call: any) => call[0] === 'admin_receive_command')
    expect(onCall).toBeDefined()
    
    const handler = onCall[1]
    
    // Simulate play command
    handler({ action: 'play' })
    // Howl is not initialized yet, but the store handles it gracefully.
  })
  
  it('loads a track and emits state', () => {
    const store = usePlayerStore()
    const track = { id: '1', filename: 'song.mp3', performer: 'Artist', url: 'http://test.com/song.mp3' }
    
    // Set event ID so broadcast happens
    store.playState.currentEventId = 'test-event'
    store.loadTrack(track)
    
    expect(store.currentTrack).toEqual(track)
    expect(store.playState.currentTrackId).toBe('1')
  })

  it('manages continuous play toggle per performance', () => {
    const store = usePlayerStore()
    expect(store.isContinuousPlay('perf-1')).toBe(false)
    
    store.toggleContinuousPlay('perf-1')
    expect(store.isContinuousPlay('perf-1')).toBe(true)
    expect(store.isContinuousPlay('perf-2')).toBe(false)
    
    store.toggleContinuousPlay('perf-1')
    expect(store.isContinuousPlay('perf-1')).toBe(false)
    
    store.setContinuousPlay('perf-2', true)
    expect(store.setContinuousPlay).toBeDefined()
    expect(store.isContinuousPlay('perf-2')).toBe(true)
  })

  it('autoplays next track with continuous play when duration - 10s is reached', () => {
    vi.useFakeTimers()
    const store = usePlayerStore()
    const eventStore = useEventStore()
    
    store.playState.currentEventId = 'event-1'
    eventStore.eventPerformances = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'Performer 1',
        type: 'Song',
        mode: 'Solo',
        tracks: [
          { id: 't-1', filename: 'song1.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song1.mp3', duration: 30 },
          { id: 't-2', filename: 'song2.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song2.mp3', duration: 25 }
        ],
        isDone: false,
        createdAt: '2026-01-01',
        order: 0
      }
    ] as any
    
    store.setContinuousPlay('perf-1', true)
    
    // User selects t-1 from the list with autoPlay = true
    store.loadTrack(eventStore.eventPerformances[0].tracks[0], true, 'perf-1')
    
    expect(store.currentTrack?.id).toBe('t-1')
    expect(store.playState.isPlaying).toBe(true)
    
    const outgoing = store.howlInstance!
    // Mock Howl seek returning 21s (30 - 10 = 20, so 21 triggers next track)
    ;(outgoing.seek as any).mockReturnValue(21)

    vi.advanceTimersByTime(150)

    expect(store.currentTrack?.id).toBe('t-2')
    expect(store.playState.isPlaying).toBe(true)
    // Calling play() on the outgoing Howl starts a duplicate sound in Howler.
    expect(outgoing.play).toHaveBeenCalledTimes(1)
    const incoming = store.howlInstance!
    expect(incoming).not.toBe(outgoing)
    ;(incoming.seek as any).mockReturnValue(4)
    // Outgoing end/stop callbacks must not stop incoming progress updates.
    outgoing.stop()
    vi.advanceTimersByTime(150)
    expect(store.playState.currentTime).toBe(4)
    expect(store.progress).toBeCloseTo(4 / 25 * 100)
    expect(store.playState.isPlaying).toBe(true)
    store.stop()
    vi.useRealTimers()
  })

  it('does not autoplay next track if continuous play is disabled for performance', () => {
    vi.useFakeTimers()
    const store = usePlayerStore()
    const eventStore = useEventStore()

    store.playState.currentEventId = 'event-1'
    eventStore.eventPerformances = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'P1',
        type: 'Song',
        mode: 'Solo',
        tracks: [
          { id: 't-1', filename: 'song1.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song1.mp3', duration: 30 },
          { id: 't-2', filename: 'song2.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song2.mp3', duration: 25 }
        ],
        isDone: false,
        createdAt: '2026-01-01',
        order: 0
      }
    ] as any

    store.setContinuousPlay('perf-1', false)
    store.loadTrack(eventStore.eventPerformances[0].tracks[0], true, 'perf-1')

    if (store.howlInstance) {
      (store.howlInstance.seek as any).mockReturnValue(21)
    }

    vi.advanceTimersByTime(150)

    // Should still be t-1
    expect(store.currentTrack?.id).toBe('t-1')

    vi.useRealTimers()
  })

  it('can start from any song in the performance and advance to the one that appears next', () => {
    vi.useFakeTimers()
    const store = usePlayerStore()
    const eventStore = useEventStore()

    store.playState.currentEventId = 'event-1'
    eventStore.eventPerformances = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'P1',
        type: 'Song',
        mode: 'Solo',
        tracks: [
          { id: 't-1', filename: 'song1.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song1.mp3', duration: 30 },
          { id: 't-2', filename: 'song2.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song2.mp3', duration: 30 },
          { id: 't-3', filename: 'song3.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song3.mp3', duration: 30 }
        ],
        isDone: false,
        createdAt: '2026-01-01',
        order: 0
      }
    ] as any

    store.setContinuousPlay('perf-1', true)

    // User selects t-2 directly from list
    store.loadTrack(eventStore.eventPerformances[0].tracks[1], true, 'perf-1')
    expect(store.currentTrack?.id).toBe('t-2')

    // Track 2 approaches end (30 - 10 = 20, so 21s)
    if (store.howlInstance) {
      (store.howlInstance.seek as any).mockReturnValue(21)
    }

    vi.advanceTimersByTime(150)

    // Should advance to t-3 (the next track that appears next)
    expect(store.currentTrack?.id).toBe('t-3')

    vi.useRealTimers()
  })

  it('loops back to the first track when the last track finishes with continuous play', () => {
    vi.useFakeTimers()
    const store = usePlayerStore()
    const eventStore = useEventStore()

    store.playState.currentEventId = 'event-1'
    eventStore.eventPerformances = [
      {
        id: 'perf-1',
        name: 'Perf 1',
        performer: 'P1',
        type: 'Song',
        mode: 'Solo',
        tracks: [
          { id: 't-1', filename: 'song1.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song1.mp3', duration: 30 },
          { id: 't-2', filename: 'song2.mp3', performer: 'P1', url: '/api/events/event-1/performances/perf-1/files/song2.mp3', duration: 30 }
        ],
        isDone: false,
        createdAt: '2026-01-01',
        order: 0
      }
    ] as any

    store.setContinuousPlay('perf-1', true)

    // Load last track (t-2)
    store.loadTrack(eventStore.eventPerformances[0].tracks[1], true, 'perf-1')
    expect(store.currentTrack?.id).toBe('t-2')

    // Track 2 reaches overlap threshold (30 - 10 = 20)
    if (store.howlInstance) {
      (store.howlInstance.seek as any).mockReturnValue(21)
    }

    vi.advanceTimersByTime(150)

    // Should wrap around and load the first track (t-1)
    expect(store.currentTrack?.id).toBe('t-1')
    expect(store.playState.isPlaying).toBe(true)

    vi.useRealTimers()
  })
})
