<script setup lang="ts">
import { defaultPartySettings, type PartySettings } from '#shared/config/party'
import { celebrantNames } from '#shared/utils/format'

const { data } = await useFetch<PartySettings>('/api/public/party', { key: 'party-settings-public' })
const settings = computed(() => data.value ?? defaultPartySettings)
const partyNames = computed(() => celebrantNames(settings.value.celebrants))
</script>

<template>
  <div class="flex min-h-screen flex-col bg-paper">
    <a href="#conteudo" class="skip-link">Pular para o conteúdo</a>
    <header class="no-print sticky top-0 z-30 border-b border-navy-100/80 bg-white/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <NuxtLink to="/" class="rounded-xl" aria-label="Página inicial do convite">
          <AppLogo variant="light" compact />
        </NuxtLink>
        <div class="flex items-center gap-2">
          <span class="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 sm:inline-flex">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Confirmação de presença
          </span>
          <NuxtLink
            to="/admin/login"
            class="rounded-lg px-2.5 py-2 text-xs font-bold text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
          >
            Painel
          </NuxtLink>
        </div>
      </div>
    </header>

    <main id="conteudo" class="flex-1">
      <slot />
    </main>

    <footer class="no-print mt-12 border-t border-navy-100 bg-white">
      <div class="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs font-semibold text-navy-400 sm:flex-row sm:px-6 sm:text-left">
        <p>Feito com carinho para a festa de {{ partyNames }}. 🕸️</p>
        <p>{{ settings.dateLabel }} · {{ settings.venue }} · {{ settings.city }}/{{ settings.state }}</p>
      </div>
    </footer>
  </div>
</template>
