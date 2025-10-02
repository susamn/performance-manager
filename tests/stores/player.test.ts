import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/types'

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

  it('formats time correctly', () => {
    const store = usePlayerStore()
    store.playState.currentTime = 65 // 1:05
    store.playState.duration = 185 // 3:05

    expect(store.formattedCurrentTime).toBe('1:05')
    expect(store.formattedDuration).toBe('3:05')
  })

  it('calculates progress correctly', () => {
    const store = usePlayerStore()
    store.playState.currentTime = 30
    store.playState.duration = 120

    expect(store.progress).toBe(25)
  })

  it('loads track correctly', () => {
    const store = usePlayerStore()
    const track: Track = {
      id: 'track-1',
      filename: 'test.mp3',
      performer: 'Test Artist',
      url: '/api/performances/1/files/test.mp3',
      duration: 180
    }

    store.loadTrack(track)

    expect(store.currentTrack).toEqual(track)
    expect(store.playState.currentTrackId).toBe('track-1')
    expect(store.playState.duration).toBe(180)
  })

  it('handles play/pause toggle', () => {
    const store = usePlayerStore()
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      src: '',
      currentTime: 0
    }

    store.audioElement = mockAudio as any

    // Test play
    store.playState.isPlaying = false
    store.togglePlayPause()
    expect(mockAudio.play).toHaveBeenCalled()

    // Test pause
    store.playState.isPlaying = true
    store.togglePlayPause()
    expect(mockAudio.pause).toHaveBeenCalled()
  })

  it('handles stop correctly', () => {
    const store = usePlayerStore()
    const mockAudio = {
      pause: vi.fn(),
      currentTime: 0,
      addEventListener: vi.fn(),
      src: ''
    }

    store.audioElement = mockAudio as any
    store.playState.currentTime = 30
    store.playState.isPlaying = true

    store.stop()

    expect(mockAudio.pause).toHaveBeenCalled()
    expect(mockAudio.currentTime).toBe(0)
    expect(store.playState.currentTime).toBe(0)
    expect(store.playState.isPlaying).toBe(false)
  })

  it('handles seek correctly', () => {
    const store = usePlayerStore()
    const mockAudio = {
      currentTime: 0,
      addEventListener: vi.fn(),
      src: ''
    }

    store.audioElement = mockAudio as any
    store.playState.duration = 120

    store.seek(50) // 50%

    expect(mockAudio.currentTime).toBe(60)
    expect(store.playState.currentTime).toBe(60)
  })

  it('handles rewind correctly', () => {
    const store = usePlayerStore()
    const mockAudio = {
      currentTime: 0,
      addEventListener: vi.fn(),
      src: ''
    }

    store.audioElement = mockAudio as any
    store.playState.currentTime = 30

    store.rewind()

    expect(mockAudio.currentTime).toBe(0)
    expect(store.playState.currentTime).toBe(0)
  })

  it('handles space key for play/pause', () => {
    const store = usePlayerStore()
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      src: '',
      currentTime: 0
    }

    store.audioElement = mockAudio as any
    vi.spyOn(store, 'togglePlayPause')

    // Simulate space key press
    store.handleSpaceKey()

    // Wait for the timeout to complete
    return new Promise(resolve => {
      setTimeout(() => {
        expect(store.togglePlayPause).toHaveBeenCalled()
        resolve(undefined)
      }, 350)
    })
  })

  it('handles double space key for stop', () => {
    const store = usePlayerStore()
    const mockAudio = {
      pause: vi.fn(),
      addEventListener: vi.fn(),
      src: '',
      currentTime: 0
    }

    store.audioElement = mockAudio as any
    vi.spyOn(store, 'stop')

    // Simulate double space key press
    store.handleSpaceKey()
    store.handleSpaceKey()

    expect(store.stop).toHaveBeenCalled()
  })
})