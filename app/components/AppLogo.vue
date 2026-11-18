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
    <span class="relative inline-flex shrink-0 items-center justify-center rounded-2xl bg-spider-600 shadow-comic-sm" :class="compact ? 'h-9 w-9' : 'h-11 w-11'">
      <svg viewBox="0 0 64 64" class="h-full w-full" aria-hidden="true">
        <path d="M32 9c-13 0-22 9-22 21 0 13 10 21 22 25 12-4 22-12 22-25 0-12-9-21-22-21Z" fill="#0f2447" stroke="#fff" stroke-width="2"/>
        <path d="M16 23c4-8 10-11 16-11s12 3 16 11c-4 5-10 7-16 7s-12-2-16-7Z" fill="#fff"/>
        <path d="M20 23c3 3 7 4 12 4 1-4 3-7 5-9-6-2-13-1-17 5Zm24 0c-3 3-7 4-12 4-1-4-3-7-5-9 6-2 13-1 17 5Z" fill="#0f2447"/>
      </svg>
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
