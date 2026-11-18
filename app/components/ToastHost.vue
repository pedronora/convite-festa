<script setup lang="ts">
const { toasts, dismiss } = useToast()

const styles = {
  success: { classes: 'border-emerald-200 bg-white text-emerald-900', icon: 'check-circle', iconClass: 'text-emerald-600' },
  error: { classes: 'border-spider-200 bg-white text-spider-900', icon: 'x-circle', iconClass: 'text-spider-600' },
  info: { classes: 'border-sky-200 bg-white text-navy-900', icon: 'info', iconClass: 'text-sky-600' },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-3 top-3 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-96"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-6"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0 translate-x-6"
        move-class="transition duration-200"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft', styles[toast.type].classes]"
        >
          <AppIcon
            :name="styles[toast.type].icon"
            :size="20"
            :class="['mt-0.5 shrink-0', styles[toast.type].iconClass]"
          />
          <p class="flex-1 text-sm font-semibold leading-snug">
            {{ toast.message }}
          </p>
          <button
            type="button"
            class="-mr-1 rounded-full p-1 opacity-60 transition hover:bg-current/10 hover:opacity-100"
            aria-label="Fechar notificação"
            @click="dismiss(toast.id)"
          >
            <AppIcon
              name="x"
              :size="15"
            />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
