import { describe, it, expect } from 'vitest'
import { buildUnifiedExportItems, generateEventProgramHtml } from '@/utils/export'
import type { Event, Performance, Break } from '@/types'

describe('Export Utility', () => {
  const dummyEvent: Event = {
    id: 'evt-1',
    name: 'Durga Puja 2026',
    description: 'Cultural Festival',
    createdAt: '2026-10-08T12:00:00Z',
    performances: [],
    breaks: []
  }

  const dummyPerformances: Performance[] = [
    {
      id: 'p1',
      code: 'JG1',
      name: 'Dhak Baja',
      performer: 'Jayita Group',
      type: 'Song',
      mode: 'Group',
      isDone: false,
      order: 0,
      createdAt: '2026-10-08T12:00:00Z',
      tracks: []
    },
    {
      id: 'p2',
      code: 'ID1',
      name: 'Gayatri Mantra',
      performer: 'Ishani',
      type: 'Dance',
      mode: 'Solo',
      isDone: true,
      order: 1,
      createdAt: '2026-10-08T12:05:00Z',
      tracks: []
    },
    {
      id: 'p3',
      code: 'BK1',
      name: 'Tea Break',
      performer: '',
      type: 'Break',
      mode: 'Announcement',
      isDone: false,
      order: 2,
      createdAt: '2026-10-08T12:10:00Z',
      tracks: []
    }
  ]

  it('buildUnifiedExportItems preserves exact performance types and order', () => {
    const items = buildUnifiedExportItems(dummyPerformances)
    expect(items).toHaveLength(3)
    expect(items[0].type).toBe('Song')
    expect(items[0].mode).toBe('Group')
    expect(items[1].type).toBe('Dance')
    expect(items[1].mode).toBe('Solo')
    expect(items[2].type).toBe('Break')
    expect(items[2].mode).toBe('Announcement')
  })

  it('generateEventProgramHtml contains performance types and codes in the output', () => {
    const html = generateEventProgramHtml(dummyEvent, dummyPerformances)
    expect(html).toContain('Durga Puja 2026')
    expect(html).toContain('[JG1]')
    expect(html).toContain('Song')
    expect(html).toContain('Dance')
    expect(html).toContain('Break')
    expect(html).toContain('Announcement')
  })
})
