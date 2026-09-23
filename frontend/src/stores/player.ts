import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Howl } from 'howler'
import type { PlayState, Track } from '@/types'
import { socket } from '@/socket'

export const usePlayerStore = defineStore('player', () => {
  const playState = ref<PlayState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })

  const currentTrack = ref<Track | null>(null)
  const howlInstance = ref<Howl | null>(null)
  const isLoading = ref(false)
  const loadProgress = ref(0)

  // Listen for performer commands
  socket.on('admin_receive_command', (cmd: any) => {
    console.log('Received command from performer:', cmd)
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
      howlInstance.value.unload()
      howlInstance.value = null
    }
  }

  function loadTrack(track: Track) {
    if (!track.url) return

    // Clean up previous instance
    cleanupHowl()

    // Reset state
    playState.value.currentTime = 0
    playState.value.duration = 0
    playState.value.isPlaying = false
    isLoading.value = true
    loadProgress.value = 0

    currentTrack.value = track
    playState.value.currentPerformanceId = undefined
    playState.value.currentTrackId = track.id
    
    broadcastState()

    // Create new Howl instance with streaming configuration
    howlInstance.value = new Howl({
      src: [track.url],
      html5: true,          // Force HTML5 for streaming
      preload: 'metadata',  // Only load metadata initially
      format: ['mp3', 'mp4', 'aac', 'm4a', 'wav', 'flac', 'wma'],
      volume: 1.0,

      // Event handlers
      onload: () => {
        isLoading.value = false
        loadProgress.value = 100
        if (howlInstance.value) {
          playState.value.duration = howlInstance.value.duration() || track.duration || 0
          broadcastState()
        }
        console.log('Track loaded successfully (streaming ready)')
      },

      onloaderror: (id: number, error: unknown) => {
        isLoading.value = false
        console.error('Failed to load track:', error)
      },

      onplay: () => {
        playState.value.isPlaying = true
        broadcastState()
        startTimeUpdates()
      },

      onpause: () => {
        playState.value.isPlaying = false
        broadcastState()
        stopTimeUpdates()
      },

      onstop: () => {
        playState.value.isPlaying = false
        playState.value.currentTime = 0
        broadcastState()
        stopTimeUpdates()
      },

      onend: () => {
        playState.value.isPlaying = false
        playState.value.currentTime = 0
        broadcastState()
        stopTimeUpdates()
      },

      onseek: () => {
        if (howlInstance.value) {
          playState.value.currentTime = howlInstance.value.seek() as number
          broadcastState()
        }
      }
    })
  }

  // Time update management
  let timeUpdateInterval: number | null = null

  function startTimeUpdates() {
    stopTimeUpdates()
    timeUpdateInterval = setInterval(() => {
      if (howlInstance.value && playState.value.isPlaying) {
        playState.value.currentTime = howlInstance.value.seek() as number
        broadcastState()
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
    if (howlInstance.value) {
      howlInstance.value.play()
    }
  }

  function pause() {
    if (howlInstance.value) {
      howlInstance.value.pause()
    }
  }

  function stop() {
    if (howlInstance.value) {
      howlInstance.value.stop()
    }
  }

  function togglePlayPause() {
    if (playState.value.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function seek(percentage: number) {
    if (howlInstance.value && playState.value.duration > 0) {
      const newTime = (percentage / 100) * playState.value.duration
      howlInstance.value.seek(newTime)
    }
  }

  function rewind() {
    if (howlInstance.value) {
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
    playState,
    currentTrack,
    howlInstance,
    isLoading,
    loadProgress,
    formattedCurrentTime,
    formattedDuration,
    formattedLoadProgress,
    progress,
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