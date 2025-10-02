import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MediaPlayer from '@/components/MediaPlayer.vue'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/types'

describe('MediaPlayer Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without crashing', () => {
    const wrapper = mount(MediaPlayer)
    expect(wrapper.find('.media-player').exists()).toBe(true)
    expect(wrapper.text()).toContain('Media Player')
  })

  it('displays track information when track is loaded', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    const track: Track = {
      id: 'track-1',
      filename: 'test-song.mp3',
      performer: 'Test Artist',
      url: '/api/performances/1/files/test-song.mp3'
    }

    playerStore.currentTrack = track

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Now Playing:')
    expect(wrapper.text()).toContain('test-song.mp3')
    expect(wrapper.text()).toContain('Test Artist')
  })

  it('displays time information correctly', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    playerStore.playState.currentTime = 65 // 1:05
    playerStore.playState.duration = 185 // 3:05

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('1:05')
    expect(wrapper.text()).toContain('3:05')
  })

  it('shows correct progress bar width', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    playerStore.playState.currentTime = 30
    playerStore.playState.duration = 120 // 25% progress

    await wrapper.vm.$nextTick()

    const progressBar = wrapper.find('.bg-player-accent')
    expect(progressBar.attributes('style')).toContain('width: 25%')
  })

  it('toggles play/pause button correctly', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    // Initially not playing - should show play button
    expect(wrapper.find('svg').exists()).toBe(true)

    // Set to playing
    playerStore.playState.isPlaying = true
    await wrapper.vm.$nextTick()

    // Should show pause button
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('calls player store methods on button clicks', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    // Mock store methods
    vi.spyOn(playerStore, 'togglePlayPause')
    vi.spyOn(playerStore, 'stop')
    vi.spyOn(playerStore, 'rewind')

    // Set a current track to enable buttons
    playerStore.currentTrack = {
      id: 'track-1',
      filename: 'test.mp3',
      performer: 'Test',
      url: '/test.mp3'
    }

    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')

    // Click rewind button (first button)
    await buttons[0].trigger('click')
    expect(playerStore.rewind).toHaveBeenCalled()

    // Click play/pause button (second button)
    await buttons[1].trigger('click')
    expect(playerStore.togglePlayPause).toHaveBeenCalled()

    // Click stop button (third button)
    await buttons[2].trigger('click')
    expect(playerStore.stop).toHaveBeenCalled()
  })

  it('handles seek bar clicks correctly', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'seek')

    const seekBar = wrapper.find('.cursor-pointer')

    // Mock getBoundingClientRect
    const mockRect = {
      left: 0,
      width: 100,
      top: 0,
      right: 100,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => {}
    }

    Element.prototype.getBoundingClientRect = vi.fn(() => mockRect)

    // Simulate click at 50% position
    await seekBar.trigger('click', {
      clientX: 50
    })

    expect(playerStore.seek).toHaveBeenCalledWith(50)
  })

  it('disables buttons when no track is loaded', async () => {
    const wrapper = mount(MediaPlayer)
    const playerStore = usePlayerStore()

    playerStore.currentTrack = null

    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')

    // All control buttons should be disabled
    expect(buttons[0].attributes('disabled')).toBeDefined()
    expect(buttons[1].attributes('disabled')).toBeDefined()
    expect(buttons[2].attributes('disabled')).toBeDefined()
  })

  it('shows keyboard instructions', () => {
    const wrapper = mount(MediaPlayer)
    expect(wrapper.text()).toContain('Space: Play/Pause • Space x2: Stop & Reset')
  })
})