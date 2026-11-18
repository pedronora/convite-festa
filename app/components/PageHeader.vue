<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
}>(), {
})
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p v-if="eyebrow" class="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-spider-600">
        <span class="h-1.5 w-1.5 rounded-full bg-spider-500" aria-hidden="true" />
        {{ eyebrow }}
      </p>
      <h1 class="font-display text-3xl leading-tight text-navy-950 sm:text-4xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1.5 max-w-2xl text-sm font-semibold text-navy-500">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
