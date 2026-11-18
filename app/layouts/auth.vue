<script setup lang="ts">
import { defaultPartySettings, type PartySettings } from '#shared/config/party'
import { celebrantAgeLabel, celebrantNames, formatDayMonth, inviteeFirstName } from '#shared/utils/format'

const { data } = await useFetch<PartySettings>('/api/public/party', { key: 'party-settings-public' })
const party = computed(() => data.value ?? defaultPartySettings)
const partyNames = computed(() => celebrantNames(party.value.celebrants))
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-navy-950 lg:grid lg:grid-cols-[1.05fr_1fr]">
    <div class="pointer-events-none absolute inset-0 text-spider-300/30">
      <WebDecoration class="absolute -left-24 -top-24 h-[28rem] w-[28rem]" :opacity="0.5" />
      <WebDecoration class="absolute -bottom-32 -right-20 h-[26rem] w-[26rem]" :flip-x="true" :flip-y="true" :opacity="0.4" />
    </div>

    <section class="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
      <div class="absolute inset-0 bg-gradient-to-br from-spider-700/40 via-navy-950 to-navy-950" />
      <div class="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-spider-600/20 blur-3xl" />
      <div class="relative">
        <AppLogo variant="light" />
      </div>
      <div class="relative max-w-lg">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-sky-100">
          <AppIcon name="shield" :size="14" />
          Área restrita
        </span>
        <h1 class="comic-title mt-6 text-6xl text-white xl:text-7xl">
          ORGANIZE A<br>
          <span class="text-spider-400">GRANDE AVENTURA</span>
        </h1>
        <p class="mt-5 max-w-md text-base font-semibold leading-relaxed text-navy-200">
          Gerencie convidados, envie convites pelo WhatsApp e acompanhe cada confirmação em tempo real.
        </p>
        <div class="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
          <div
            v-for="(celebrant, index) in party.celebrants.slice(0, 2)"
            :key="`${celebrant.name}-${index}`"
            class="rounded-2xl border border-white/10 bg-white/5 p-3"
          >
            <p class="font-display text-2xl" :class="index % 2 === 0 ? 'text-spider-300' : 'text-sky-300'">{{ celebrant.age }}</p>
            <p class="text-[10px] font-bold uppercase tracking-wide text-navy-300">
              {{ celebrantAgeLabel(celebrant.age).replace(/^\d+ /, '') }} de {{ inviteeFirstName(celebrant.name) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p class="font-display text-2xl text-amber-300">{{ formatDayMonth(party.partyDate) }}</p>
            <p class="text-[10px] font-bold uppercase tracking-wide text-navy-300">a festa</p>
          </div>
        </div>
      </div>
      <p class="relative text-xs font-semibold text-navy-400">Painel do convite · {{ partyNames }}</p>
    </section>

    <section class="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-md">
        <div class="mb-6 flex justify-center lg:hidden">
          <AppLogo variant="light" />
        </div>
        <slot />
        <p class="mt-6 text-center text-xs font-semibold text-navy-400">
          <NuxtLink to="/" class="underline decoration-navy-600 underline-offset-4 transition hover:text-white">
            Voltar para a página do convite
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>
