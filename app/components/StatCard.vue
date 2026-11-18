<script setup lang="ts">
type Tone = 'red' | 'blue' | 'sky' | 'green' | 'amber' | 'navy'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  hint?: string
  icon?: string
  tone?: Tone
  suffix?: string
}>(), {
  icon: 'chart',
  tone: 'blue',
})

const tones: Record<Tone, { bg: string, text: string, ring: string }> = {
  red: { bg: 'bg-spider-50', text: 'text-spider-700', ring: 'ring-spider-100' },
  blue: { bg: 'bg-navy-50', text: 'text-navy-700', ring: 'ring-navy-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
  navy: { bg: 'bg-navy-900', text: 'text-white', ring: 'ring-navy-800' },
}

const formatted = computed(() => typeof props.value === 'number'
  ? new Intl.NumberFormat('pt-BR').format(props.value)
  : props.value)
</script>

<template>
  <div class="card-surface group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-navy-400">{{ label }}</p>
        <p class="mt-2 flex items-baseline gap-1">
          <span class="font-display text-4xl leading-none text-navy-950">{{ formatted }}</span>
          <span v-if="suffix" class="text-sm font-bold text-navy-400">{{ suffix }}</span>
        </p>
        <p v-if="hint" class="mt-2 text-xs font-semibold leading-snug text-navy-400">{{ hint }}</p>
      </div>
      <span :class="['inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4', tones[tone].bg, tones[tone].text, tones[tone].ring]">
        <AppIcon :name="icon" :size="22" />
      </span>
    </div>
  </div>
</template>
