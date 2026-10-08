<template>
  <Transition name="fade">
    <div
      v-if="dialogStore.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="dialogStore.handleCancel"
      @keydown.esc="dialogStore.handleCancel"
      tabindex="-1"
      ref="backdropRef"
    >
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div class="p-6">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="iconContainerClass"
            >
              <!-- Danger / Error Icon -->
              <svg
                v-if="dialogStore.options.variant === 'danger' || dialogStore.options.variant === 'error'"
                class="w-5 h-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>

              <!-- Warning Icon -->
              <svg
                v-else-if="dialogStore.options.variant === 'warning'"
                class="w-5 h-5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>

              <!-- Success Icon -->
              <svg
                v-else-if="dialogStore.options.variant === 'success'"
                class="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>

              <!-- Info Icon -->
              <svg
                v-else
                class="w-5 h-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-white leading-6 mb-2">
                {{ dialogStore.options.title }}
              </h3>
              <p class="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {{ dialogStore.options.message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="bg-gray-900/60 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-700/60">
          <button
            v-if="dialogStore.options.type === 'confirm'"
            type="button"
            @click="dialogStore.handleCancel"
            class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {{ dialogStore.options.cancelText || 'Cancel' }}
          </button>
          <button
            type="button"
            ref="confirmButtonRef"
            @click="dialogStore.handleConfirm"
            :class="confirmButtonClass"
            class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {{ dialogStore.options.confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()
const backdropRef = ref<HTMLElement>()
const confirmButtonRef = ref<HTMLButtonElement>()

const iconContainerClass = computed(() => {
  switch (dialogStore.options.variant) {
    case 'danger':
    case 'error':
      return 'bg-red-950/60 border border-red-500/30'
    case 'warning':
      return 'bg-amber-950/60 border border-amber-500/30'
    case 'success':
      return 'bg-green-950/60 border border-green-500/30'
    default:
      return 'bg-blue-950/60 border border-blue-500/30'
  }
})

const confirmButtonClass = computed(() => {
  switch (dialogStore.options.variant) {
    case 'danger':
    case 'error':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    case 'warning':
      return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    case 'success':
      return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    default:
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }
})

watch(
  () => dialogStore.isOpen,
  (open) => {
    if (open) {
      nextTick(() => {
        confirmButtonRef.value?.focus()
      })
    }
  }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
