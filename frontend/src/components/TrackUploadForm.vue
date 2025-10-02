<template>
  <div class="bg-card-bg border border-gray-600 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Add Tracks</h2>

    <form @submit.prevent="uploadFiles" class="space-y-4">
      <div>
        <label for="performer" class="block text-sm font-medium text-gray-300 mb-2">
          Performer Name *
        </label>
        <input
          id="performer"
          v-model="performerName"
          type="text"
          required
          placeholder="Enter performer name"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
      </div>

      <div>
        <label for="audioFiles" class="block text-sm font-medium text-gray-300 mb-2">
          Audio Files *
        </label>
        <input
          id="audioFiles"
          type="file"
          multiple
          accept=".mp3,.mp4,.aac,.m4a,.wav,.flac"
          @change="handleFileSelect"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-player-accent file:text-black hover:file:bg-green-400"
        />
      </div>

      <div class="flex space-x-3">
        <button
          type="submit"
          :disabled="!selectedFiles.length || !performerName.trim() || isUploading"
          class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)` }}
        </button>

        <button
          type="button"
          @click="clearForm"
          class="btn-secondary"
        >
          Clear
        </button>
      </div>
    </form>

    <div v-if="selectedFiles.length > 0" class="mt-4">
      <p class="text-sm text-gray-400 mb-2">Selected files:</p>
      <ul class="space-y-1">
        <li v-for="file in selectedFiles" :key="file.name" class="text-sm text-gray-300">
          {{ file.name }} ({{ formatFileSize(file.size) }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  eventId: string
  performanceId: string
}>()

const emit = defineEmits<{
  tracksUploaded: []
}>()

const performerName = ref('')
const selectedFiles = ref<File[]>([])
const isUploading = ref(false)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

async function uploadFiles() {
  if (!selectedFiles.value.length || !performerName.value.trim()) {
    return
  }

  isUploading.value = true
  try {
    for (const file of selectedFiles.value) {
      await uploadTrackFile(file, performerName.value.trim())
    }

    clearForm()
    emit('tracksUploaded')
  } catch (error) {
    console.error('Error uploading tracks:', error)
    alert('Failed to upload tracks. Please try again.')
  } finally {
    isUploading.value = false
  }
}

async function uploadTrackFile(file: File, performer: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('performer', performer)

  const response = await fetch(`/api/events/${props.eventId}/performances/${props.performanceId}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}`)
  }

  return response.json()
}

function clearForm() {
  selectedFiles.value = []
  performerName.value = ''
  const fileInput = document.getElementById('audioFiles') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>