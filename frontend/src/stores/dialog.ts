import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DialogOptions {
  title?: string
  message: string
  type?: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'error' | 'warning' | 'info' | 'success'
  danger?: boolean
}

export const useDialogStore = defineStore('dialog', () => {
  const isOpen = ref(false)
  const options = ref<DialogOptions>({ message: '' })

  let resolveFn: ((value: any) => void) | null = null

  function alert(
    message: string,
    title = 'Notification',
    variant: DialogOptions['variant'] = 'info'
  ): Promise<void> {
    return new Promise((resolve) => {
      options.value = {
        message,
        title,
        type: 'alert',
        confirmText: 'OK',
        variant,
      }
      isOpen.value = true
      resolveFn = () => resolve()
    })
  }

  function confirm(
    message: string,
    title = 'Confirm Action',
    opts: Partial<DialogOptions> = {}
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const variant = opts.variant || (opts.danger ? 'danger' : 'info')
      options.value = {
        message,
        title,
        type: 'confirm',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        variant,
        ...opts,
      }
      isOpen.value = true
      resolveFn = (val: boolean) => resolve(val)
    })
  }

  function handleConfirm() {
    if (options.value.type === 'confirm') {
      resolveFn?.(true)
    } else {
      resolveFn?.(undefined)
    }
    isOpen.value = false
    resolveFn = null
  }

  function handleCancel() {
    if (options.value.type === 'confirm') {
      resolveFn?.(false)
    } else {
      resolveFn?.(undefined)
    }
    isOpen.value = false
    resolveFn = null
  }

  return {
    isOpen,
    options,
    alert,
    confirm,
    handleConfirm,
    handleCancel,
  }
})
