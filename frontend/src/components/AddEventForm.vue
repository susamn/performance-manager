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
const isCreating = ref(false)

async function handleSubmit() {
  if (!eventName.value.trim()) return

  isCreating.value = true

  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: eventName.value.trim(),
        description: eventDescription.value.trim()
      }),
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
}
</script>