<script setup lang="ts">
import type { CountryCode } from 'libphonenumber-js'
import { DEFAULT_PHONE_COUNTRY } from '#shared/config/countries'

const props = withDefaults(defineProps<{
  id: string
  modelValue: string
  country?: CountryCode
}>(), {
  country: DEFAULT_PHONE_COUNTRY,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:country': [value: CountryCode]
}>()

const PLACEHOLDERS: Partial<Record<CountryCode, string>> = {
  BR: '(45) 99999-9999',
  AR: '11 4123-4567',
  US: '(202) 555-0143',
}

const placeholder = computed(() => PLACEHOLDERS[props.country] ?? 'Número com DDD')

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex gap-2">
    <CountrySelect
      :model-value="props.country"
      @update:model-value="emit('update:country', $event)"
    />
    <input
      :id="props.id"
      :value="props.modelValue"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      class="input-base min-w-0 flex-1"
      maxlength="25"
      :placeholder="placeholder"
      @input="onInput"
    >
  </div>
</template>
