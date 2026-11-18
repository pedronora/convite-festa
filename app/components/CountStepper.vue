<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  label: string
  description?: string
  icon?: string
  tone?: 'red' | 'sky' | 'amber'
  min?: number
  max?: number
  disabled?: boolean
}>(), {
  icon: 'user',
  tone: 'red',
  min: 0,
  max: 50,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const id = useId()

const tones = {
  red: 'bg-spider-50 text-spider-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
}

function setValue(value: number) {
  const safe = Number.isFinite(value) ? Math.round(value) : 0
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, safe)))
}

function decrement() {
  setValue(props.modelValue - 1)
}
function increment() {
  setValue(props.modelValue + 1)
}
function onInput(event: Event) {
  setValue(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div :class="['flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3', disabled ? 'opacity-60' : '']">
    <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone]]">
      <AppIcon
        :name="icon"
        :size="19"
      />
    </span>
    <div class="min-w-0 flex-1">
      <label
        :for="id"
        class="block text-sm font-extrabold text-navy-800"
      >{{ label }}</label>
      <p
        v-if="description"
        class="text-[11px] font-semibold text-navy-400"
      >
        {{ description }}
      </p>
    </div>
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-600 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled || modelValue <= min"
        :aria-label="`Diminuir ${label}`"
        @click="decrement"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          aria-hidden="true"
        ><path d="M5 12h14" /></svg>
      </button>
      <input
        :id="id"
        :value="modelValue"
        type="number"
        inputmode="numeric"
        min="0"
        :max="max"
        step="1"
        :disabled="disabled"
        class="h-9 w-12 rounded-lg border border-navy-200 text-center text-sm font-extrabold text-navy-900 focus:border-spider-500 focus:outline-none focus:ring-2 focus:ring-spider-100 disabled:bg-navy-50"
        @input="onInput"
      >
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-600 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled || modelValue >= max"
        :aria-label="`Aumentar ${label}`"
        @click="increment"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          aria-hidden="true"
        ><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  </div>
</template>
