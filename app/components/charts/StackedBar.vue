<script setup lang="ts">
import { formatCentsBRL } from '#shared/utils/money'

interface Segment {
  label: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{
  segments: Segment[]
  total?: number
  height?: number
  showLegend?: boolean
  formatValue?: (value: number) => string
  ariaLabel?: string
}>(), {
  height: 12,
  showLegend: true,
  formatValue: formatCentsBRL,
})

const total = computed(() => props.total ?? props.segments.reduce((sum, segment) => sum + segment.value, 0))

function percent(value: number): number {
  if (total.value <= 0) return 0
  return Math.min(100, Math.max(0, (value / total.value) * 100))
}

const aria = computed(() => {
  const parts = props.segments.map(segment => `${segment.label}: ${props.formatValue(segment.value)}`)
  return props.ariaLabel ? `${props.ariaLabel}. ${parts.join(', ')}` : parts.join(', ')
})
</script>

<template>
  <div>
    <div
      class="flex w-full overflow-hidden rounded-full bg-navy-100"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="aria"
    >
      <div
        v-for="segment in segments"
        :key="segment.label"
        class="h-full transition-all duration-700 ease-out"
        :style="{ width: `${percent(segment.value)}%`, backgroundColor: segment.color }"
        :title="`${segment.label}: ${formatValue(segment.value)}`"
      />
    </div>
    <ul
      v-if="showLegend"
      class="mt-3 grid gap-2 sm:grid-cols-3"
    >
      <li
        v-for="segment in segments"
        :key="segment.label"
        class="flex items-start gap-2"
      >
        <span
          class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: segment.color }"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
            {{ segment.label }}
          </p>
          <p class="text-sm font-extrabold text-navy-900">
            {{ formatValue(segment.value) }}
          </p>
          <p class="text-[10px] font-semibold text-navy-400">
            {{ Math.round(percent(segment.value)) }}% do total
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
