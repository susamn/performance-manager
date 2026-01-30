<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto m-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">Edit Event</h2>
        <button @click="closeModal" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>

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
          <label for="currentUnlockCode" class="block text-sm font-medium text-gray-300 mb-2">
            Current Unlock Code *
          </label>
          <input
            id="currentUnlockCode"
            v-model="currentUnlockCode"
            type="password"
            required
            placeholder="Enter current unlock code to verify"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          />
        </div>

        <div>
          <label for="unlockCode" class="block text-sm font-medium text-gray-300 mb-2">
            New Unlock Code (Optional)
          </label>
          <input
            id="unlockCode"
            v-model="unlockCode"
            type="password"
            placeholder="Enter new unlock code (min 4 characters)"
            minlength="4"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-player-accent text-white"
          />
        </div>

        <!-- Remote Player Configuration -->
        <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-300 flex items-center gap-2">
              <input
                type="checkbox"
                v-model="useRemotePlayer"
                class="w-4 h-4 rounded border-gray-600 text-player-accent focus:ring-player-accent bg-gray-700"
              />
              Remote Player Integration
            </label>
            <span v-if="useRemotePlayer" class="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30">Beta</span>
          </div>

          <div v-if="useRemotePlayer" class="space-y-2 mt-3">
            <input
              v-model="remotePlayerUrl"
              type="text"
              placeholder="http://localhost:5001"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500 text-white text-sm"
            />
            <div class="flex items-center justify-between">
               <button
                type="button"
                @click="testConnection"
                :disabled="isTestingConnection || !remotePlayerUrl"
                class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 transition-colors flex items-center gap-2"
              >
                <span v-if="isTestingConnection" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
              </button>
              <span v-if="connectionStatus" :class="connectionStatus.success ? 'text-green-400' : 'text-red-400'" class="text-xs">
                {{ connectionStatus.message }}
              </span>
            </div>
          </div>
        </div>

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
            :disabled="isSaving || !eventName.trim() || !currentUnlockCode.trim() || (useRemotePlayer && connectionStatus !== null && !connectionStatus.success && remotePlayerUrl !== initialRemoteUrl)"
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
import { useEventStore } from '@/stores/event'
import type { Event } from '@/types'

const props = defineProps<{
  isVisible: boolean
  event: Event
}>()

const emit = defineEmits<{
  close: []
  updated: [event: Event]
}>()

const eventStore = useEventStore()

const eventName = ref('')
const eventDescription = ref('')
const unlockCode = ref('')
const currentUnlockCode = ref('')
const useRemotePlayer = ref(false)
const remotePlayerUrl = ref('')
const initialRemoteUrl = ref('')
const isSaving = ref(false)

// Remote Player State
const isTestingConnection = ref(false)
const connectionStatus = ref<{ success: boolean; message: string } | null>(null)

watch(() => props.event, (newEvent) => {
  if (newEvent) {
    eventName.value = newEvent.name
    eventDescription.value = newEvent.description || ''
    unlockCode.value = '' // Don't show existing unlock code
    currentUnlockCode.value = '' // Reset current code
    
    if (newEvent.remotePlayerUrl) {
        useRemotePlayer.value = true
        remotePlayerUrl.value = newEvent.remotePlayerUrl
        initialRemoteUrl.value = newEvent.remotePlayerUrl
    } else {
        useRemotePlayer.value = false
        remotePlayerUrl.value = 'http://localhost:5001'
        initialRemoteUrl.value = ''
    }
    connectionStatus.value = null
  }
}, { immediate: true })

function closeModal() {
  emit('close')
}

async function testConnection() {
  if (!remotePlayerUrl.value) return
  
  isTestingConnection.value = true
  connectionStatus.value = null
  
  try {
    const response = await fetch(`${remotePlayerUrl.value}/health`, {
        signal: AbortSignal.timeout(3000)
    })
    
    if (response.ok) {
        connectionStatus.value = { success: true, message: 'Connected successfully' }
    } else {
        throw new Error('Health check failed')
    }
  } catch (error) {
    console.error('Remote connection error:', error)
    connectionStatus.value = { success: false, message: 'Connection failed' }
  } finally {
    isTestingConnection.value = false
  }
}

async function handleSubmit() {
  if (!eventName.value.trim() || !currentUnlockCode.value.trim()) return

  isSaving.value = true

  try {
    const updates: any = {
      name: eventName.value.trim(),
      description: eventDescription.value.trim(),
      remotePlayerUrl: useRemotePlayer.value ? remotePlayerUrl.value.trim() : ''
    }

    if (unlockCode.value.trim()) {
      updates.unlockCode = unlockCode.value.trim()
    }

    const updatedEvent = await eventStore.updateEvent(props.event.id, updates, currentUnlockCode.value.trim())
    emit('updated', updatedEvent)
    closeModal()
  } catch (error) {
    console.error('Error updating event:', error)
    alert('Failed to update event. Please check your unlock code.')
  } finally {
    isSaving.value = false
  }
}
</script>