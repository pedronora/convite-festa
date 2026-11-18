<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'success' | 'error' | 'info' | 'warning'
  title?: string
}>(), {
  type: 'info',
})

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-spider-200 bg-spider-50 text-spider-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-navy-900',
}
const icons = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert',
  info: 'info',
}
</script>

<template>
  <div :class="['flex items-start gap-3 rounded-2xl border p-3.5 text-sm', styles[type]]" :role="type === 'error' ? 'alert' : 'status'">
    <AppIcon :name="icons[type]" :size="18" class="mt-0.5 shrink-0" />
    <div>
      <p v-if="title" class="font-extrabold">{{ title }}</p>
      <div :class="title ? 'mt-0.5' : ''" class="font-semibold leading-relaxed">
        <slot />
      </div>
    </div>
  </div>
</template>
