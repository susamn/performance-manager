<template>
  <div
    v-if="isOpen"
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
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="requiresTextConfirmation ? 'bg-amber-950/60 border border-amber-500/30' : 'bg-blue-950/60 border border-blue-500/30'"
          >
            <svg
              class="w-5 h-5"
              :class="requiresTextConfirmation ? 'text-amber-400' : 'text-blue-400'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white mb-1">
              {{ requiresTextConfirmation ? 'Replace Performances?' : 'Import Performances' }}
            </h3>
            <p class="text-sm text-gray-300">
              Ready to import <span class="font-bold text-player-accent">{{ incomingCount }}</span> performance{{ incomingCount !== 1 ? 's' : '' }}.
            </p>
          </div>
        </div>

        <div v-if="requiresTextConfirmation" class="space-y-4">
          <div class="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200">
            <strong>Warning:</strong> This event already contains <span class="font-bold text-white">{{ existingCount }}</span> performance{{ existingCount !== 1 ? 's' : '' }}. Importing will completely replace the current performance list.
          </div>

          <div>
            <label for="replaceConfirmInput" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Type <code class="bg-gray-700 px-1 py-0.5 rounded text-amber-300 font-bold">REPLACE</code> to confirm:
            </label>
            <input
              id="replaceConfirmInput"
              ref="confirmInputRef"
              v-model="confirmationText"
              type="text"
              autocomplete="off"
              placeholder="REPLACE"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono text-sm uppercase"
              @keydown.enter="canSubmit && handleConfirm()"
            />
          </div>
        </div>

        <div v-else class="text-sm text-gray-400">
          The performances will be imported and sequenced in the exact order specified in the JSON file.
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            :disabled="isSubmitting"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!canSubmit || isSubmitting"
            @click="handleConfirm"
            class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2"
            :class="requiresTextConfirmation ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'"
          >
            <svg v-if="isSubmitting" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Importing...' : (requiresTextConfirmation ? 'Replace & Import' : 'Import') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  isOpen: boolean
  incomingCount: number
  existingCount: number
  requiresTextConfirmation: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmationText = ref('')
const confirmInputRef = ref<HTMLInputElement>()

const canSubmit = computed(() => {
  if (!props.requiresTextConfirmation) return true
  return confirmationText.value.trim().toUpperCase() === 'REPLACE'
})

watch(
  () => props.isOpen,
  (open) => {
    confirmationText.value = ''
    if (open && props.requiresTextConfirmation) {
      nextTick(() => {
        confirmInputRef.value?.focus()
      })
    }
  }
)

function handleConfirm() {
  if (canSubmit.value && !props.isSubmitting) {
    emit('confirm')
  }
}
</script>
