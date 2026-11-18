<script setup lang="ts">
withDefaults(defineProps<{
  src: string
  alt?: string
  eager?: boolean
}>(), {
  alt: 'Convite da festa',
  eager: false,
})
</script>

<template>
  <div class="relative">
    <div class="absolute -inset-2 rotate-2 rounded-3xl bg-spider-500/20" aria-hidden="true" />
    <div class="absolute -inset-1 -rotate-1 rounded-3xl bg-sky-glow/20" aria-hidden="true" />
    <div class="relative overflow-hidden rounded-2xl border-4 border-white bg-navy-950 shadow-2xl">
      <img
        :src="src"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        class="block max-h-[70vh] w-full object-contain"
      >
    </div>
    <div class="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-spider-600 text-white shadow-lg">
      <svg viewBox="0 0 64 64" class="h-8 w-8" aria-hidden="true">
        <path d="M32 9c-13 0-22 9-22 21 0 13 10 21 22 25 12-4 22-12 22-25 0-12-9-21-22-21Z" fill="#0f2447" stroke="#fff" stroke-width="2"/>
        <path d="M16 23c4-8 10-11 16-11s12 3 16 11c-4 5-10 7-16 7s-12-2-16-7Z" fill="#fff"/>
        <path d="M20 23c3 3 7 4 12 4 1-4 3-7 5-9-6-2-13-1-17 5Zm24 0c-3 3-7 4-12 4-1-4-3-7-5-9 6-2 13-1 17 5Z" fill="#0f2447"/>
      </svg>
    </div>
  </div>
</template>
