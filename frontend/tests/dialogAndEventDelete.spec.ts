import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDialogStore } from '@/stores/dialog'
import { useEventStore } from '@/stores/event'

describe('Dialog Store & Event Deletion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('handles alert dialog flow', async () => {
    const dialogStore = useDialogStore()
    expect(dialogStore.isOpen).toBe(false)

    const alertPromise = dialogStore.alert('Something happened', 'Notice', 'info')
    expect(dialogStore.isOpen).toBe(true)
    expect(dialogStore.options.title).toBe('Notice')
    expect(dialogStore.options.message).toBe('Something happened')

    dialogStore.handleConfirm()
    await alertPromise
    expect(dialogStore.isOpen).toBe(false)
  })

  it('handles confirm dialog flow - accepted', async () => {
    const dialogStore = useDialogStore()
    const confirmPromise = dialogStore.confirm('Are you sure?', 'Delete Item', { danger: true })

    expect(dialogStore.isOpen).toBe(true)
    expect(dialogStore.options.confirmText).toBe('Confirm')

    dialogStore.handleConfirm()
    const result = await confirmPromise
    expect(result).toBe(true)
    expect(dialogStore.isOpen).toBe(false)
  })

  it('handles confirm dialog flow - cancelled', async () => {
    const dialogStore = useDialogStore()
    const confirmPromise = dialogStore.confirm('Are you sure?', 'Delete Item')

    expect(dialogStore.isOpen).toBe(true)

    dialogStore.handleCancel()
    const result = await confirmPromise
    expect(result).toBe(false)
    expect(dialogStore.isOpen).toBe(false)
  })

  it('sends unlockCode in body when deleteEvent is called with a PIN', async () => {
    const eventStore = useEventStore()
    eventStore.events = [
      {
        id: 'event-123',
        name: 'Fest',
        createdAt: new Date().toISOString(),
        performances: [],
        breaks: [],
        unlockCode: '1111',
        livePin: '2222'
      }
    ]

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204
    })
    globalThis.fetch = fetchMock

    await eventStore.deleteEvent('event-123', '1111')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/event-123',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ unlockCode: '1111' })
      })
    )
    expect(eventStore.events.length).toBe(0)
  })
})
