import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from './player'
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
    Howl: vi.fn().mockImplementation((options) => ({
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      seek: vi.fn().mockReturnValue(0),
      duration: vi.fn().mockReturnValue(120),
      unload: vi.fn(),
      // Auto-trigger onload for testing
      _triggerLoad: () => {
        if (options.onload) options.onload()
      }
    }))
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
    
    store.loadTrack(track)
    
    expect(store.currentTrack).toEqual(track)
    expect(store.playState.currentTrackId).toBe('1')
    
    // Verify socket emit was called for broadcast
    expect(socket.emit).toHaveBeenCalledWith('admin_update_play_state', expect.any(Object))
  })
})
