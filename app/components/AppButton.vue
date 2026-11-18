<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp' | 'light'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: string
  href?: string
  target?: string
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const variants: Record<Variant, string> = {
  primary:
    'bg-spider-600 text-white border-2 border-spider-700 shadow-comic-sm hover:bg-spider-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
  secondary:
    'bg-navy-900 text-white border-2 border-navy-950 shadow-comic-sm hover:bg-navy-800 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
  outline:
    'bg-white text-navy-800 border-2 border-navy-200 hover:border-navy-300 hover:bg-navy-50',
  ghost:
    'bg-transparent text-navy-600 hover:bg-navy-100/70 hover:text-navy-900',
  danger:
    'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100',
  whatsapp:
    'bg-[#25D366] text-[#073b1e] border-2 border-[#1aab52] shadow-comic-sm hover:bg-[#1fbe5a] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
  light:
    'bg-white/10 text-white border border-white/25 backdrop-blur hover:bg-white/20',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-2 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
  lg: 'text-base px-6 py-3.5 gap-2.5 rounded-2xl',
}

const classes = computed(() => [
  'inline-flex items-center justify-center font-extrabold transition-all duration-200 select-none',
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
  props.disabled || props.loading ? 'pointer-events-none opacity-60' : '',
])
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
    :aria-disabled="disabled || loading || undefined"
  >
    <AppIcon v-if="loading" name="loader" :size="16" class="animate-spin" />
    <slot v-else name="icon" />
    <slot />
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    :target="target"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    :class="classes"
    :aria-disabled="disabled || loading || undefined"
  >
    <AppIcon v-if="loading" name="loader" :size="16" class="animate-spin" />
    <slot v-else name="icon" />
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <AppIcon v-if="loading" name="loader" :size="16" class="animate-spin" />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>
