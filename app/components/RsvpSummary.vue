<script setup lang="ts">
import type { PublicInvitation, RsvpSummary } from '#shared/types'
import { formatDateTime, googleCalendarUrl, mapsUrl, guestsSummary } from '#shared/utils/format'

const props = defineProps<{
  invitation: PublicInvitation
  rsvp: RsvpSummary
}>()

const emit = defineEmits<{ edit: [] }>()

const isAttending = computed(() => props.rsvp.attendanceStatus === 'yes')
const mapLink = computed(() => mapsUrl(props.invitation.settings))
const calendarLink = computed(() => googleCalendarUrl(props.invitation.settings, props.invitation.uuid))
const icsLink = computed(() => `/api/public/invitations/${props.invitation.uuid}/calendar`)
</script>

<template>
  <div class="animate-pop overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-soft">
    <div :class="['relative overflow-hidden px-5 py-6 text-white sm:px-7', isAttending ? 'bg-emerald-600' : 'bg-navy-900']">
      <div class="pointer-events-none absolute inset-0 opacity-15">
        <WebDecoration class="absolute -right-14 -top-16 h-56 w-56" />
      </div>
      <div class="relative flex items-start gap-4">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <AppIcon
            :name="isAttending ? 'check-circle' : 'x-circle'"
            :size="26"
          />
        </span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
            {{ isAttending ? 'Presença confirmada' : 'Resposta registrada' }}
          </p>
          <h2 class="mt-1 font-display text-3xl leading-tight sm:text-4xl">
            {{ isAttending ? 'Nos vemos na festa!' : 'Obrigado por avisar!' }}
          </h2>
        </div>
      </div>
      <p class="relative mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white/90">
        {{ isAttending ? invitation.settings.successMessage : invitation.settings.declineMessage }}
      </p>
    </div>

    <div class="space-y-5 p-5 sm:p-7">
      <div
        v-if="isAttending"
        class="grid grid-cols-4 gap-2 text-center"
      >
        <div class="rounded-xl bg-spider-50 p-2.5">
          <p class="font-display text-2xl text-spider-700">
            {{ rsvp.adults }}
          </p>
          <p class="text-[9px] font-extrabold uppercase tracking-wide text-spider-700/70">
            Adultos
          </p>
        </div>
        <div class="rounded-xl bg-sky-50 p-2.5">
          <p class="font-display text-2xl text-sky-700">
            {{ rsvp.children8to11 }}
          </p>
          <p class="text-[9px] font-extrabold uppercase tracking-wide text-sky-700/70">
            8 a 11
          </p>
        </div>
        <div class="rounded-xl bg-amber-50 p-2.5">
          <p class="font-display text-2xl text-amber-700">
            {{ rsvp.children0to7 }}
          </p>
          <p class="text-[9px] font-extrabold uppercase tracking-wide text-amber-700/70">
            0 a 7
          </p>
        </div>
        <div class="rounded-xl bg-navy-950 p-2.5 text-white">
          <p class="font-display text-2xl text-white">
            {{ rsvp.totalPeople }}
          </p>
          <p class="text-[9px] font-extrabold uppercase tracking-wide text-navy-300">
            Total
          </p>
        </div>
      </div>

      <div
        v-else
        class="rounded-2xl bg-navy-50 p-4"
      >
        <p class="text-sm font-extrabold text-navy-800">
          Sua resposta: não poderá comparecer
        </p>
        <p class="mt-1 text-xs font-semibold text-navy-500">
          Se os planos mudarem, é só voltar a este link e atualizar sua resposta.
        </p>
      </div>

      <div class="space-y-2 rounded-2xl border border-navy-100 p-4">
        <div class="flex items-start justify-between gap-3">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
            Confirmação de
          </p>
          <button
            type="button"
            class="text-[11px] font-extrabold text-spider-600 underline underline-offset-2 hover:text-spider-800"
            @click="emit('edit')"
          >
            Atualizar resposta
          </button>
        </div>
        <p class="text-sm font-extrabold text-navy-900">
          {{ rsvp.responsibleName }}
        </p>
        <p class="text-xs font-semibold text-navy-500">
          {{ guestsSummary(rsvp.adults, rsvp.children8to11, rsvp.children0to7) || 'Sem acompanhantes' }}
        </p>
        <p
          v-if="rsvp.notes"
          class="rounded-lg bg-navy-50 p-2.5 text-xs font-medium italic text-navy-600"
        >
          “{{ rsvp.notes }}”
        </p>
        <p class="border-t border-navy-100 pt-2 text-[10px] font-semibold text-navy-400">
          Registrada em {{ formatDateTime(rsvp.confirmedAt) }}
          <span v-if="rsvp.updatedAt !== rsvp.confirmedAt"> · atualizada em {{ formatDateTime(rsvp.updatedAt) }}</span>
        </p>
      </div>

      <div class="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
        <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
          Informações da festa
        </p>
        <p class="mt-1 text-sm font-extrabold text-navy-900">
          {{ invitation.settings.dateLabel }} · {{ invitation.settings.timeLabel }}
        </p>
        <p class="text-xs font-semibold text-navy-500">
          {{ invitation.settings.venue }} — {{ invitation.settings.address }}, {{ invitation.settings.neighborhood }}, {{ invitation.settings.city }}/{{ invitation.settings.state }}
        </p>
      </div>

      <div
        v-if="isAttending"
        class="grid gap-2 sm:grid-cols-3"
      >
        <a
          :href="calendarLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-200 bg-white px-3 py-2.5 text-xs font-extrabold text-navy-700 transition hover:bg-navy-50"
        >
          <AppIcon
            name="calendar"
            :size="15"
          /> Google Agenda
        </a>
        <a
          :href="icsLink"
          download
          class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-200 bg-white px-3 py-2.5 text-xs font-extrabold text-navy-700 transition hover:bg-navy-50"
        >
          <AppIcon
            name="download"
            :size="15"
          /> Baixar .ics
        </a>
        <a
          :href="mapLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-200 bg-white px-3 py-2.5 text-xs font-extrabold text-navy-700 transition hover:bg-navy-50"
        >
          <AppIcon
            name="mapPin"
            :size="15"
          /> Como chegar
        </a>
      </div>

      <div class="flex items-center gap-2 rounded-xl bg-sky-50 p-3 text-[11px] font-semibold text-sky-900">
        <AppIcon
          name="info"
          :size="15"
          class="shrink-0"
        />
        Guarde este link: você pode voltar a qualquer momento para consultar ou atualizar sua resposta.
      </div>
    </div>
  </div>
</template>
