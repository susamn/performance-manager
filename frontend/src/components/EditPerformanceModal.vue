<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">Edit Performance</h2>
        <button @click="closeModal" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Performance Name -->
        <div>
          <label for="performanceName" class="block text-sm font-medium text-gray-300 mb-2">
            Performance Name *
          </label>
          <input
            id="performanceName"
            v-model="editedName"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          />
        </div>

        <!-- Performer Name -->
        <div>
          <label for="performerName" class="block text-sm font-medium text-gray-300 mb-2">
            Performer Name *
          </label>
          <input
            id="performerName"
            v-model="editedPerformer"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          />
        </div>

        <!-- Existing Tracks -->
        <div v-if="performance.tracks.length > 0">
          <h3 class="text-lg font-medium text-white mb-3">Existing Tracks</h3>
          <div class="space-y-3">
            <div v-for="track in performance.tracks" :key="track.id"
                 class="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600">
              <div class="flex-1 min-w-0">
                <p class="text-white font-medium truncate">{{ track.filename }}</p>
                <p class="text-sm text-gray-400">{{ track.performer }}</p>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <input
                  type="file"
                  :id="`replace-${track.id}`"
                  accept=".mp3,.mp4,.aac,.m4a,.wav,.flac"
                  @change="(event) => handleTrackReplace(track.id, event)"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="triggerFileInput(track.id)"
                  class="px-3 py-1 text-xs bg-yellow-600/20 border border-yellow-500 text-yellow-300 rounded hover:bg-yellow-600/30 transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  @click="removeTrack(track.id)"
                  class="px-3 py-1 text-xs bg-red-600/20 border border-red-500 text-red-300 rounded hover:bg-red-600/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add New Tracks -->
        <div>
          <h3 class="text-lg font-medium text-white mb-3">Add New Tracks</h3>
          <input
            id="newTracks"
            type="file"
            multiple
            accept=".mp3,.mp4,.aac,.m4a,.wav,.flac"
            @change="handleNewTracksSelect"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-player-accent file:text-black hover:file:bg-green-400"
          />
          <p class="text-xs text-gray-500 mt-1">Supported formats: MP3, MP4, AAC, M4A, WAV, FLAC</p>
        </div>

        <!-- Selected New Tracks Preview -->
        <div v-if="selectedNewTracks.length > 0" class="bg-gray-700/30 rounded p-3">
          <p class="text-sm text-gray-400 mb-2">New tracks to add:</p>
          <ul class="space-y-1">
            <li v-for="file in selectedNewTracks" :key="file.name" class="text-sm text-gray-300 flex items-center justify-between">
              <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
              <button
                type="button"
                @click="removeNewTrack(file.name)"
                class="text-red-400 hover:text-red-300 ml-2"
              >
                ×
              </button>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-600">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="px-4 py-2 bg-player-accent hover:bg-green-400 text-black font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Performance, Track } from '@/types'

const props = defineProps<{
  isVisible: boolean
  performance: Performance
  eventId: string
}>()

const emit = defineEmits<{
  close: []
  updated: [performance: Performance]
}>()

const editedName = ref('')
const editedPerformer = ref('')
const selectedNewTracks = ref<File[]>([])
const tracksToReplace = ref<Map<string, File>>(new Map())
const tracksToRemove = ref<Set<string>>(new Set())
const isSaving = ref(false)

// Watch for prop changes to reset form
watch(() => props.performance, (newPerformance) => {
  if (newPerformance) {
    editedName.value = newPerformance.name
    editedPerformer.value = newPerformance.performer
    selectedNewTracks.value = []
    tracksToReplace.value.clear()
    tracksToRemove.value.clear()
  }
}, { immediate: true })

function closeModal() {
  emit('close')
}

function handleNewTracksSelect(event: any) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedNewTracks.value = Array.from(target.files)
  }
}

function removeNewTrack(filename: string) {
  selectedNewTracks.value = selectedNewTracks.value.filter(file => file.name !== filename)
}

function triggerFileInput(trackId: string) {
  const input = document.getElementById(`replace-${trackId}`) as HTMLInputElement
  input?.click()
}

function handleTrackReplace(trackId: string, event: any) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    tracksToReplace.value.set(trackId, target.files[0])
  }
}

function removeTrack(trackId: string) {
  tracksToRemove.value.add(trackId)
  tracksToReplace.value.delete(trackId) // Remove from replace queue if it was there
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleSubmit() {
  if (!editedName.value.trim() || !editedPerformer.value.trim()) return

  isSaving.value = true

  try {
    // 1. Update performance basic info
    const updateResponse = await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editedName.value.trim(),
        performer: editedPerformer.value.trim()
      })
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update performance')
    }

    // 2. Handle track replacements
    for (const [trackId, file] of tracksToReplace.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('performer', editedPerformer.value.trim())

      // Delete old track first
      await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}/tracks/${trackId}`, {
        method: 'DELETE'
      })

      // Upload new track
      await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}/upload`, {
        method: 'POST',
        body: formData
      })
    }

    // 3. Handle track removals
    for (const trackId of tracksToRemove.value) {
      await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}/tracks/${trackId}`, {
        method: 'DELETE'
      })
    }

    // 4. Add new tracks
    if (selectedNewTracks.value.length > 0) {
      const formData = new FormData()
      selectedNewTracks.value.forEach(file => {
        formData.append('files', file)
      })
      formData.append('performer', editedPerformer.value.trim())

      await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}/tracks`, {
        method: 'POST',
        body: formData
      })
    }

    // 5. Get updated performance
    const performanceResponse = await fetch(`/api/events/${props.eventId}/performances/${props.performance.id}`)
    if (performanceResponse.ok) {
      const updatedPerformance = await performanceResponse.json()
      emit('updated', updatedPerformance)
    }

    closeModal()
  } catch (error) {
    console.error('Error updating performance:', error)
    alert('Failed to update performance. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>