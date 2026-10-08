<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <div class="p-6">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white mb-1">Delete Event</h3>
            <p class="text-sm text-gray-300">
              Are you sure you want to delete <span class="font-bold text-white">{{ event.name }}</span>?
            </p>
          </div>
        </div>

        <div class="bg-red-950/30 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-300">
          This will permanently delete this event and all associated audio tracks and performances. This action cannot be undone.
        </div>

        <form @submit.prevent="handleDelete">
          <label for="adminPinInput" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Enter Admin PIN to Confirm
          </label>
          <div class="relative mb-2">
            <input
              id="adminPinInput"
              ref="pinInputRef"
              v-model="adminPin"
              :type="showPin ? 'text' : 'password'"
              required
              placeholder="Enter admin PIN"
              autocomplete="off"
              :disabled="isDeleting"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 pr-10 text-sm"
            />
            <button
              type="button"
              @click="showPin = !showPin"
              tabindex="-1"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              <svg v-if="!showPin" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </button>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-400 mb-4 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errorMessage }}
          </p>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              :disabled="isDeleting"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isDeleting || !adminPin.trim()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg v-if="isDeleting" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isDeleting ? 'Deleting...' : 'Delete Event' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/stores/event'
import type { Event } from '@/types'

const props = defineProps<{
  event: Event
}>()

const emit = defineEmits<{
  close: []
  deleted: [eventId: string]
}>()

const eventStore = useEventStore()
const adminPin = ref('')
const showPin = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const pinInputRef = ref<HTMLInputElement>()

onMounted(() => {
  pinInputRef.value?.focus()
})

async function handleDelete() {
  if (!adminPin.value.trim()) {
    errorMessage.value = 'Please enter the admin PIN'
    return
  }

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await eventStore.deleteEvent(props.event.id, adminPin.value.trim())
    emit('deleted', props.event.id)
    emit('close')
  } catch (error: any) {
    errorMessage.value = error.message || 'Incorrect admin PIN. Please try again.'
    adminPin.value = ''
    pinInputRef.value?.focus()
  } finally {
    isDeleting.value = false
  }
}
</script>
