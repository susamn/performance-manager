<template>
  <div class="bg-card-bg border border-gray-600 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Add Performance</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="performanceName" class="block text-sm font-medium text-gray-300 mb-2">
          {{ isBreakType ? 'Break Name' : 'Performance Name' }} *
        </label>
        <input
          id="performanceName"
          v-model="performanceName"
          type="text"
          required
          :placeholder="isBreakType ? 'Enter break name' : 'Enter performance name'"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
      </div>

      <div v-if="!isBreakType">
        <label for="performerName" class="block text-sm font-medium text-gray-300 mb-2">
          Performer Name *
        </label>
        <input
          id="performerName"
          v-model="performerName"
          type="text"
          :required="!isBreakType"
          placeholder="Enter performer name"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
      </div>

      <div class="grid gap-3" :class="isBreakType ? 'grid-cols-2' : 'grid-cols-3'">
        <div>
          <label for="performanceType" class="block text-sm font-medium text-gray-300 mb-2">
            Type *
          </label>
          <select
            id="performanceType"
            v-model="performanceType"
            required
            @change="handleTypeChange"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          >
            <option value="Song">Song</option>
            <option value="Dance">Dance</option>
            <option value="Recitation">Recitation</option>
            <option value="Break">Break</option>
          </select>
        </div>

        <div v-if="isBreakType">
          <label for="breakSubType" class="block text-sm font-medium text-gray-300 mb-2">
            Break Type *
          </label>
          <select
            id="breakSubType"
            v-model="breakSubType"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          >
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Broadcast">Broadcast</option>
            <option value="Announcement">Announcement</option>
            <option value="Appearence">Appearence</option>
            <option value="Special Show">Special Show</option>
          </select>
        </div>

        <div v-if="!isBreakType">
          <label for="performanceMode" class="block text-sm font-medium text-gray-300 mb-2">
            Mode *
          </label>
          <select
            id="performanceMode"
            v-model="performanceMode"
            :required="!isBreakType"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          >
            <option value="Solo">Solo</option>
            <option value="Duet">Duet</option>
            <option value="Group">Group</option>
          </select>
        </div>

        <div>
          <label for="expectedDuration" class="block text-sm font-medium text-gray-300 mb-2">
            Duration (min)
          </label>
          <input
            id="expectedDuration"
            v-model.number="expectedDuration"
            type="number"
            min="1"
            placeholder="minutes"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          />
        </div>
      </div>

      <div v-if="!isBreakType">
        <label for="audioFiles" class="block text-sm font-medium text-gray-300 mb-2">
          Audio Files (optional)
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

      <div v-if="selectedFiles.length > 0" class="bg-gray-800 rounded p-3">
        <p class="text-sm text-gray-400 mb-2">Selected files:</p>
        <ul class="space-y-1">
          <li v-for="file in selectedFiles" :key="file.name" class="text-sm text-gray-300">
            {{ file.name }} ({{ formatFileSize(file.size) }})
          </li>
        </ul>
      </div>

      <div class="flex space-x-3">
        <button
          type="submit"
          :disabled="isCreating || !performanceName.trim() || (!isBreakType && !performerName.trim())"
          class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isCreating ? 'Creating...' : 'Create' }}
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
import { ref, computed } from 'vue'
import { useEventStore } from '@/stores/event'
import type { Performance } from '@/types'

const props = defineProps<{
  eventId: string
}>()

const emit = defineEmits<{
  performanceCreated: [performance: Performance]
}>()

const eventStore = useEventStore()

const performanceName = ref('')
const performerName = ref('')
const performanceType = ref<'Song' | 'Dance' | 'Recitation' | 'Break'>('Song')
const performanceMode = ref<'Solo' | 'Duet' | 'Group'>('Solo')
const breakSubType = ref<'Lunch' | 'Dinner' | 'Broadcast' | 'Announcement' | 'Appearence' | 'Special Show'>('Lunch')
const expectedDuration = ref<number | undefined>(undefined)
const selectedFiles = ref<File[]>([])
const isCreating = ref(false)

const isBreakType = computed(() => performanceType.value === 'Break')

function handleTypeChange() {
  if (isBreakType.value) {
    selectedFiles.value = []
    const fileInput = document.getElementById('audioFiles') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
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
  if (!performanceName.value.trim() || (!isBreakType.value && !performerName.value.trim())) return

  isCreating.value = true

  try {
    const formData = new FormData()
    formData.append('name', performanceName.value.trim())

    if (isBreakType.value) {
      // For breaks, use breakSubType as the mode field
      formData.append('performer', '')
      formData.append('type', 'Break')
      formData.append('mode', breakSubType.value)
    } else {
      formData.append('performer', performerName.value.trim())
      formData.append('type', performanceType.value)
      formData.append('mode', performanceMode.value)
    }

    if (expectedDuration.value && expectedDuration.value > 0) {
      formData.append('expectedDuration', expectedDuration.value.toString())
    }

    if (!isBreakType.value) {
      selectedFiles.value.forEach((file, index) => {
        formData.append('files', file)
      })
    }

    const response = await fetch(`/api/events/${props.eventId}/performances`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to create performance')
    }

    const performance = await response.json()
    emit('performanceCreated', performance)
    clearForm()
  } catch (error) {
    console.error('Error creating performance:', error)
    alert('Failed to create performance. Please try again.')
  } finally {
    isCreating.value = false
  }
}

function clearForm() {
  performanceName.value = ''
  performerName.value = ''
  performanceType.value = 'Song'
  performanceMode.value = 'Solo'
  breakSubType.value = 'Lunch'
  expectedDuration.value = undefined
  selectedFiles.value = []
  const fileInput = document.getElementById('audioFiles') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>