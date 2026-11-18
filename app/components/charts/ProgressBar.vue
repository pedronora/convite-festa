<script setup lang="ts">
withDefaults(defineProps<{
  value: number
  label?: string
  color?: string
  showValue?: boolean
}>(), {
  color: '#c81e2b',
  showValue: true,
})
</script>

<template>
  <div>
    <div v-if="label || showValue" class="mb-1.5 flex items-center justify-between gap-3">
      <span v-if="label" class="text-sm font-bold text-navy-700">{{ label }}</span>
      <span v-if="showValue" class="text-sm font-extrabold text-navy-950">{{ value }}%</span>
    </div>
    <div
      class="h-2.5 overflow-hidden rounded-full bg-navy-100"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label || 'Progresso'"
    >
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :style="{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }"
      />
    </div>
  </div>
</template>
