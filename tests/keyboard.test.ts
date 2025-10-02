import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HomeView from '@/views/HomeView.vue'
import { usePlayerStore } from '@/stores/player'

describe('Keyboard Controls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock all required components
    vi.mock('@/components/PerformanceInfo.vue', () => ({
      default: { template: '<div>PerformanceInfo</div>' }
    }))
    vi.mock('@/components/MediaPlayer.vue', () => ({
      default: { template: '<div>MediaPlayer</div>' }
    }))
    vi.mock('@/components/AddPerformanceForm.vue', () => ({
      default: { template: '<div>AddPerformanceForm</div>' }
    }))
    vi.mock('@/components/PerformanceList.vue', () => ({
      default: { template: '<div>PerformanceList</div>' }
    }))
  })

  it('handles space key for play/pause when not in input field', async () => {
    const wrapper = mount(HomeView)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'handleSpaceKey')

    // Simulate space key press
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })

    document.dispatchEvent(event)

    expect(playerStore.handleSpaceKey).toHaveBeenCalled()
  })

  it('ignores space key when input field is focused', async () => {
    const wrapper = mount(HomeView)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'handleSpaceKey')

    // Create and focus an input element
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    // Simulate space key press
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })

    document.dispatchEvent(event)

    expect(playerStore.handleSpaceKey).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(input)
  })

  it('ignores space key when textarea is focused', async () => {
    const wrapper = mount(HomeView)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'handleSpaceKey')

    // Create and focus a textarea element
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    // Simulate space key press
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })

    document.dispatchEvent(event)

    expect(playerStore.handleSpaceKey).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(textarea)
  })

  it('ignores space key when contenteditable element is focused', async () => {
    const wrapper = mount(HomeView)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'handleSpaceKey')

    // Create and focus a contenteditable element
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    document.body.appendChild(div)
    div.focus()

    // Simulate space key press
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })

    document.dispatchEvent(event)

    expect(playerStore.handleSpaceKey).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(div)
  })

  it('ignores non-space keys', async () => {
    const wrapper = mount(HomeView)
    const playerStore = usePlayerStore()

    vi.spyOn(playerStore, 'handleSpaceKey')

    // Simulate other key presses
    const keys = ['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'Tab']

    for (const key of keys) {
      const event = new KeyboardEvent('keydown', {
        code: key,
        key: key,
        bubbles: true
      })

      document.dispatchEvent(event)
    }

    expect(playerStore.handleSpaceKey).not.toHaveBeenCalled()
  })

  it('prevents default behavior for space key when handling it', async () => {
    const wrapper = mount(HomeView)

    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
      cancelable: true
    })

    vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const wrapper = mount(HomeView)

    vi.spyOn(document, 'removeEventListener')

    wrapper.unmount()

    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})