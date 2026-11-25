<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  eager?: boolean
}>(), {
  alt: 'Convite da festa',
  eager: false,
})

const failed = ref(false)
const resolvedSrc = computed(() => failed.value ? '/images/convite-padrao.svg' : props.src)

watch(() => props.src, () => {
  failed.value = false
})
</script>

<template>
  <div class="relative">
    <div
      class="absolute -inset-2 rotate-2 rounded-3xl bg-spider-500/20"
      aria-hidden="true"
    />
    <div
      class="absolute -inset-1 -rotate-1 rounded-3xl bg-sky-glow/20"
      aria-hidden="true"
    />
    <div class="relative overflow-hidden rounded-2xl border-4 border-white bg-navy-950 shadow-2xl">
      <img
        :src="resolvedSrc"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        class="block max-h-[70vh] w-full object-contain"
        @error="failed = true"
      >
    </div>
    <div class="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-spider-600 shadow-lg">
      <SpiderMark class="h-8 w-8 text-navy-900" />
    </div>
  </div>
</template>
