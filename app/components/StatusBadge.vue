<script setup lang="ts">
const props = withDefaults(defineProps<{
  kind: 'send' | 'rsvp'
  status: string
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const config = computed(() => {
  if (props.kind === 'send') {
    return {
      not_sent: { label: 'Não enviado', icon: 'clock', classes: 'bg-navy-100 text-navy-600 border-navy-200' },
      sent: { label: 'Enviado', icon: 'check-circle', classes: 'bg-sky-50 text-sky-800 border-sky-200' },
      failed: { label: 'Falha no envio', icon: 'alert', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
    }[props.status] ?? { label: 'Não enviado', icon: 'clock', classes: 'bg-navy-100 text-navy-600 border-navy-200' }
  }
  return {
    awaiting: { label: 'Aguardando resposta', icon: 'clock', classes: 'bg-navy-100 text-navy-700 border-navy-200' },
    yes: { label: 'Confirmado', icon: 'check-circle', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    no: { label: 'Não comparecerá', icon: 'x-circle', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[props.status] ?? { label: 'Aguardando resposta', icon: 'clock', classes: 'bg-navy-100 text-navy-700 border-navy-200' }
})

const sizeClasses = computed(() => props.size === 'sm'
  ? 'text-[11px] px-2 py-0.5 gap-1'
  : 'text-xs px-2.5 py-1 gap-1.5')
</script>

<template>
  <span
    :class="['inline-flex items-center rounded-full border font-bold whitespace-nowrap', sizeClasses, config.classes]"
  >
    <AppIcon :name="config.icon" :size="size === 'sm' ? 11 : 13" :stroke-width="2.5" />
    {{ config.label }}
  </span>
</template>
