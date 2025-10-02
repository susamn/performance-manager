import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PerformanceCard from '@/components/PerformanceCard.vue'
import type { Performance, Track } from '@/types'

describe('PerformanceCard Component', () => {
  let mockPerformance: Performance

  beforeEach(() => {
    setActivePinia(createPinia())
    mockPerformance = {
      id: 'perf-1',
      name: 'Test Performance',
      tracks: [
        {
          id: 'track-1',
          filename: 'song1.mp3',
          performer: 'Artist 1',
          url: '/api/performances/perf-1/files/song1.mp3'
        },
        {
          id: 'track-2',
          filename: 'song2.mp3',
          performer: 'Artist 2',
          url: '/api/performances/perf-1/files/song2.mp3'
        }
      ],
      isDone: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      order: 0
    }
  })

  it('renders performance information correctly', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('Test Performance')
    expect(wrapper.text()).toContain('2 tracks')
    expect(wrapper.text()).toContain('Active')
  })

  it('applies selected class when selected', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: true
      }
    })

    expect(wrapper.find('.performance-card').classes()).toContain('selected')
  })

  it('applies done class when performance is done', () => {
    const donePerformance = { ...mockPerformance, isDone: true }
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: donePerformance,
        isSelected: false
      }
    })

    expect(wrapper.find('.performance-card').classes()).toContain('done')
    expect(wrapper.text()).toContain('Completed')
  })

  it('shows correct track count', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('2 tracks')
  })

  it('shows singular track text for one track', () => {
    const singleTrackPerformance = {
      ...mockPerformance,
      tracks: [mockPerformance.tracks[0]]
    }

    const wrapper = mount(PerformanceCard, {
      props: {
        performance: singleTrackPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('1 track')
    expect(wrapper.text()).not.toContain('1 tracks')
  })

  it('displays track list correctly', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('song1.mp3')
    expect(wrapper.text()).toContain('Artist 1')
    expect(wrapper.text()).toContain('song2.mp3')
    expect(wrapper.text()).toContain('Artist 2')
  })

  it('shows empty state when no tracks', () => {
    const emptyPerformance = { ...mockPerformance, tracks: [] }
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: emptyPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('No tracks added yet')
    expect(wrapper.text()).toContain('0 tracks')
  })

  it('emits select event when clicked', async () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    await wrapper.find('.performance-card').trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([mockPerformance])
  })

  it('emits trackSelected event when track is clicked', async () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    const trackButtons = wrapper.findAll('.cursor-pointer')
    await trackButtons[0].trigger('click')

    expect(wrapper.emitted('trackSelected')).toBeTruthy()
    expect(wrapper.emitted('trackSelected')[0]).toEqual([mockPerformance.tracks[0]])
  })

  it('emits toggleDone event when toggle button is clicked', async () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    const toggleButton = wrapper.find('button:not(.drag-handle):not(.text-red-400)')
    await toggleButton.trigger('click')

    expect(wrapper.emitted('toggleDone')).toBeTruthy()
    expect(wrapper.emitted('toggleDone')[0]).toEqual([mockPerformance])
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    const deleteButton = wrapper.find('.text-red-400')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([mockPerformance])
  })

  it('shows correct button text for done/active state', () => {
    // Test active performance
    const activeWrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(activeWrapper.text()).toContain('Mark Done')

    // Test done performance
    const donePerformance = { ...mockPerformance, isDone: true }
    const doneWrapper = mount(PerformanceCard, {
      props: {
        performance: donePerformance,
        isSelected: false
      }
    })

    expect(doneWrapper.text()).toContain('Mark Active')
  })

  it('formats creation date correctly', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(wrapper.text()).toContain('Created: 1/1/2023')
  })

  it('has drag handle for reordering', () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    expect(wrapper.find('.drag-handle').exists()).toBe(true)
  })

  it('prevents event propagation on drag handle click', async () => {
    const wrapper = mount(PerformanceCard, {
      props: {
        performance: mockPerformance,
        isSelected: false
      }
    })

    await wrapper.find('.drag-handle').trigger('click')

    // Should not emit select event when drag handle is clicked
    expect(wrapper.emitted('select')).toBeFalsy()
  })
})