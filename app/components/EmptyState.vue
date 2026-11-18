<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
}>(), {
  icon: 'sparkles',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-navy-200 bg-white/60 px-6 py-12 text-center">
    <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
      <AppIcon
        :name="icon"
        :size="26"
      />
    </span>
    <h3 class="mt-4 text-base font-extrabold text-navy-900">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 max-w-sm text-sm text-navy-500"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-5"
    >
      <slot name="action" />
    </div>
  </div>
</template>
