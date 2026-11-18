<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  for?: string
  error?: string | null
  hint?: string
  required?: boolean
}>(), {
  error: null,
})
</script>

<template>
  <div class="space-y-1.5">
    <label
      :for="$props.for"
      class="block text-sm font-bold text-navy-800"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-spider-600"
        aria-hidden="true"
      >*</span>
      <span
        v-if="required"
        class="sr-only"
      >(obrigatório)</span>
    </label>
    <slot />
    <p
      v-if="error"
      class="flex items-start gap-1 text-xs font-semibold text-spider-700"
      role="alert"
    >
      <AppIcon
        name="alert"
        :size="14"
        class="mt-px shrink-0"
      />
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="text-xs text-navy-400"
    >
      {{ hint }}
    </p>
  </div>
</template>
