import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayState, Track } from '@/types'

export const usePlayerStore = defineStore('player', () => {
  const playState = ref<PlayState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })

  const currentTrack = ref<Track | null>(null)
  const audioElement = ref<HTMLAudioElement | null>(null)

  const formattedCurrentTime = computed(() => formatTime(playState.value.currentTime))
  const formattedDuration = computed(() => formatTime(playState.value.duration))
  const progress = computed(() =>
    playState.value.duration > 0 ? (playState.value.currentTime / playState.value.duration) * 100 : 0
  )

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function initializeAudio() {
    if (!audioElement.value) {
      audioElement.value = new Audio()

      audioElement.value.addEventListener('loadedmetadata', () => {
        if (audioElement.value) {
          playState.value.duration = audioElement.value.duration
        }
      })

      audioElement.value.addEventListener('timeupdate', () => {
        if (audioElement.value) {
          playState.value.currentTime = audioElement.value.currentTime
        }
      })

      audioElement.value.addEventListener('play', () => {
        playState.value.isPlaying = true
      })

      audioElement.value.addEventListener('pause', () => {
        playState.value.isPlaying = false
      })

      audioElement.value.addEventListener('ended', () => {
        playState.value.isPlaying = false
        playState.value.currentTime = 0
      })
    }
  }

  function loadTrack(track: Track) {
    initializeAudio()

    if (audioElement.value && track.url) {
      currentTrack.value = track
      audioElement.value.src = track.url
      playState.value.currentTime = 0
      playState.value.duration = track.duration || 0
      playState.value.currentPerformanceId = undefined
      playState.value.currentTrackId = track.id
    }
  }

  function play() {
    if (audioElement.value) {
      audioElement.value.play().catch(error => {
        console.error('Failed to play audio:', error)
      })
    }
  }

  function pause() {
    if (audioElement.value) {
      audioElement.value.pause()
    }
  }

  function stop() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
      playState.value.currentTime = 0
      playState.value.isPlaying = false
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
    if (audioElement.value && playState.value.duration > 0) {
      const newTime = (percentage / 100) * playState.value.duration
      audioElement.value.currentTime = newTime
      playState.value.currentTime = newTime
    }
  }

  function rewind() {
    if (audioElement.value) {
      audioElement.value.currentTime = 0
      playState.value.currentTime = 0
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
    formattedCurrentTime,
    formattedDuration,
    progress,
    initializeAudio,
    loadTrack,
    play,
    pause,
    stop,
    togglePlayPause,
    seek,
    rewind,
    handleSpaceKey
  }
})