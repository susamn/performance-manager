export interface Track {
  id: string
  filename: string
  performer: string
  url?: string
  duration?: number
  isCompleted?: boolean
}

export interface Performance {
  id: string
  name: string
  performer: string
  type: 'Song' | 'Dance' | 'Recitation'
  mode: 'Solo' | 'Duet' | 'Group'
  tracks: Track[]
  isDone: boolean
  createdAt: string
  order: number
}

export interface Break {
  id: string
  name: string
  type: 'Lunch' | 'Dinner' | 'Broadcast' | 'Announcement' | 'Appearence' | 'Special Show'
  isDone: boolean
  createdAt: string
  order: number
}

export interface Event {
  id: string
  name: string
  description?: string
  createdAt: string
  performances: Performance[]
  breaks: Break[]
}

export interface PlayState {
  isPlaying: boolean
  currentTime: number
  duration: number
  currentEventId?: string
  currentPerformanceId?: string
  currentTrackId?: string
}