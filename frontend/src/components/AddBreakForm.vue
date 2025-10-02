<template>
  <div class="bg-card-bg border border-gray-600 rounded-lg p-6 mt-6">
    <h2 class="text-xl font-semibold text-white mb-4">Add Break</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="breakName" class="block text-sm font-medium text-gray-300 mb-2">
          Break Name *
        </label>
        <input
          id="breakName"
          v-model="breakName"
          type="text"
          required
          placeholder="Enter break name"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
        />
      </div>

      <div>
        <label for="breakType" class="block text-sm font-medium text-gray-300 mb-2">
          Type *
        </label>
        <select
          id="breakType"
          v-model="breakType"
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

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full bg-player-accent hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
      >
        {{ isSubmitting ? 'Adding...' : 'Add Break' }}
      </button>

      <div v-if="error" class="text-red-400 text-sm">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Break } from '@/types'

const props = defineProps<{
  eventId: string
}>()

const emit = defineEmits<{
  breakCreated: [breakObj: Break]
}>()

const breakName = ref('')
const breakType = ref<Break['type']>('Lunch')
const isSubmitting = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!breakName.value.trim()) {
    error.value = 'Break name is required'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/events/${props.eventId}/breaks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: breakName.value.trim(),
        type: breakType.value
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create break')
    }

    const breakObj = await response.json()
    emit('breakCreated', breakObj)

    // Reset form
    breakName.value = ''
    breakType.value = 'Lunch'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create break'
    console.error('Error creating break:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>