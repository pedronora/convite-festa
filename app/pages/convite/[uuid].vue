<script setup lang="ts">
import type { PublicInvitation, RsvpSummary } from '#shared/types'
import { defaultPartySettings } from '#shared/config/party'
import { celebrantAgeLabel, celebrantNames, formatDateLong } from '#shared/utils/format'

definePageMeta({ layout: 'public' })

const route = useRoute()
const uuid = String(route.params.uuid || '')
const { data: invitation, error, pending } = await useFetch<PublicInvitation>(
  `/api/public/invitations/${uuid}`,
  { key: `public-invitation-${uuid}` },
)

if (error.value?.statusCode === 404) {
  setResponseStatus(404)
}

const settings = computed(() => invitation.value?.settings ?? defaultPartySettings)
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const socialImage = computed(() => {
  const base = (config.public.appUrl as string) || requestUrl.origin
  return new URL(settings.value.inviteImageUrl || defaultPartySettings.inviteImageUrl, base).toString()
})
const socialTitle = computed(() => `Convite de ${celebrantNames(settings.value.celebrants)}`)
const socialDescription = computed(() => `Confirme sua presença na festa de aniversário de ${celebrantNames(settings.value.celebrants)}.`)

useHead(() => ({
  title: 'Seu convite',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
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

const leadCelebrant = computed(() => invitation.value?.settings.celebrants[0]?.name.toUpperCase() ?? '')
const otherCelebrants = computed(() => invitation.value?.settings.celebrants
  .slice(1)
  .map(celebrant => celebrant.name.toUpperCase())
  .join(' & ') ?? '')

const currentRsvp = ref<RsvpSummary | null>(null)
const mode = ref<'form' | 'summary'>('form')
const rsvpSection = ref<HTMLElement | null>(null)

watch(invitation, (value) => {
  if (!value?.existingRsvp) return
  const rsvp = value.existingRsvp
  currentRsvp.value = {
    ...rsvp,
    totalPeople: rsvp.adults + rsvp.children8to11 + rsvp.children0to7,
  }
  mode.value = 'summary'
}, { immediate: true })

function onSaved(rsvp: RsvpSummary) {
  currentRsvp.value = rsvp
  mode.value = 'summary'
  if (invitation.value) {
    invitation.value.existingRsvp = {
      attendanceStatus: rsvp.attendanceStatus,
      adults: rsvp.adults,
      children8to11: rsvp.children8to11,
      children0to7: rsvp.children0to7,
      responsibleName: rsvp.responsibleName,
      phone: rsvp.phone,
      email: rsvp.email,
      notes: rsvp.notes,
      confirmedAt: rsvp.confirmedAt,
      updatedAt: rsvp.updatedAt,
    }
  }
  nextTick(() => rsvpSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function startEdit() {
  mode.value = 'form'
  nextTick(() => rsvpSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// Links enviados chegam com #rsvp: garante o alinhamento mesmo se o navegador
// calcular a âncora antes da hidratação/fontes assentarem.
onMounted(async () => {
  if (route.hash !== '#rsvp') return
  await nextTick()
  requestAnimationFrame(() => rsvpSection.value?.scrollIntoView({ block: 'start' }))
})
</script>

<template>
  <div>
    <div
      v-if="pending && !invitation"
      class="mx-auto max-w-5xl px-4 py-12 sm:px-6"
    >
      <div class="grid gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <div class="skeleton h-6 w-40 rounded" />
          <div class="skeleton h-20 w-full rounded-2xl" />
          <div class="skeleton h-4 w-64 rounded" />
          <div class="skeleton h-32 w-full rounded-2xl" />
        </div>
        <div class="skeleton aspect-[2/3] w-full rounded-3xl" />
      </div>
    </div>

    <div
      v-else-if="error || !invitation"
      class="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6"
    >
      <span class="flex h-20 w-20 items-center justify-center rounded-3xl bg-spider-50 text-spider-600">
        <AppIcon
          name="link"
          :size="34"
        />
      </span>
      <h1 class="mt-5 font-display text-4xl text-navy-950">
        Convite não encontrado
      </h1>
      <p class="mt-2 text-sm font-semibold leading-relaxed text-navy-500">
        O link pode estar incompleto ou ter sido atualizado pelos anfitriões. Confira a mensagem recebida
        no WhatsApp ou peça um novo link para a família.
      </p>
      <AppButton
        to="/"
        variant="outline"
        class="mt-6"
      >
        <template #icon>
          <AppIcon
            name="chevron-left"
            :size="15"
          />
        </template>
        Voltar ao início
      </AppButton>
    </div>

    <template v-else>
      <!-- Hero -->
      <section class="relative overflow-hidden bg-navy-950 text-white">
        <div class="pointer-events-none absolute inset-0 text-sky-200/25">
          <WebDecoration
            class="absolute -left-20 -top-24 h-96 w-96"
            :opacity="0.45"
          />
          <WebDecoration
            class="absolute -bottom-32 -right-24 h-[26rem] w-[26rem]"
            :flip-x="true"
            :flip-y="true"
            :opacity="0.35"
          />
        </div>
        <div class="absolute -left-24 top-10 h-64 w-64 rounded-full bg-spider-600/30 blur-3xl" />
        <div class="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

        <div class="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-16">
          <div class="animate-slide-up">
            <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-100 backdrop-blur">
              <AppIcon
                name="sparkles"
                :size="13"
              />
              Você recebeu um convite especial
            </span>

            <h1 class="comic-title mt-5 text-5xl text-white sm:text-6xl xl:text-7xl">
              <span class="block text-spider-400">{{ leadCelebrant }}</span>
              <span
                v-if="otherCelebrants"
                class="mt-1 block text-4xl text-sky-200 sm:text-5xl xl:text-6xl"
              >E {{ otherCelebrants }}</span>
            </h1>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="(celebrant, index) in invitation.settings.celebrants"
                :key="`${celebrant.name}-${index}`"
                :class="[
                  'rounded-full border px-3 py-1 text-xs font-extrabold',
                  index % 2 === 0
                    ? 'border-spider-400/40 bg-spider-600/20 text-spider-200'
                    : 'border-sky-400/40 bg-sky-500/15 text-sky-200',
                ]"
              >
                {{ celebrant.name }} · {{ celebrantAgeLabel(celebrant.age) }}
              </span>
            </div>

            <p class="mt-5 max-w-lg text-sm font-semibold leading-relaxed text-navy-200 sm:text-base">
              {{ invitation.settings.rsvpIntro }}
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#rsvp"
                class="inline-flex items-center gap-2 rounded-xl border-2 border-spider-700 bg-spider-600 px-5 py-3 text-sm font-extrabold text-white shadow-comic-sm transition hover:-translate-y-0.5 hover:bg-spider-700 active:translate-y-0"
              >
                <AppIcon
                  name="calendar-check"
                  :size="17"
                />
                {{ currentRsvp ? 'Ver minha resposta' : 'Confirmar presença' }}
              </a>
              <a
                href="#detalhes"
                class="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                <AppIcon
                  name="mapPin"
                  :size="16"
                />
                Detalhes da festa
              </a>
            </div>

            <div class="mt-8 max-w-sm">
              <CountdownTimer :date="invitation.settings.partyDate" />
            </div>
          </div>

          <div class="animate-float mx-auto w-full max-w-sm lg:max-w-none">
            <InviteArt
              :src="invitation.settings.inviteImageUrl"
              eager
            />
          </div>
        </div>
      </section>

      <!-- Detalhes -->
      <section
        id="detalhes"
        class="scroll-mt-20 bg-cream/60 py-10 sm:py-14"
      >
        <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div class="mb-5 flex flex-col gap-1 sm:mb-6">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-spider-600">
              Prepare a fantasia
            </p>
            <h2 class="font-display text-3xl text-navy-950 sm:text-4xl">
              A festa vai ser épica!
            </h2>
            <p class="text-sm font-semibold text-navy-500">
              {{ formatDateLong(invitation.settings.partyDate) }}, às {{ invitation.settings.timeLabel }}.
            </p>
          </div>
          <PartyDetails :settings="invitation.settings" />

          <div class="mt-4 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <AppIcon
                name="info"
                :size="18"
                class="mt-0.5 shrink-0 text-sky-700"
              />
              <p class="text-xs font-semibold leading-relaxed text-sky-900">
                <strong class="font-extrabold">Endereço completo:</strong>
                {{ invitation.settings.address }} — {{ invitation.settings.neighborhood }},
                {{ invitation.settings.city }}/{{ invitation.settings.state }}.
              </p>
            </div>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.settings.mapsQuery)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-navy-800"
            >
              <AppIcon
                name="mapPin"
                :size="14"
              /> Abrir no mapa
            </a>
          </div>
        </div>
      </section>

      <!-- RSVP -->
      <section
        id="rsvp"
        ref="rsvpSection"
        class="scroll-mt-20 py-10 sm:py-14"
      >
        <div class="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div class="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <div class="order-2 lg:order-1">
              <RsvpSummary
                v-if="mode === 'summary' && currentRsvp"
                :invitation="invitation"
                :rsvp="currentRsvp"
                @edit="startEdit"
              />
              <div
                v-else
                class="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-soft"
              >
                <div class="border-b border-navy-100 bg-gradient-to-r from-spider-600 to-spider-700 px-5 py-5 text-white sm:px-7">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
                    {{ currentRsvp ? 'Atualizar resposta' : 'Confirmação de presença' }}
                  </p>
                  <h2 class="mt-1 font-display text-3xl">
                    {{ currentRsvp ? 'Quer mudar algo?' : 'Conta pra gente: você vem?' }}
                  </h2>
                  <p class="mt-1 text-xs font-semibold text-white/80">
                    Leva menos de um minuto. Depois você pode editar a qualquer momento por este link.
                  </p>
                </div>
                <div class="p-5 sm:p-7">
                  <RsvpForm
                    :key="currentRsvp?.updatedAt || 'new'"
                    :invitation="invitation"
                    @saved="onSaved"
                  />
                  <button
                    v-if="currentRsvp"
                    type="button"
                    class="mt-3 w-full text-center text-xs font-bold text-navy-400 underline underline-offset-2 hover:text-navy-700"
                    @click="mode = 'summary'"
                  >
                    Cancelar e voltar para minha resposta
                  </button>
                </div>
              </div>
            </div>

            <aside class="order-1 space-y-4 lg:order-2">
              <div class="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-card">
                <img
                  :src="invitation.settings.inviteImageUrl"
                  alt="Arte do convite"
                  class="max-h-80 w-full bg-navy-50 object-contain"
                >
              </div>
              <div class="rounded-3xl bg-navy-950 p-5 text-white">
                <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-300">
                  Resumo
                </p>
                <ul class="mt-3 space-y-3 text-sm font-semibold text-navy-100">
                  <li class="flex items-start gap-2.5">
                    <AppIcon
                      name="calendar"
                      :size="16"
                      class="mt-0.5 shrink-0 text-spider-300"
                    />
                    <span>{{ invitation.settings.dateLabel }}, às {{ invitation.settings.timeLabel }}</span>
                  </li>
                  <li class="flex items-start gap-2.5">
                    <AppIcon
                      name="mapPin"
                      :size="16"
                      class="mt-0.5 shrink-0 text-spider-300"
                    />
                    <span>{{ invitation.settings.venue }}<br><span class="text-xs font-medium text-navy-300">{{ invitation.settings.address }} · {{ invitation.settings.neighborhood }}</span></span>
                  </li>
                  <li class="flex items-start gap-2.5">
                    <AppIcon
                      name="users"
                      :size="16"
                      class="mt-0.5 shrink-0 text-spider-300"
                    />
                    <span>Convite de <strong class="text-white">{{ invitation.guest.groupName || invitation.guest.name }}</strong></span>
                  </li>
                </ul>
                <div
                  v-if="invitation.guest.maxGuests"
                  class="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-navy-200"
                >
                  Este convite permite até {{ invitation.guest.maxGuests }} pessoas.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
