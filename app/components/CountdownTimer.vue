<script setup lang="ts">
import { partyEnd } from '#shared/utils/format'

const props = defineProps<{ date: string }>()

const mounted = ref(false)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  mounted.value = true
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const remaining = computed(() => Math.max(0, new Date(props.date).getTime() - now.value))
const finished = computed(() => remaining.value <= 0)
const days = computed(() => Math.floor(remaining.value / 86_400_000))
const hours = computed(() => Math.floor((remaining.value % 86_400_000) / 3_600_000))
const minutes = computed(() => Math.floor((remaining.value % 3_600_000) / 60_000))
const seconds = computed(() => Math.floor((remaining.value % 60_000) / 1000))

const units = computed(() => [
  { label: 'dias', value: days.value },
  { label: 'horas', value: hours.value },
  { label: 'min', value: minutes.value },
  { label: 'seg', value: seconds.value },
])

const partyFinished = computed(() => partyEnd(props.date).getTime() < now.value)
</script>

<template>
  <div
    v-if="mounted && !partyFinished"
    class="rounded-2xl border border-navy-100 bg-white p-4 shadow-card"
  >
    <p class="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-navy-400">
      {{ finished ? 'A festa começou!' : 'Contagem regressiva para a festa' }}
    </p>
    <div class="mt-3 grid grid-cols-4 gap-2">
      <div
        v-for="unit in units"
        :key="unit.label"
        class="rounded-xl bg-navy-950 px-1 py-2.5 text-center text-white"
      >
        <p class="font-display text-2xl leading-none text-sky-200 sm:text-3xl">
          {{ String(unit.value).padStart(2, '0') }}
        </p>
        <p class="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-navy-300">
          {{ unit.label }}
        </p>
      </div>
    </div>
  </div>
</template>
