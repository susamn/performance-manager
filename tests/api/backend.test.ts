import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for API integration tests
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Backend API Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Performance Management', () => {
    it('fetches performances from API', async () => {
      const mockPerformances = [
        {
          id: '1',
          name: 'Test Performance',
          tracks: [],
          isDone: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          order: 0
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPerformances)
      })

      const response = await fetch('/api/performances')
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/performances')
      expect(data).toEqual(mockPerformances)
    })

    it('creates new performance via API', async () => {
      const newPerformance = {
        id: '2',
        name: 'New Performance',
        tracks: [],
        isDone: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        order: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newPerformance)
      })

      const response = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Performance' })
      })

      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Performance' })
      })
      expect(data).toEqual(newPerformance)
    })

    it('updates performance via API', async () => {
      const updatedPerformance = {
        id: '1',
        name: 'Updated Performance',
        tracks: [],
        isDone: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        order: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPerformance)
      })

      const response = await fetch('/api/performances/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: true })
      })

      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: true })
      })
      expect(data).toEqual(updatedPerformance)
    })

    it('deletes performance via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const response = await fetch('/api/performances/1', {
        method: 'DELETE'
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/1', {
        method: 'DELETE'
      })
      expect(response.ok).toBe(true)
      expect(response.status).toBe(204)
    })

    it('reorders performances via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const newOrder = ['2', '1', '3']
      const response = await fetch('/api/performances/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })

      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })
      expect(data.success).toBe(true)
    })
  })

  describe('File Upload', () => {
    it('uploads track file via API', async () => {
      const mockTrack = {
        id: 'track-1',
        filename: 'test.mp3',
        performer: 'Test Artist',
        url: '/api/performances/1/files/test.mp3'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockTrack)
      })

      const formData = new FormData()
      const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      formData.append('file', file)
      formData.append('performer', 'Test Artist')

      const response = await fetch('/api/performances/1/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/1/upload', {
        method: 'POST',
        body: formData
      })
      expect(data).toEqual(mockTrack)
      expect(response.status).toBe(201)
    })

    it('handles file upload errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'File type not allowed' })
      })

      const formData = new FormData()
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      formData.append('file', file)
      formData.append('performer', 'Test Artist')

      const response = await fetch('/api/performances/1/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('File type not allowed')
    })
  })

  describe('File Serving', () => {
    it('serves audio file with range support', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 206,
        headers: new Headers({
          'Content-Range': 'bytes 0-1023/2048',
          'Accept-Ranges': 'bytes',
          'Content-Length': '1024',
          'Content-Type': 'audio/mpeg'
        })
      })

      const response = await fetch('/api/performances/1/files/test.mp3', {
        headers: {
          'Range': 'bytes=0-1023'
        }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/1/files/test.mp3', {
        headers: {
          'Range': 'bytes=0-1023'
        }
      })
      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 0-1023/2048')
    })

    it('serves full audio file without range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'audio/mpeg'
        })
      })

      const response = await fetch('/api/performances/1/files/test.mp3')

      expect(mockFetch).toHaveBeenCalledWith('/api/performances/1/files/test.mp3')
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
    })
  })

  describe('Health Check', () => {
    it('checks API health status', async () => {
      const healthResponse = {
        status: 'healthy',
        config_dir: '/home/user/.config/performance-manager'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(healthResponse)
      })

      const response = await fetch('/api/health')
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/health')
      expect(data.status).toBe('healthy')
      expect(data.config_dir).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/performances')
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })

    it('handles 404 errors for missing performances', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Performance not found' })
      })

      const response = await fetch('/api/performances/nonexistent')
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Performance not found')
    })

    it('handles 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      })

      const response = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' })
      })

      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})