<script setup lang="ts">
interface Segment {
  label: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{
  segments: Segment[]
  centerLabel?: string
  centerValue?: string | number
  size?: number
}>(), {
  centerLabel: 'total',
  size: 176,
})

const total = computed(() => props.segments.reduce((sum, segment) => sum + segment.value, 0))
const radius = 62
const circumference = 2 * Math.PI * radius

const slices = computed(() => {
  let offset = 0
  return props.segments.map((segment) => {
    const fraction = total.value > 0 ? segment.value / total.value : 0
    const slice = {
      ...segment,
      dash: `${fraction * circumference} ${circumference}`,
      offset: -offset * circumference,
      percent: total.value > 0 ? Math.round(fraction * 100) : 0,
    }
    offset += fraction
    return slice
  })
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :viewBox="`0 0 ${size} ${size}`" class="h-full w-full -rotate-90" role="img" :aria-label="`Status das confirmações. ${segments.map(s => `${s.label}: ${s.value}`).join(', ')}`">
        <circle :cx="size / 2" :cy="size / 2" :r="radius" fill="none" stroke="#eef2f8" stroke-width="18" />
        <circle
          v-for="slice in slices"
          :key="slice.label"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="slice.color"
          stroke-width="18"
          stroke-linecap="round"
          :stroke-dasharray="slice.dash"
          :stroke-dashoffset="slice.offset"
          class="transition-all duration-700"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="font-display text-4xl leading-none text-navy-950">{{ total }}</span>
        <span class="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-navy-400">{{ centerLabel }}</span>
      </div>
    </div>
    <ul class="w-full space-y-2.5">
      <li v-for="slice in slices" :key="slice.label" class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: slice.color }" aria-hidden="true" />
        <span class="flex-1 text-sm font-semibold text-navy-600">{{ slice.label }}</span>
        <span class="text-sm font-extrabold text-navy-900">{{ slice.value }}</span>
        <span class="w-9 text-right text-[11px] font-bold text-navy-400">{{ slice.percent }}%</span>
      </li>
      <li v-if="total === 0" class="text-sm text-navy-400">Sem dados ainda.</li>
    </ul>
  </div>
</template>
