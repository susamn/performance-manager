<template>
  <div class="bg-card-bg border border-gray-600 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Add Event</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="eventName" class="block text-sm font-medium text-gray-300 mb-2">
          Event Name *
        </label>
        <input
          id="eventName"
          v-model="eventName"
          type="text"
          required
          placeholder="Enter event name"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
      </div>

      <div>
        <label for="eventDescription" class="block text-sm font-medium text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="eventDescription"
          v-model="eventDescription"
          rows="3"
          placeholder="Enter event description"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white resize-none"
        />
      </div>

      <div>
        <label for="coverImage" class="block text-sm font-medium text-gray-300 mb-2">
          Cover Image (Optional)
        </label>
        <input
          id="coverImage"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          @change="handleCoverImageSelect"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-player-accent file:text-black hover:file:bg-green-400"
        />
        <p class="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP</p>
      </div>

      <div v-if="selectedCoverImage" class="bg-gray-800 rounded p-3">
        <p class="text-sm text-gray-400 mb-2">Selected cover image:</p>
        <div class="flex items-center gap-3">
          <img
            :src="coverImagePreview"
            alt="Cover preview"
            class="w-16 h-16 object-cover rounded border border-gray-600"
          />
          <div>
            <p class="text-sm text-gray-300">{{ selectedCoverImage.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedCoverImage.size) }}</p>
          </div>
        </div>
      </div>

      <div class="flex space-x-3">
        <button
          type="submit"
          :disabled="isCreating || !eventName.trim()"
          class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isCreating ? 'Creating...' : 'Create Event' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Event } from '@/types'

const emit = defineEmits<{
  eventCreated: [event: Event]
}>()

const eventName = ref('')
const eventDescription = ref('')
const selectedCoverImage = ref<File | null>(null)
const coverImagePreview = ref('')
const isCreating = ref(false)

function handleCoverImageSelect(inputEvent: any) {
  const target = inputEvent.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedCoverImage.value = file

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      coverImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleSubmit() {
  if (!eventName.value.trim()) return

  isCreating.value = true

  try {
    const formData = new FormData()
    formData.append('name', eventName.value.trim())
    formData.append('description', eventDescription.value.trim())

    if (selectedCoverImage.value) {
      formData.append('coverImage', selectedCoverImage.value)
    }

    const response = await fetch('/api/events', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to create event')
    }

    const event = await response.json()
    emit('eventCreated', event)
    clearForm()
  } catch (error) {
    console.error('Error creating event:', error)
    alert('Failed to create event. Please try again.')
  } finally {
    isCreating.value = false
  }
}

function clearForm() {
  eventName.value = ''
  eventDescription.value = ''
  selectedCoverImage.value = null
  coverImagePreview.value = ''
  const fileInput = document.getElementById('coverImage') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>