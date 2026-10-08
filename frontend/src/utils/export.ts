import type { Event, Performance, Break } from '@/types'

// Type badge style helpers for HTML export
function getTypeColors(type: string): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    Song: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd' },
    Dance: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#f9a8d4' },
    Recitation: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe' },
    Break: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#fde047' },
  }
  return map[type] || { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)', text: '#d1d5db' }
}

function getModeColors(mode: string): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    Solo: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },
    Duet: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fcd34d' },
    Group: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' },
    Lunch: { bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.4)', text: '#5eead4' },
    Dinner: { bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.4)', text: '#fdba74' },
    Broadcast: { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', text: '#a5b4fc' },
    Announcement: { bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)', text: '#f0abfc' },
    Appearence: { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: '#7dd3fc' },
    'Special Show': { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)', text: '#fdba74' },
  }
  return map[mode] || { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)', text: '#9ca3af' }
}

export interface UnifiedExportItem {
  id: string
  code?: string
  name: string
  performer?: string
  type: string // 'Song' | 'Dance' | 'Recitation' | 'Break' | custom
  mode: string // 'Solo' | 'Duet' | 'Group' | 'Lunch' | 'Announcement' etc.
  isDone: boolean
  order: number
  expectedDuration?: number
  resolvedDuration?: number
  tracks?: Array<{
    id?: string
    filename: string
    performer?: string
    duration?: number
    isCompleted?: boolean
  }>
  isBreak: boolean
}

export function buildUnifiedExportItems(performances: Performance[], breaks: Break[] = []): UnifiedExportItem[] {
  const items: UnifiedExportItem[] = []

  for (const p of performances) {
    const isBreak = p.type === 'Break'
    items.push({
      id: p.id,
      code: p.code,
      name: p.name,
      performer: p.performer,
      type: p.type || (isBreak ? 'Break' : 'Song'),
      mode: p.mode || (isBreak ? 'Announcement' : 'Solo'),
      isDone: Boolean(p.isDone),
      order: p.order,
      expectedDuration: p.expectedDuration,
      resolvedDuration: p.resolvedDuration,
      tracks: p.tracks,
      isBreak,
    })
  }

  // Include legacy breaks if present and not already duplicated
  const perfIds = new Set(performances.map(p => p.id))
  for (const b of breaks) {
    if (!perfIds.has(b.id)) {
      items.push({
        id: b.id,
        code: b.code,
        name: b.name,
        performer: '',
        type: 'Break',
        mode: b.type || 'Break',
        isDone: Boolean(b.isDone),
        order: b.order,
        expectedDuration: b.expectedDuration,
        tracks: [],
        isBreak: true,
      })
    }
  }

  return items.sort((a, b) => a.order - b.order)
}

