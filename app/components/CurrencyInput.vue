<script setup lang="ts">
import { formatCentsInput, parseCurrencyToCents } from '#shared/utils/money'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue: number | null
  id?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '0,00',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const text = ref('')
const focused = ref(false)

watch(() => props.modelValue, (value) => {
  if (!focused.value) text.value = formatCentsInput(value)
}, { immediate: true })

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  text.value = input.value
  emit('update:modelValue', parseCurrencyToCents(input.value))
}

function onBlur() {
  focused.value = false
  text.value = formatCentsInput(props.modelValue)
}
</script>

<template>
  <div class="relative">
    <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-navy-400">
      R$
    </span>
    <input
      :id="id"
      v-bind="$attrs"
      :value="text"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input-base pl-10"
      @focus="focused = true"
      @blur="onBlur"
      @input="onInput"
    >
  </div>
</template>
