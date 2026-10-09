import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import { Howl } from 'howler'
import type { PlayState, Track } from '@/types'
import { socket } from '@/socket'
import { useEventStore } from '@/stores/event'

export const usePlayerStore = defineStore('player', () => {
  const playState = ref<PlayState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })

  const currentTrack = ref<Track | null>(null)
  // Howler owns mutable HTMLAudioElement internals; Vue must not proxy them.
  const howlInstance = shallowRef<Howl | null>(null)
  const isLoading = ref(false)
  const loadProgress = ref(0)
  
  // Fix #4: Track browser autoplay policy status
  const audioUnlocked = ref(false)
  const autoplayBlocked = ref(false)

  // Continuous play & audio overlap state
  const overlappingHowls: Howl[] = []
  const nextTrackTriggered = ref(false)
  const continuousPlayPerformances = ref<Set<string>>(new Set())

  function isContinuousPlay(performanceId: string): boolean {
    return continuousPlayPerformances.value.has(performanceId)
  }

  function toggleContinuousPlay(performanceId: string) {
    const newSet = new Set(continuousPlayPerformances.value)
    if (newSet.has(performanceId)) {
      newSet.delete(performanceId)
    } else {
      newSet.add(performanceId)
    }
    continuousPlayPerformances.value = newSet
  }

  function setContinuousPlay(performanceId: string, enabled: boolean) {
    const newSet = new Set(continuousPlayPerformances.value)
    if (enabled) {
      newSet.add(performanceId)
    } else {
      newSet.delete(performanceId)
    }
    continuousPlayPerformances.value = newSet
  }

  function cleanupOverlappingHowls() {
    for (const h of overlappingHowls) {
      try {
        if (typeof h.stop === 'function') h.stop()
        if (typeof h.unload === 'function') h.unload()
      } catch (e) {}
    }
    overlappingHowls.length = 0
  }

  // One-time listener to unlock audio state
  const unlockAudio = () => {
    audioUnlocked.value = true
    autoplayBlocked.value = false
    document.removeEventListener('click', unlockAudio)
    document.removeEventListener('touchstart', unlockAudio)
  }
  document.addEventListener('click', unlockAudio)
  document.addEventListener('touchstart', unlockAudio)

  // Listen for performer commands
  socket.on('admin_receive_command', (cmd: any) => {
    console.log('Received command from performer:', cmd)
    const eventStore = useEventStore()
    
    // CRITICAL FIX: Only process commands meant for the event currently opened in the admin dashboard
    if (!cmd.eventId || !eventStore.selectedEvent || cmd.eventId !== eventStore.selectedEvent.id) {
      console.warn(`Ignored command for event ${cmd.eventId} (currently viewing ${eventStore.selectedEvent?.id})`)
      return
    }

    playState.value.currentEventId = cmd.eventId
    
    if (cmd.action === 'play') play()
    if (cmd.action === 'pause') pause()
    if (cmd.action === 'stop') stop()
    if (cmd.action === 'seek' && typeof cmd.percentage === 'number') seek(cmd.percentage)
    if (cmd.action === 'loadTrack' && cmd.track) {
      loadTrack(cmd.track)
    }
  })

  function broadcastState() {
    if (playState.value.currentEventId) {
      socket.emit('admin_update_play_state', {
        eventId: playState.value.currentEventId,
        playState: playState.value
      })
    }
  }

  const formattedCurrentTime = computed(() => formatTime(playState.value.currentTime))
  const formattedDuration = computed(() => formatTime(playState.value.duration))
  const progress = computed(() =>
    playState.value.duration > 0 ? (playState.value.currentTime / playState.value.duration) * 100 : 0
  )
  const formattedLoadProgress = computed(() => `${Math.round(loadProgress.value)}%`)

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function cleanupHowl() {
    if (howlInstance.value) {
      try {
        if (typeof howlInstance.value.unload === 'function') {
          howlInstance.value.unload()
        }
      } catch (e) {}
      howlInstance.value = null
    }
  }

  function getNextTrackInPerformance(): Track | null {
    const perfId = playState.value.currentPerformanceId
    if (!perfId || !currentTrack.value) return null

    const eventStore = useEventStore()
    const performance = eventStore.eventPerformances.find(p => p.id === perfId)
    if (!performance || !performance.tracks || performance.tracks.length === 0) return null

    const currentIndex = performance.tracks.findIndex(t => t.id === currentTrack.value?.id)
    if (currentIndex === -1) {
      return performance.tracks[0]
    }
    // Loop back to the first track if we are at or past the last track
    if (currentIndex + 1 >= performance.tracks.length) {
      return performance.tracks[0]
    }

    return performance.tracks[currentIndex + 1]
  }

  function triggerNextTrack() {
    nextTrackTriggered.value = true
    const nextTrack = getNextTrackInPerformance()
    if (!nextTrack) {
      return
    }

    const eventId = playState.value.currentEventId || useEventStore().selectedEvent?.id
    const perfId = playState.value.currentPerformanceId
    let nextUrl = nextTrack.url || ''
    if (eventId && nextUrl.includes('/api/performances/')) {
      nextUrl = nextUrl.replace('/api/performances/', `/api/events/${eventId}/performances/`)
    } else if (!nextUrl && eventId && perfId) {
      nextUrl = `/api/events/${eventId}/performances/${perfId}/files/${encodeURIComponent(nextTrack.filename)}`
    }

    const nextTrackWithUrl: Track = {
      ...nextTrack,
      url: nextUrl
    }

    loadTrack(nextTrackWithUrl, true, perfId, true)
  }

  function loadTrack(
    track: Track,
    autoPlay: boolean = false,
    performanceId?: string,
    isOverlap: boolean = false
  ) {
    if (!track.url) return

    if (!isOverlap) {
      cleanupOverlappingHowls()
      cleanupHowl()
    } else if (howlInstance.value) {
      const oldHowl = howlInstance.value
      if (typeof oldHowl.off === 'function') {
        oldHowl.off('end')
      }
      overlappingHowls.push(oldHowl)

      // Gracefully fade out oldHowl over 10-second overlap period
      try {
        if (typeof oldHowl.fade === 'function') {
          const currentVol = typeof oldHowl.volume === 'function' ? oldHowl.volume() : 1.0
          oldHowl.fade(currentVol, 0, 10000)
        }
      } catch (e) {}

      let cleanupTimer: ReturnType<typeof setTimeout> | undefined
      const cleanupOld = () => {
        if (!overlappingHowls.includes(oldHowl)) return
        if (cleanupTimer) clearTimeout(cleanupTimer)
        overlappingHowls.splice(overlappingHowls.indexOf(oldHowl), 1)
        oldHowl.unload()
      }

      oldHowl.on('end', cleanupOld)
      // Fallback if the browser never fires 'end'.
      cleanupTimer = setTimeout(cleanupOld, 12000)
    }

    // Reset state
    playState.value.currentTime = 0
    playState.value.duration = track.duration && track.duration > 0 ? track.duration : 0
    playState.value.isPlaying = false
    isLoading.value = true
    loadProgress.value = 0
    nextTrackTriggered.value = false

    currentTrack.value = track
    if (performanceId !== undefined) {
      playState.value.currentPerformanceId = performanceId
    }
    playState.value.currentTrackId = track.id
    
    broadcastState()

    // Create new Howl instance with streaming configuration
    const howl = new Howl({
      src: [track.url],
      html5: true,          // Force HTML5 for streaming
      preload: 'metadata',  // Only load metadata initially
      format: ['mp3', 'mp4', 'aac', 'm4a', 'wav', 'flac', 'wma', 'mpeg', 'ogg', 'opus'],
      volume: 1.0,

      // Event handlers
      onload: () => {
        if (howlInstance.value !== howl) return
        isLoading.value = false
        loadProgress.value = 100
        if (howlInstance.value) {
          const rawDur = typeof howlInstance.value.duration === 'function' ? howlInstance.value.duration() : 0
          if (typeof rawDur === 'number' && !isNaN(rawDur) && rawDur > 0 && isFinite(rawDur)) {
            if (!playState.value.duration || playState.value.duration <= 0) {
              playState.value.duration = rawDur
            }
          }
          broadcastState()
        }
        console.log('Track loaded successfully (streaming ready)')
      },

      onloaderror: (id: number, error: unknown) => {
        if (howlInstance.value !== howl) return
        isLoading.value = false
        console.error('Failed to load track:', error)
      },

      onplayerror: (id: number, error: unknown) => {
        if (howlInstance.value !== howl) return
        isLoading.value = false
        playState.value.isPlaying = false
        stopTimeUpdates()
        console.error('Failed to play track:', error)
      },

      onplay: () => {
        if (howlInstance.value !== howl) return
        playState.value.isPlaying = true
        broadcastState()
        startTimeUpdates()
      },

      onpause: () => {
        if (howlInstance.value !== howl) return
        playState.value.isPlaying = false
        broadcastState()
        stopTimeUpdates()
      },

      onstop: () => {
        if (howlInstance.value !== howl) return
        playState.value.isPlaying = false
        playState.value.currentTime = 0
        broadcastState()
        stopTimeUpdates()
      },

      onend: () => {
        if (howlInstance.value !== howl) return
        const perfId = playState.value.currentPerformanceId
        if (!nextTrackTriggered.value && perfId && isContinuousPlay(perfId)) {
          triggerNextTrack()
        } else {
          playState.value.isPlaying = false
          playState.value.currentTime = 0
          broadcastState()
          stopTimeUpdates()
        }
      },

      onseek: () => {
        if (howlInstance.value !== howl) return
        const position = howl.seek()
        if (typeof position === 'number' && Number.isFinite(position)) {
          playState.value.currentTime = position
          broadcastState()
        }
      }
    })
    howlInstance.value = howl

    if (autoPlay) {
      play()
    }
  }

  // Time update management
  let timeUpdateInterval: number | null = null

  function startTimeUpdates() {
    stopTimeUpdates()
    timeUpdateInterval = setInterval(() => {
      if (howlInstance.value && playState.value.isPlaying) {
        const rawSeek = typeof howlInstance.value.seek === 'function' ? howlInstance.value.seek() : 0
        const currentTime = typeof rawSeek === 'number' && !isNaN(rawSeek) && isFinite(rawSeek) ? rawSeek : 0
        playState.value.currentTime = currentTime
        broadcastState()

        const duration = playState.value.duration
        const perfId = playState.value.currentPerformanceId
        if (perfId && isContinuousPlay(perfId) && duration > 0 && !nextTrackTriggered.value) {
          const overlapSeconds = 10.0
          if (duration > overlapSeconds) {
            if (currentTime >= 1.0 && currentTime >= duration - overlapSeconds) {
              triggerNextTrack()
            }
          }
        }
      }
    }, 100) as any // Update every 100ms for smooth progress
  }

  function stopTimeUpdates() {
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
  }

  function play() {
    audioUnlocked.value = true
    autoplayBlocked.value = false
    if (howlInstance.value && typeof howlInstance.value.play === 'function') {
      if (typeof howlInstance.value.playing !== 'function' || !howlInstance.value.playing()) {
        howlInstance.value.play()
      }
    }
    // Outgoing Howls are already playing. Howler.play() without an id starts
    // another sound, so never call it here during an automatic transition.
  }

  function pause() {
    if (howlInstance.value && typeof howlInstance.value.pause === 'function') {
      howlInstance.value.pause()
      playState.value.isPlaying = false
      broadcastState()
      stopTimeUpdates()
    }
    // Pausing terminates the overlap; resuming must not revive the old track.
    cleanupOverlappingHowls()
  }

  function stop() {
    cleanupOverlappingHowls()
    nextTrackTriggered.value = false
    if (howlInstance.value && typeof howlInstance.value.stop === 'function') {
      howlInstance.value.stop()
      playState.value.isPlaying = false
      playState.value.currentTime = 0
      broadcastState()
      stopTimeUpdates()
    }
  }

  function togglePlayPause() {
    const isPlaying = (howlInstance.value && typeof howlInstance.value.playing === 'function' && howlInstance.value.playing()) || playState.value.isPlaying
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function seek(percentage: number) {
    if (howlInstance.value && playState.value.duration > 0 && typeof howlInstance.value.seek === 'function') {
      const newTime = (percentage / 100) * playState.value.duration
      howlInstance.value.seek(newTime)
      if (newTime < playState.value.duration - 10) {
        if (nextTrackTriggered.value) {
          nextTrackTriggered.value = false
          cleanupOverlappingHowls()
        }
      }
    }
  }

  function rewind() {
    if (howlInstance.value && typeof howlInstance.value.seek === 'function') {
      howlInstance.value.seek(0)
    }
  }

  // Keyboard controls
  let lastSpacePress = 0
  const DOUBLE_TAP_THRESHOLD = 300 // ms

  function handleSpaceKey() {
    const now = Date.now()
    const timeSinceLastPress = now - lastSpacePress
    lastSpacePress = now

    if (timeSinceLastPress < DOUBLE_TAP_THRESHOLD) {
      // Double tap - stop and reset
      stop()
    } else {
      // Single tap - play/pause
      setTimeout(() => {
        const currentTime = Date.now()
        if (currentTime - lastSpacePress >= DOUBLE_TAP_THRESHOLD) {
          togglePlayPause()
        }
      }, DOUBLE_TAP_THRESHOLD)
    }
  }

  return {
    audioUnlocked,
    autoplayBlocked,
    playState,
    currentTrack,
    howlInstance,
    isLoading,
    loadProgress,
    formattedCurrentTime,
    formattedDuration,
    formattedLoadProgress,
    progress,
    continuousPlayPerformances,
    isContinuousPlay,
    toggleContinuousPlay,
    setContinuousPlay,
    loadTrack,
    play,
    pause,
    stop,
    togglePlayPause,
    seek,
    rewind,
    handleSpaceKey,
    cleanupHowl
  }
})