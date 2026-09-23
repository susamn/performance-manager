import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../src/stores/player'
import { useEventStore } from '../src/stores/event'

// Mock the socket
vi.mock('../src/socket', () => ({
  socket: {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
  }
}))

// Mock howler to avoid AudioContext errors
vi.mock('howler', () => ({
  Howl: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    unload: vi.fn(),
  }))
}))

describe('playerStore', () => {
  let socketOnCallback: (cmd: any) => void;

  beforeEach(async () => {
    setActivePinia(createPinia())
    const { socket } = await import('../src/socket')
    vi.clearAllMocks()
    
    // Instantiate playerStore to register socket.on listeners
    usePlayerStore()
    
    // Capture the registered callback for 'admin_receive_command'
    const onCall = vi.mocked(socket.on).mock.calls.find(call => call[0] === 'admin_receive_command');
    if (onCall) {
      socketOnCallback = onCall[1] as (cmd: any) => void;
    }
  })

  it('CRITICAL FIX: Should ignore commands meant for a different event', () => {
    const playerStore = usePlayerStore()
    const eventStore = useEventStore()
    
    // Admin is viewing Event A
    eventStore.selectedEvent = { 
      id: 'Event-A',
      name: 'Event A',
      createdAt: '',
      performances: [],
      breaks: []
    }

    // Performer B sends a play command for Event B
    socketOnCallback({
      eventId: 'Event-B',
      action: 'play'
    })

    // The player state should NOT update to Event B
    expect(playerStore.playState.currentEventId).toBeUndefined()
  })

  it('Should accept commands meant for the currently viewed event', () => {
    const playerStore = usePlayerStore()
    const eventStore = useEventStore()
    
    // Admin is viewing Event A
    eventStore.selectedEvent = { 
      id: 'Event-A',
      name: 'Event A',
      createdAt: '',
      performances: [],
      breaks: []
    }

    // Performer A sends a play command for Event A
    socketOnCallback({
      eventId: 'Event-A',
      action: 'play'
    })

    // The player state SHOULD update
    expect(playerStore.playState.currentEventId).toBe('Event-A')
  })
})
