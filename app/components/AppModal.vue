<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeable?: boolean
}>(), {
  size: 'md',
  closeable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const id = useId()
const dialog = ref<HTMLElement | null>(null)
const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

function close() {
  if (!props.closeable) return
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.modelValue, async (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    await nextTick()
    const target = dialog.value?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select, button')
    target?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        @mousedown.self="close"
      >
        <div
          ref="dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`${id}-title`"
          :aria-describedby="description ? `${id}-desc` : undefined"
          :class="['animate-pop relative my-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-navy-100 bg-white shadow-2xl sm:my-8 sm:rounded-3xl', sizes[size]]"
        >
          <div class="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4 sm:px-6">
            <div>
              <h2 :id="`${id}-title`" class="text-lg font-extrabold text-navy-950">
                {{ title }}
              </h2>
              <p v-if="description" :id="`${id}-desc`" class="mt-1 text-sm text-navy-500">
                {{ description }}
              </p>
            </div>
            <button
              v-if="closeable"
              type="button"
              class="rounded-full p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
              aria-label="Fechar"
              @click="close"
            >
              <AppIcon name="x" :size="18" />
            </button>
          </div>
          <div class="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>
          <div v-if="$slots.footer" class="border-t border-navy-100 bg-navy-50/50 px-5 py-4 sm:px-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
