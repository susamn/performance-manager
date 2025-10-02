import { beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock HTMLAudioElement
global.HTMLAudioElement = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  paused: true,
  ended: false
}))

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  fetch.mockClear?.()
})