import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayState, Track } from '@/types'
import { socket } from '@/socket'
import { useEventStore } from '@/stores/event'

// MPD plays on the server machine. The browser is a remote control only.
export const usePlayerStore = defineStore('player', () => {
  const playState = ref<PlayState>({ isPlaying: false, currentTime: 0, duration: 0 })
  const currentTrack = ref<Track | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const continuousPlayPerformances = ref<Set<string>>(new Set())

  const formattedCurrentTime = computed(() => formatTime(playState.value.currentTime))
  const formattedDuration = computed(() => formatTime(playState.value.duration))
  const progress = computed(() => playState.value.duration > 0
    ? Math.min(100, playState.value.currentTime / playState.value.duration * 100) : 0)

  function formatTime(seconds: number): string {
    const minutes = Math.floor((seconds || 0) / 60)
    const secs = Math.floor((seconds || 0) % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  function isContinuousPlay(performanceId: string) {
    return continuousPlayPerformances.value.has(performanceId)
  }

  function setContinuousPlay(performanceId: string, enabled: boolean) {
    const updated = new Set(continuousPlayPerformances.value)
    if (enabled) updated.add(performanceId)
    else updated.delete(performanceId)
    continuousPlayPerformances.value = updated
    if (playState.value.currentPerformanceId === performanceId && playState.value.currentEventId) {
      void send('continuous', { performanceId, enabled })
    }
  }

  function toggleContinuousPlay(performanceId: string) {
    setContinuousPlay(performanceId, !isContinuousPlay(performanceId))
  }

  function applyPlayState(state: PlayState) {
    if (state.currentEventId !== playState.value.currentEventId) return
    playState.value = state
    if (!state.currentTrackId) currentTrack.value = null
    else if (state.currentTrackId !== currentTrack.value?.id) {
      const eventStore = useEventStore()
      currentTrack.value = eventStore.eventPerformances
        .flatMap(p => p.tracks || []).find(t => t.id === state.currentTrackId) || null
    }
  }

  function applyResponse(data: any) {
    if (data.eventId !== playState.value.currentEventId) return
    playState.value = data.playState
    currentTrack.value = data.track || null
    if (data.continuous && data.playState.currentPerformanceId) {
      const updated = new Set(continuousPlayPerformances.value)
      updated.add(data.playState.currentPerformanceId)
      continuousPlayPerformances.value = updated
    }
    error.value = data.error || ''
  }

  socket.on('play_state_updated', (data: { eventId: string; playState: PlayState; error?: string }) => {
    if (data.eventId === playState.value.currentEventId) {
      applyPlayState(data.playState)
      error.value = data.error || ''
    }
  })
  socket.on('player_error', (data: { error: string }) => { error.value = data.error })

  async function initialize(eventId: string) {
    playState.value.currentEventId = eventId
    try {
      const response = await fetch(`/api/events/${eventId}/player/state`)
      if (!response.ok) throw new Error('Cannot retrieve MPD playback state')
      applyResponse(await response.json())
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function send(endpoint: string, body: Record<string, unknown>) {
    const eventId = playState.value.currentEventId
    if (!eventId) return
    try {
      const response = await fetch(`/api/events/${eventId}/player/${endpoint}`, {
        method: 'POST',
        headers: useEventStore().getAuthHeaders(eventId),
        body: JSON.stringify(body)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'MPD playback command failed')
      applyResponse(data)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function loadTrack(track: Track, _autoPlay = false, performanceId?: string) {
    if (!performanceId || !playState.value.currentEventId) {
      error.value = 'Select a performance before loading a track'
      return
    }
    isLoading.value = true
    error.value = ''
    try {
      await send('load', {
        performanceId, trackId: track.id, continuous: isContinuousPlay(performanceId)
      })
    } finally {
      isLoading.value = false
    }
  }

  function play() { return send('control', { action: 'play' }) }
  function pause() { return send('control', { action: 'pause' }) }
  function stop() { return send('control', { action: 'stop' }) }
  function seek(percentage: number) { return send('control', { action: 'seek', percentage }) }
  function rewind() { return send('control', { action: 'rewind' }) }
  function togglePlayPause() { return playState.value.isPlaying ? pause() : play() }

  let lastSpacePress = 0
  function handleSpaceKey() {
    const now = Date.now()
    const delta = now - lastSpacePress
    lastSpacePress = now
    if (delta < 300) void stop()
    else setTimeout(() => {
      if (Date.now() - lastSpacePress >= 300) void togglePlayPause()
    }, 300)
  }

  return {
    playState, currentTrack, isLoading, error, formattedCurrentTime, formattedDuration,
    progress, continuousPlayPerformances, isContinuousPlay, toggleContinuousPlay,
    setContinuousPlay, initialize, loadTrack, play, pause, stop, seek, rewind,
    togglePlayPause, handleSpaceKey
  }
})