export function generateEventProgramHtml(event: Event, performances: Performance[], breaks: Break[] = []): string {
  const allItems = buildUnifiedExportItems(performances, breaks)

  const totalDuration = allItems.reduce((sum, item) => sum + (item.expectedDuration || 0), 0)
  const completedDuration = allItems.filter(item => item.isDone).reduce((sum, item) => sum + (item.expectedDuration || 0), 0)

  // Calculate type distribution
  const typeCounts: Record<string, number> = {}
  allItems.forEach(i => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
  })
  const typeSummary = Object.entries(typeCounts)
    .map(([t, count]) => `${count} ${t}${count !== 1 ? 's' : ''}`)
    .join(', ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.name} - Performance Program</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
            color: #f9fafb;
            min-height: 100vh;
            line-height: 1.5;
            padding: 1.5rem 1rem;
        }
        .container { max-width: 860px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #1f2937 0%, #1e293b 100%);
            border: 1px solid rgba(75, 85, 99, 0.4);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1.25rem;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
        }
        .title {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.25rem;
            color: #10b981;
            letter-spacing: -0.02em;
        }
        .subtitle { color: #d1d5db; font-size: 0.9rem; margin-bottom: 0.75rem; }
        .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            color: #9ca3af;
            font-size: 0.8rem;
        }
        .meta-item { display: flex; align-items: center; gap: 0.35rem; }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
            margin-bottom: 1.25rem;
        }
        .stat-card {
            background: rgba(31, 41, 55, 0.6);
            border: 1px solid rgba(75, 85, 99, 0.35);
            border-radius: 0.5rem;
            padding: 0.85rem;
            text-align: center;
        }
        .stat-number {
            font-size: 1.4rem;
            font-weight: 800;
            color: #10b981;
            margin-bottom: 0.15rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .stat-label { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .program-list {
            background: rgba(31, 41, 55, 0.4);
            border: 1px solid rgba(75, 85, 99, 0.3);
            border-radius: 0.75rem;
            overflow: hidden;
        }
        .item {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgba(75, 85, 99, 0.25);
            display: flex;
            align-items: flex-start;
            gap: 1rem;
        }
        .item:last-child { border-bottom: none; }
        .item-break { background: rgba(245, 158, 11, 0.04); }
        .item-number {
            font-size: 0.85rem;
            font-weight: 700;
            color: #6b7280;
            min-width: 1.75rem;
            padding-top: 0.15rem;
            font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .item-content { flex: 1; min-width: 0; }
        .item-title {
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 0.2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .code-badge {
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-weight: 800;
            font-size: 0.85rem;
            padding: 0.15rem 0.45rem;
            border-radius: 0.3rem;
            letter-spacing: 0.05em;
        }
        .code-perf {
            color: #10b981;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .code-break {
            color: #f59e0b;
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .item-performer { color: #d1d5db; font-size: 0.85rem; margin-bottom: 0.4rem; }
        .item-details {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 0.35rem;
        }
        .badge {
            padding: 0.15rem 0.55rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
            border-width: 1px;
            border-style: solid;
        }
        .badge-completed { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.3); }
        .badge-pending { background: rgba(107, 114, 128, 0.2); color: #9ca3af; border-color: rgba(107, 114, 128, 0.4); }
        .duration {
            color: #e5e7eb;
            font-weight: 600;
            font-size: 0.72rem;
            font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .tracks {
            margin-top: 0.5rem;
            padding-left: 0.75rem;
            border-left: 2px solid rgba(75, 85, 99, 0.4);
        }
        .track {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.2rem;
            font-size: 0.75rem;
            color: #d1d5db;
        }
        .track-status { font-weight: bold; }
        .track-completed { color: #10b981; }
        .track-pending { color: #9ca3af; }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #6b7280;
            font-size: 0.75rem;
        }
        @media print {
            body { background: white; color: black; padding: 0; }
            .header { background: #f3f4f6; border-color: #e5e7eb; box-shadow: none; }
            .title { color: #047857; }
            .subtitle { color: #4b5563; }
            .stat-card { background: #f9fafb; border-color: #e5e7eb; }
            .stat-number { color: #047857; }
            .program-list { background: white; border-color: #e5e7eb; }
            .item { border-bottom-color: #e5e7eb; }
            .item-performer { color: #4b5563; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${event.name}</h1>
            ${event.description ? `<p class="subtitle">${event.description}</p>` : ''}
            <div class="meta">
                <span class="meta-item">📅 ${new Date(event.createdAt).toLocaleDateString()}</span>
                <span class="meta-item">📊 ${allItems.length} items (${typeSummary || 'no items'})</span>
                <span class="meta-item">⏱️ ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m total expected</span>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${allItems.length}</div>
                <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${allItems.filter(i => !i.isBreak).length}</div>
                <div class="stat-label">Performances</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${allItems.filter(i => i.isDone).length}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${allItems.length > 0 ? Math.round((allItems.filter(i => i.isDone).length / allItems.length) * 100) : 0}%</div>
                <div class="stat-label">Progress</div>
            </div>
        </div>

        <div class="program-list">
            ${allItems.map((item, index) => {
              const typeCol = getTypeColors(item.type)
              const modeCol = getModeColors(item.mode)

              const durationText = item.expectedDuration
                ? item.expectedDuration >= 60
                  ? `${Math.floor(item.expectedDuration / 60)}h ${item.expectedDuration % 60}m`
                  : `${item.expectedDuration}m`
                : item.resolvedDuration
                  ? `${Math.floor(item.resolvedDuration / 60)}m ${item.resolvedDuration % 60}s`
                  : ''

              return `
              <div class="item ${item.isBreak ? 'item-break' : ''}">
                <div class="item-number">#${index + 1}</div>
                <div class="item-content">
                  <div class="item-title">
                    ${item.code ? `<span class="code-badge ${item.isBreak ? 'code-break' : 'code-perf'}">[${item.code}]</span>` : ''}
                    <span>${item.name}</span>
                  </div>
                  ${item.performer ? `<div class="item-performer">by ${item.performer}</div>` : ''}
                  
                  <div class="item-details">
                    <!-- Performance Type Badge (Song / Dance / Recitation / Break) -->
                    <span class="badge" style="background-color: ${typeCol.bg}; border-color: ${typeCol.border}; color: ${typeCol.text}; text-transform: uppercase;">
                      ${item.type}
                    </span>

                    <!-- Performance Mode Badge (Solo / Duet / Group / Lunch / etc.) -->
                    <span class="badge" style="background-color: ${modeCol.bg}; border-color: ${modeCol.border}; color: ${modeCol.text};">
                      ${item.mode}
                    </span>

                    <!-- Completion Status -->
                    <span class="badge ${item.isDone ? 'badge-completed' : 'badge-pending'}">
                      ${item.isDone ? '✓ COMPLETED' : '○ PENDING'}
                    </span>

                    ${durationText ? `<span class="duration">⏱️ ${durationText}</span>` : ''}
                  </div>

                  ${item.tracks && item.tracks.length > 0 ? `
                    <div class="tracks">
                      ${item.tracks.map(track => `
                        <div class="track">
                          <span class="track-status ${track.isCompleted ? 'track-completed' : 'track-pending'}">
                            ${track.isCompleted ? '✓' : '○'}
                          </span>
                          <span>${track.filename}</span>
                          ${track.duration ? `<span style="color: #9ca3af; font-family: ui-monospace, monospace;">(${Math.floor(track.duration / 60)}m ${track.duration % 60}s)</span>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>`
            }).join('')}
        </div>

        <div class="footer">
            <p>Generated by Performance Manager • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
    </div>
</body>
</html>`
}

export function downloadEventProgram(event: Event, performances: Performance[], breaks: Break[] = []) {
  const html = generateEventProgramHtml(event, performances, breaks)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_program.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadEventJson(event: Event, performances: Performance[]) {
  // Sort strictly by order
  const sorted = [...performances].sort((a, b) => a.order - b.order)
  const exportData = sorted.map((p, idx) => ({
    code: p.code,
    name: p.name,
    performer: p.performer || '',
    type: p.type || 'Song',
    mode: p.mode || 'Solo',
    expectedDuration: p.expectedDuration,
    resolvedDuration: p.resolvedDuration,
    order: idx,
    isDone: Boolean(p.isDone),
    tracks: (p.tracks || []).map(t => ({
      filename: t.filename,
      performer: t.performer || p.performer || '',
      duration: t.duration,
      isCompleted: Boolean(t.isCompleted),
    })),
  }))

  const jsonStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_performances.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
