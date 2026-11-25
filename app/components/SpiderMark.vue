<script setup lang="ts">
withDefaults(defineProps<{
  strokeWidth?: number
}>(), {
  strokeWidth: 3.4,
})
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <g
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M26 20 19 13 10 15M25 24 14 21 6 26M25 29 13 32 7 40M27 34 18 42 15 52" />
      <path d="M38 20 45 13 54 15M39 24 50 21 58 26M39 29 51 32 57 40M37 34 46 42 49 52" />
    </g>
    <ellipse
      cx="32"
      cy="39"
      rx="9"
      ry="11"
      fill="currentColor"
    />
    <circle
      cx="32"
      cy="24"
      r="7.5"
      fill="currentColor"
    />
    <circle
      cx="29"
      cy="22"
      r="1.7"
      fill="#fff"
    />
    <circle
      cx="35"
      cy="22"
      r="1.7"
      fill="#fff"
    />
  </svg>
</template>
