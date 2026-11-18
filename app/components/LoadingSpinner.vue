<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  size?: number
}>(), {
  label: 'Carregando…',
  size: 28,
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 py-10 text-navy-400"
    role="status"
  >
    <AppIcon
      name="loader"
      :size="size"
      class="animate-spin text-spider-500"
    />
    <span class="text-sm font-semibold">{{ label }}</span>
  </div>
</template>
