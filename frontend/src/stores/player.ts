import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Howl } from 'howler'
import type { PlayState, Track } from '@/types'
import { useEventStore } from './event'

export const usePlayerStore = defineStore('player', () => {
  const eventStore = useEventStore()
  const playState = ref<PlayState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })

  const currentTrack = ref<Track | null>(null)
  const howlInstance = ref<Howl | null>(null)
  const isLoading = ref(false)
  const loadProgress = ref(0)
  const isRemoteEnabled = ref(false)
  
  // Watch for selected event changes to auto-configure remote player
  watch(() => eventStore.selectedEvent, (event) => {
    if (event && event.remotePlayerUrl) {
        // Auto-enable if the event has a configured remote player
        isRemoteEnabled.value = true
    } else {
        isRemoteEnabled.value = false
    }
  })
  
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

  function toggleRemote() {
    isRemoteEnabled.value = !isRemoteEnabled.value
  }

  // Helper to send commands to remote player
  async function sendRemoteCommand(endpoint: string, data: any = {}) {
    if (!isRemoteEnabled.value) return
    
    // Get URL from current event or fallback
    const remoteUrl = eventStore.selectedEvent?.remotePlayerUrl
    if (!remoteUrl) return

    try {
      await fetch(`${remoteUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error(`Failed to send remote command ${endpoint}:`, error)
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
        }
        console.log('Track loaded successfully (streaming ready)')
      },

      onloaderror: (id: number, error: unknown) => {
        isLoading.value = false
        console.error('Failed to load track:', error)
      },

      onplay: () => {
        playState.value.isPlaying = true
        startTimeUpdates()
        
        // Trigger remote play
        if (isRemoteEnabled.value && track.url) {
            // Need absolute URL for remote player
            // Assuming the browser URL and backend are accessible to remote player via same hostname/IP if localhost
            // But for docker to docker, we might need internal network alias.
            // For now, let's construct a full URL assuming the remote player can access the backend via 'performance-manager:5000' 
            // OR if running locally, 'localhost:5000'.
            // Simple approach: Send the full URL constructed from window.location
            const fullUrl = new URL(track.url, window.location.origin).href
            let remoteUrl = fullUrl

            // Get the configured remote player URL
            const configuredRemote = eventStore.selectedEvent?.remotePlayerUrl || ''
            
            // If the remote player is on localhost/127.0.0.1, it means it's likely 
            // in the same Docker stack or same machine. In this case, we use the 
            // Docker internal network name 'performance-manager' for the audio stream.
            if (configuredRemote.includes('localhost') || configuredRemote.includes('127.0.0.1')) {
                if (fullUrl.includes('localhost:5000')) {
                    remoteUrl = fullUrl.replace('localhost:5000', 'performance-manager:5000')
                } else if (fullUrl.includes('127.0.0.1:5000')) {
                    remoteUrl = fullUrl.replace('127.0.0.1:5000', 'performance-manager:5000')
                }
            }
            
            sendRemoteCommand('play', { url: remoteUrl })
        }
      },

      onpause: () => {
        playState.value.isPlaying = false
        stopTimeUpdates()
        sendRemoteCommand('pause')
      },

      onstop: () => {
        playState.value.isPlaying = false
        playState.value.currentTime = 0
        stopTimeUpdates()
        sendRemoteCommand('stop')
      },

      onend: () => {
        playState.value.isPlaying = false
        playState.value.currentTime = 0
        stopTimeUpdates()
        // Remote player handles its own end, but we can ensure stop
        // sendRemoteCommand('stop') 
      },

      onseek: () => {
        if (howlInstance.value) {
          const time = howlInstance.value.seek() as number
          playState.value.currentTime = time
          sendRemoteCommand('seek', { time: time })
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
      }
    }, 100) // Update every 100ms for smooth progress
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
    isRemoteEnabled,
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
    cleanupHowl,
    toggleRemote
  }
})