<script setup lang="ts">
interface BarItem {
  label: string
  value: number
  color: string
  hint?: string
}

const props = withDefaults(defineProps<{
  items: BarItem[]
  unit?: string
}>(), {
  unit: '',
})

const max = computed(() => Math.max(1, ...props.items.map(item => item.value)))

function width(value: number): string {
  return `${Math.max(value > 0 ? 8 : 0, Math.round((value / max.value) * 100))}%`
}
</script>

<template>
  <div
    class="space-y-4"
    role="img"
    :aria-label="`Gráfico de barras. ${items.map(item => `${item.label}: ${item.value}${unit ? ` ${unit}` : ''}`).join(', ')}`"
  >
    <div
      v-for="item in items"
      :key="item.label"
    >
      <div class="mb-1.5 flex items-baseline justify-between gap-3">
        <span class="text-sm font-bold text-navy-700">{{ item.label }}</span>
        <span class="text-sm font-extrabold text-navy-950">
          {{ item.value }}<span
            v-if="unit"
            class="ml-1 text-[11px] font-semibold text-navy-400"
          >{{ unit }}</span>
        </span>
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-navy-100/80">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :style="{ width: width(item.value), backgroundColor: item.color }"
        />
      </div>
      <p
        v-if="item.hint"
        class="mt-1 text-[11px] font-semibold text-navy-400"
      >
        {{ item.hint }}
      </p>
    </div>
  </div>
</template>
