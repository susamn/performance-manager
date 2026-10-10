import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from './player'
import { useEventStore } from './event'
import { socket } from '@/socket'

vi.mock('@/socket', () => ({ socket: { on: vi.fn(), emit: vi.fn() } }))

const track = { id: 'track-2', filename: 'second.mp3', performer: 'Artist', duration: 60 }
const stopped = {
  isPlaying: false, currentTime: 0, duration: 60,
  currentEventId: 'event-1', currentPerformanceId: 'performance-1', currentTrackId: track.id
}
const response = { eventId: 'event-1', track, playState: stopped, continuous: true }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => response }))
})

describe('MPD player control', () => {
  it('selects a track without asking the server to play it', async () => {
    const store = usePlayerStore()
    useEventStore().setEventToken('event-1', 'test-token')
    await store.initialize('event-1')
    store.setContinuousPlay('performance-1', true)
    await store.loadTrack(track, false, 'performance-1')

    expect(store.currentTrack?.id).toBe('track-2')
    expect(store.playState.isPlaying).toBe(false)
    expect(fetch).toHaveBeenCalledWith('/api/events/event-1/player/load', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      body: JSON.stringify({ performanceId: 'performance-1', trackId: 'track-2', continuous: true })
    }))
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/player/control'))).toBe(false)
  })

  it('commands MPD on the server instead of playing browser audio', async () => {
    const store = usePlayerStore()
    await store.initialize('event-1')
    await store.play()
    await store.seek(50)
    expect(fetch).toHaveBeenCalledWith('/api/events/event-1/player/control', expect.objectContaining({
      body: JSON.stringify({ action: 'play' })
    }))
    expect(fetch).toHaveBeenCalledWith('/api/events/event-1/player/control', expect.objectContaining({
      body: JSON.stringify({ action: 'seek', percentage: 50 })
    }))
  })

  it('uses MPD status for progress and ignores other events', async () => {
    const store = usePlayerStore()
    await store.initialize('event-1')
    const handler = vi.mocked(socket.on).mock.calls.find(([name]) => name === 'play_state_updated')![1] as Function
    handler({ eventId: 'other', playState: { ...stopped, currentTime: 40 } })
    expect(store.progress).toBe(0)
    handler({ eventId: 'event-1', playState: { ...stopped, isPlaying: true, currentTime: 15 } })
    expect(store.progress).toBe(25)
    expect(store.formattedCurrentTime).toBe('0:15')
  })

  it('reports MPD errors to the control panel', async () => {
    const store = usePlayerStore()
    await store.initialize('event-1')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'MPD unavailable' }) }))
    await store.play()
    expect(store.error).toContain('MPD unavailable')
  })
})
