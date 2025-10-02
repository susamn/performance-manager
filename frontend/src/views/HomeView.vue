<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-white">Performance Manager</h1>
        <p class="text-gray-400 mt-1">Manage your events and performances</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Sidebar - Add Event Form -->
        <div class="lg:col-span-1">
          <AddEventForm @event-created="onEventCreated" />
        </div>

        <!-- Main Event List -->
        <div class="lg:col-span-3">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white mb-4">Events</h2>
          </div>

          <div v-if="isLoading" class="text-center py-8">
            <p class="text-gray-400">Loading events...</p>
          </div>

          <div v-else-if="sortedEvents.length === 0" class="text-center py-8">
            <p class="text-gray-400">No events created yet. Create your first event!</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EventCard
              v-for="event in sortedEvents"
              :key="event.id"
              :event="event"
              :performance-count="getEventPerformanceCount(event)"
              @select="selectEvent"
              @delete="deleteEvent"
              @download="downloadEventPDF"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import AddEventForm from '@/components/AddEventForm.vue'
import EventCard from '@/components/EventCard.vue'
import type { Event, Performance, Break } from '@/types'

const router = useRouter()
const eventStore = useEventStore()

const isLoading = computed(() => eventStore.isLoading)
const sortedEvents = computed(() => eventStore.sortedEvents)

onMounted(() => {
  eventStore.loadEvents()
})

async function onEventCreated(event: Event) {
  await eventStore.loadEvents()
  // Auto-navigate to the newly created event
  router.push(`/events/${event.id}`)
}

function selectEvent(event: Event) {
  router.push(`/events/${event.id}`)
}

async function deleteEvent(event: Event) {
  if (confirm(`Are you sure you want to delete "${event.name}"? This will delete all performances and tracks within this event.`)) {
    try {
      await eventStore.deleteEvent(event.id)
    } catch (error) {
      alert('Failed to delete event. Please try again.')
    }
  }
}

function getEventPerformanceCount(event: Event): number {
  // Get the count from the event's performanceCount property if available
  return (event as any).performanceCount || 0
}

