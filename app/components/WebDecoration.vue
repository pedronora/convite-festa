<script setup lang="ts">
withDefaults(defineProps<{
  flipX?: boolean
  flipY?: boolean
  opacity?: number
}>(), {
  opacity: 0.28,
})
</script>

<template>
  <svg
    viewBox="0 0 320 320"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    aria-hidden="true"
    :style="{ opacity, transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }"
  >
    <path d="M0 0 320 320M0 0 260 320M0 0 200 320M0 0 140 320M0 0 80 320M0 0 320 260M0 0 320 200M0 0 320 140M0 0 320 80" />
    <path d="M48 0Q52 46 98 50M106 0Q110 92 204 100M172 0Q174 132 312 144" />
    <path d="M0 48Q46 52 50 98M0 106Q92 110 100 204M0 172Q132 174 144 312" />
    <circle
      cx="0"
      cy="0"
      r="64"
    /><circle
      cx="0"
      cy="0"
      r="128"
    /><circle
      cx="0"
      cy="0"
      r="192"
    /><circle
      cx="0"
      cy="0"
      r="256"
    />
  </svg>
</template>
