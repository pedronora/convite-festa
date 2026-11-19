<script setup lang="ts">
import { defaultPartySettings, type PartySettings } from '#shared/config/party'
import { whatsappShareUrl } from '#shared/utils/phone'
import { celebrantNames, celebrantsAgesLabel, formatDateLong } from '#shared/utils/format'

definePageMeta({ layout: 'public' })

const { data } = await useFetch<PartySettings>('/api/public/party', { key: 'party-settings-public' })
const settings = computed(() => data.value ?? defaultPartySettings)

const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const socialImage = computed(() => {
  const base = (config.public.appUrl as string) || requestUrl.origin
  return new URL(settings.value.inviteImageUrl || defaultPartySettings.inviteImageUrl, base).toString()
})
const socialTitle = computed(() => `Aniversário de ${celebrantNames(settings.value.celebrants)}`)
const socialDescription = computed(() => `Festa de aniversário de ${celebrantNames(settings.value.celebrants)} — ${settings.value.dateLabel}, em ${settings.value.city}/${settings.value.state}.`)

useHead(() => ({
  title: 'Convite de aniversário',
  meta: [
    { name: 'description', content: socialDescription.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'pt_BR' },
    { property: 'og:title', content: socialTitle.value },
    { property: 'og:description', content: socialDescription.value },
    { property: 'og:image', content: socialImage.value },
    { property: 'og:image:alt', content: 'Arte do convite da festa' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
}))

const leadCelebrant = computed(() => settings.value.celebrants[0]?.name.toUpperCase() ?? '')
const otherCelebrants = computed(() => settings.value.celebrants
  .slice(1)
  .map(celebrant => celebrant.name.toUpperCase())
  .join(' & '))
const agesLabel = computed(() => celebrantsAgesLabel(settings.value.celebrants))
const helpWhatsAppUrl = computed(() => whatsappShareUrl(
  `Olá! Preciso do link do convite da festa de ${celebrantNames(settings.value.celebrants)}.`,
))
</script>

<template>
  <div>
    <section class="relative overflow-hidden bg-navy-950 text-white">
      <div class="pointer-events-none absolute inset-0 text-sky-200/25">
        <WebDecoration
          class="absolute -left-24 -top-24 h-[30rem] w-[30rem]"
          :opacity="0.5"
        />
        <WebDecoration
          class="absolute -bottom-40 -right-28 h-[32rem] w-[32rem]"
          :flip-x="true"
          :flip-y="true"
          :opacity="0.4"
        />
      </div>
      <div class="absolute left-1/3 top-0 h-72 w-72 rounded-full bg-spider-600/25 blur-3xl" />
      <div class="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

      <div class="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
        <div class="animate-slide-up">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-100 backdrop-blur">
            <AppIcon
              name="sparkles"
              :size="13"
            />
            Uma aventura de super-heróis
          </span>
          <h1 class="comic-title mt-5 text-6xl text-white sm:text-7xl xl:text-8xl">
            <span class="block text-spider-400">{{ leadCelebrant }}</span>
            <span
              v-if="otherCelebrants"
              class="mt-1 block text-4xl text-sky-200 sm:text-5xl xl:text-6xl"
            >&amp; {{ otherCelebrants }}</span>
          </h1>
          <p class="mt-3 font-display text-2xl tracking-wide text-white/90 sm:text-3xl">
            {{ agesLabel }} — vamos celebrar!
          </p>
          <p class="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-navy-200 sm:text-base">
            Estamos preparando uma comemoração muito especial e queremos você com a gente.
            O convite individual com o formulário de presença chega pelo WhatsApp.
          </p>
          <div class="mt-6 flex flex-wrap gap-2 text-xs font-extrabold">
            <span class="rounded-full border border-spider-400/40 bg-spider-600/20 px-3 py-1.5 text-spider-200">{{ settings.dateLabel }}</span>
            <span class="rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-sky-200">às {{ settings.timeLabel }}</span>
            <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white">{{ settings.venue }}</span>
          </div>
          <div class="mt-7 max-w-sm">
            <CountdownTimer :date="settings.partyDate" />
          </div>
        </div>

        <div class="animate-float mx-auto w-full max-w-sm lg:max-w-none">
          <InviteArt
            :src="settings.inviteImageUrl"
            eager
          />
        </div>
      </div>
    </section>

    <section class="bg-cream/60 py-10 sm:py-14">
      <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div class="mb-5">
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-spider-600">
            Anote aí
          </p>
          <h2 class="font-display text-3xl text-navy-950 sm:text-4xl">
            Detalhes da missão
          </h2>
          <p class="text-sm font-semibold text-navy-500">
            {{ formatDateLong(settings.partyDate) }} · {{ settings.venue }}
          </p>
        </div>
        <PartyDetails :settings="settings" />
      </div>
    </section>

    <section class="py-10 sm:py-14">
      <div class="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div class="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-spider-600">
              Confirmação de presença
            </p>
            <h2 class="mt-1 font-display text-3xl text-navy-950 sm:text-4xl">
              Como confirmar?
            </h2>
            <p class="mt-2 text-sm font-semibold leading-relaxed text-navy-500">
              Cada família recebeu um link exclusivo. Ele identifica seu convite, sugere seus dados e permite
              confirmar ou atualizar a resposta quantas vezes precisar.
            </p>
            <ol class="mt-5 space-y-3">
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spider-600 text-sm font-extrabold text-white">1</span>
                <div>
                  <p class="text-sm font-extrabold text-navy-900">
                    Abra a mensagem no WhatsApp
                  </p>
                  <p class="text-xs font-semibold text-navy-400">
                    O link individual está na mensagem que você recebeu.
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spider-600 text-sm font-extrabold text-white">2</span>
                <div>
                  <p class="text-sm font-extrabold text-navy-900">
                    Preencha a confirmação
                  </p>
                  <p class="text-xs font-semibold text-navy-400">
                    Informe adultos e crianças em cada faixa etária.
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spider-600 text-sm font-extrabold text-white">3</span>
                <div>
                  <p class="text-sm font-extrabold text-navy-900">
                    Pronto! Nos vemos na festa
                  </p>
                  <p class="text-xs font-semibold text-navy-400">
                    Você pode voltar ao link depois para editar a resposta.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div class="relative overflow-hidden rounded-3xl border border-sky-200 bg-sky-50 p-6">
            <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 text-sky-300/50">
              <WebDecoration :opacity="0.6" />
            </div>
            <AppIcon
              name="whatsapp"
              :size="34"
              class="text-emerald-600"
            />
            <h3 class="mt-3 font-display text-2xl text-navy-950">
              Recebeu seu link?
            </h3>
            <p class="mt-1 text-sm font-semibold leading-relaxed text-navy-600">
              Toque no link enviado no WhatsApp para abrir a página do seu convite. Se precisar de um novo link,
              fale com os anfitriões.
            </p>
            <a
              :href="helpWhatsAppUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-extrabold text-[#073b1e] transition hover:bg-[#1fbe5a]"
            >
              <AppIcon
                name="whatsapp"
                :size="15"
              />
              Falar com os anfitriões
            </a>
            <p class="mt-3 text-[10px] font-semibold text-sky-800/70">
              Este link abre o WhatsApp sem destinatário definido.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="pb-12">
      <div class="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div class="relative overflow-hidden rounded-3xl bg-spider-600 px-6 py-8 text-center text-white sm:px-10">
          <div class="pointer-events-none absolute inset-0 text-white opacity-15">
            <WebDecoration class="absolute -left-16 -top-20 h-64 w-64" />
            <WebDecoration
              class="absolute -bottom-24 -right-20 h-72 w-72"
              :flip-x="true"
              :flip-y="true"
            />
          </div>
          <p class="relative font-display text-3xl sm:text-4xl">
            Mal podemos esperar para celebrar com vocês! 🕸️
          </p>
          <p class="relative mt-2 text-sm font-semibold text-white/85">
            {{ settings.dateLabel }}, às {{ settings.timeLabel }} · {{ settings.venue }} · {{ settings.city }}/{{ settings.state }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
