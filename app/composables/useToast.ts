export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

let counter = 0

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function push(type: ToastItem['type'], message: string, timeout = 4500) {
    if (!import.meta.client) return
    const id = ++counter
    toasts.value.push({ id, type, message })
    if (toasts.value.length > 4) toasts.value.shift()
    window.setTimeout(() => dismiss(id), timeout)
  }

  return {
    toasts,
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message, 6000),
    info: (message: string) => push('info', message),
  }
}
