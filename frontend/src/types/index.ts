export interface Track {
  id: string
  filename: string
  performer: string
  url?: string
  duration?: number  // Duration in seconds, extracted from audio file
  isCompleted?: boolean
}

export interface Performance {
  id: string
  name: string
  performer: string
  type: 'Song' | 'Dance' | 'Recitation' | 'Break'
  mode: 'Solo' | 'Duet' | 'Group' | 'Lunch' | 'Dinner' | 'Broadcast' | 'Announcement' | 'Appearence' | 'Special Show'
  tracks: Track[]
  isDone: boolean
  createdAt: string
  order: number
  expectedDuration?: number // in minutes (manually entered)
  resolvedDuration?: number // in seconds (calculated from track durations)
}

export interface Break {
  id: string
  name: string
  type: 'Lunch' | 'Dinner' | 'Broadcast' | 'Announcement' | 'Appearence' | 'Special Show'
  isDone: boolean
  createdAt: string
  order: number
  expectedDuration?: number // in minutes
}

export interface Event {
  id: string
  name: string
  description?: string
  createdAt: string
  performances: Performance[]
  breaks: Break[]
  coverImage?: string | null
  imagePosition?: { x: number; y: number }
  remotePlayerUrl?: string
}

export interface PlayState {
  isPlaying: boolean
  currentTime: number
  duration: number
  currentEventId?: string
  currentPerformanceId?: string
  currentTrackId?: string
}