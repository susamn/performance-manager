import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../src/stores/player'
import { socket } from '../src/socket'

vi.mock('../src/socket', () => ({
  socket: { on: vi.fn(), emit: vi.fn(), off: vi.fn() }
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    eventId: 'Event-A', track: null,
    playState: { currentEventId: 'Event-A', isPlaying: false, currentTime: 0, duration: 0 }
  }) }))
})

describe('MPD event isolation', () => {
  it('ignores playback updates for another event', async () => {
    const store = usePlayerStore()
    await store.initialize('Event-A')
    const handler = vi.mocked(socket.on).mock.calls.find(([name]) => name === 'play_state_updated')![1] as Function
    handler({ eventId: 'Event-B', playState: {
      currentEventId: 'Event-B', isPlaying: true, currentTime: 10, duration: 30
    } })
    expect(store.playState.isPlaying).toBe(false)
  })

  it('accepts MPD updates for the opened event', async () => {
    const store = usePlayerStore()
    await store.initialize('Event-A')
    const handler = vi.mocked(socket.on).mock.calls.find(([name]) => name === 'play_state_updated')![1] as Function
    handler({ eventId: 'Event-A', playState: {
      currentEventId: 'Event-A', isPlaying: true, currentTime: 10, duration: 30
    } })
    expect(store.playState.currentTime).toBe(10)
  })
})
