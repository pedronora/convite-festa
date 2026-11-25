<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'light' | 'dark'
  compact?: boolean
}>(), {
  variant: 'dark',
  compact: false,
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span
      class="relative inline-flex shrink-0 items-center justify-center rounded-2xl bg-spider-600 shadow-comic-sm"
      :class="compact ? 'h-9 w-9' : 'h-11 w-11'"
    >
      <SpiderMark class="h-[88%] w-[88%] text-navy-900" />
    </span>
    <span class="leading-none">
      <span
        class="font-display block text-xl tracking-wide"
        :class="variant === 'dark' ? 'text-white' : 'text-navy-950'"
      >LUIGI <span class="text-spider-500">&</span> MARCO</span>
      <span
        class="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.22em]"
        :class="variant === 'dark' ? 'text-navy-300' : 'text-navy-400'"
      >{{ compact ? 'Painel' : 'Convite de aniversário' }}</span>
    </span>
  </div>
</template>