async function downloadEventPDF(event: Event) {
  try {
    // Fetch event details with performances and breaks
    const [performancesRes, breaksRes] = await Promise.all([
      fetch(`/api/events/${event.id}/performances`),
      fetch(`/api/events/${event.id}/breaks`)
    ])

    const performances: Performance[] = performancesRes.ok ? await performancesRes.json() : []
    const breaks: Break[] = breaksRes.ok ? await breaksRes.json() : []

    // Combine and sort by order
    const allItems = [
      ...performances.map(p => ({ ...p, type: 'performance' as const })),
      ...breaks.map(b => ({ ...b, type: 'break' as const }))
    ].sort((a, b) => a.order - b.order)

    // Calculate totals
    const totalDuration = allItems.reduce((sum, item) => sum + (item.expectedDuration || 0), 0)
    const completedDuration = allItems.filter(item => item.isDone).reduce((sum, item) => sum + (item.expectedDuration || 0), 0)

    // Create beautiful HTML report
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.name} - Performance Program</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            color: #f9fafb;
            min-height: 100vh;
            line-height: 1.6;
        }
        .container { max-width: 700px; margin: 0 auto; padding: 1rem; }
        .header {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle { color: #d1d5db; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .meta {
            display: flex;
            gap: 1rem;
            color: #9ca3af;
            font-size: 0.7rem;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .stat-card {
            background: rgba(55, 65, 81, 0.5);
            border: 1px solid rgba(75, 85, 99, 0.3);
            border-radius: 0.5rem;
            padding: 0.75rem;
            text-align: center;
        }
        .stat-number {
            font-size: 1.25rem;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 0.25rem;
        }
        .stat-label { color: #9ca3af; font-size: 0.7rem; }
        .program-list { background: rgba(55, 65, 81, 0.3); border-radius: 0.5rem; overflow: hidden; }
        .item {
            padding: 0.75rem;
            border-bottom: 1px solid rgba(75, 85, 99, 0.2);
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            transition: background 0.2s;
        }
        .item:hover { background: rgba(75, 85, 99, 0.2); }
        .item:last-child { border-bottom: none; }
        .item-number {
            font-size: 0.8rem;
            font-weight: bold;
            color: #6b7280;
            min-width: 1.5rem;
            margin-top: 0.1rem;
        }
        .item-content { flex: 1; }
        .item-title {
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.1rem;
            line-height: 1.2;
        }
        .performance-title { color: #f9fafb; }
        .break-title { color: #a78bfa; }
        .item-performer { color: #d1d5db; font-size: 0.75rem; margin-bottom: 0.25rem; }
        .item-details {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-wrap: wrap;
        }
        .badge {
            padding: 0.15rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.65rem;
            font-weight: 500;
        }
        .badge-completed { background: #065f46; color: #6ee7b7; }
        .badge-pending { background: #374151; color: #9ca3af; }
        .badge-break { background: #581c87; color: #c4b5fd; }
        .duration { color: #10b981; font-weight: 500; font-size: 0.7rem; }
        .tracks {
            margin-top: 0.4rem;
            padding-left: 0.75rem;
            border-left: 2px solid rgba(75, 85, 99, 0.3);
        }
        .track {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 0.1rem;
            font-size: 0.7rem;
            color: #d1d5db;
            line-height: 1.2;
        }
        .track-status { font-size: 0.7rem; }
        .track-completed { color: #10b981; }
        .track-pending { color: #9ca3af; }
        .footer {
            text-align: center;
            margin-top: 1.5rem;
            color: #6b7280;
            font-size: 0.65rem;
        }
        @media print {
            body { background: white; color: black; }
            .header { background: #f3f4f6; }
            .title { -webkit-text-fill-color: #059669; }
            .program-list { background: #f9fafb; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${event.name}</h1>
            ${event.description ? `<p class="subtitle">${event.description}</p>` : ''}
            <div class="meta">
                <span>📅 ${new Date(event.createdAt).toLocaleDateString()}</span>
                <span>📊 ${allItems.length} items</span>
                <span>⏱️ ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m total</span>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${allItems.filter(i => i.type === 'performance').length}</div>
                <div class="stat-label">Performances</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${allItems.filter(i => i.type === 'break').length}</div>
                <div class="stat-label">Breaks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${allItems.filter(i => i.isDone).length}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round((completedDuration / totalDuration) * 100) || 0}%</div>
                <div class="stat-label">Progress</div>
            </div>
        </div>

        <div class="program-list">
            ${allItems.map((item, index) => {
              if (item.type === 'performance') {
                const performance = item as any as Performance
                const duration = performance.expectedDuration ?
                  performance.expectedDuration >= 60 ?
                    `${Math.floor(performance.expectedDuration / 60)}h ${performance.expectedDuration % 60}m` :
                    `${performance.expectedDuration}m` : ''

                return `
                  <div class="item">
                    <div class="item-number">${index + 1}</div>
                    <div class="item-content">
                      <div class="item-title performance-title">${performance.name}</div>
                      <div class="item-performer">by ${performance.performer}</div>
                      <div class="item-details">
                        <span class="badge ${performance.isDone ? 'badge-completed' : 'badge-pending'}">
                          ${performance.isDone ? '✓ COMPLETED' : '○ PENDING'}
                        </span>
                        ${duration ? `<span class="duration">${duration}</span>` : ''}
                        <span style="color: #9ca3af; font-size: 0.65rem;">${performance.type} • ${performance.mode}</span>
                      </div>
                      ${performance.tracks && performance.tracks.length > 0 ? `
                        <div class="tracks">
                          ${performance.tracks.map((track: any) => `
                            <div class="track">
                              <span class="track-status ${track.isCompleted ? 'track-completed' : 'track-pending'}">
                                ${track.isCompleted ? '✓' : '○'}
                              </span>
                              <span>${track.filename}</span>
                            </div>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `
              } else {
                const breakItem = item as any as Break
                const duration = breakItem.expectedDuration ?
                  breakItem.expectedDuration >= 60 ?
                    `${Math.floor(breakItem.expectedDuration / 60)}h ${breakItem.expectedDuration % 60}m` :
                    `${breakItem.expectedDuration}m` : ''

                return `
                  <div class="item">
                    <div class="item-number">${index + 1}</div>
                    <div class="item-content">
                      <div class="item-title break-title">🔄 ${breakItem.name}</div>
                      <div class="item-details">
                        <span class="badge ${breakItem.isDone ? 'badge-completed' : 'badge-break'}">
                          ${breakItem.isDone ? '✓ COMPLETED' : '⏸ BREAK'}
                        </span>
                        ${duration ? `<span class="duration">${duration}</span>` : ''}
                      </div>
                    </div>
                  </div>
                `
              }
            }).join('')}
        </div>

        <div class="footer">
            <p>Generated by Performance Manager • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
    </div>
</body>
</html>`

    // Create and download HTML file
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_program.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Error generating HTML report:', error)
    alert('Failed to generate report. Please try again.')
  }
}
</script>