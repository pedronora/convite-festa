<script setup lang="ts">
import type { DashboardData } from '#shared/types'
import type { PartySettings } from '#shared/config/party'
import { formatDateTime, formatDateLong } from '#shared/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Dashboard' })

const { data, pending, error, refresh } = await useFetch<DashboardData>('/api/admin/dashboard', {
  key: 'admin-dashboard',
})
const { data: party } = await useFetch<PartySettings>('/api/public/party', {
  key: 'party-settings-public',
})

const metrics = computed(() => data.value?.metrics)
const charts = computed(() => data.value?.charts)
const refreshing = ref(false)

async function reload() {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

const statusSegments = computed(() => [
  { label: 'Confirmados', value: charts.value?.confirmationStatus.confirmed ?? 0, color: '#10b981' },
  { label: 'Não comparecerão', value: charts.value?.confirmationStatus.declined ?? 0, color: '#f43f5e' },
  { label: 'Aguardando', value: charts.value?.confirmationStatus.awaiting ?? 0, color: '#94b3dd' },
])

const ageBars = computed(() => [
  { label: 'Adultos', value: metrics.value?.adults ?? 0, color: '#c81e2b' },
  { label: 'Crianças de 8 a 11 anos', value: metrics.value?.children8to11 ?? 0, color: '#38bdf8' },
  { label: 'Crianças de 0 a 7 anos', value: metrics.value?.children0to7 ?? 0, color: '#f6c445' },
])

const sendBars = computed(() => [
  { label: 'Enviados', value: charts.value?.sendStatus.sent ?? 0, color: '#2d5592' },
  { label: 'Não enviados', value: charts.value?.sendStatus.notSent ?? 0, color: '#cbd5e1' },
  { label: 'Com falha no envio', value: charts.value?.sendStatus.failed ?? 0, color: '#f59e0b' },
])
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Visão geral da festa"
      title="Dashboard"
      :subtitle="party ? `Aniversário de ${party.celebrants.map(c => c.name).join(' e ')} · ${formatDateLong(party.partyDate)} · ${party.venue}` : 'Acompanhe convites, envios e confirmações.'"
    >
      <template #actions>
        <AppButton variant="outline" size="sm" :loading="refreshing" @click="reload">
          <template #icon><AppIcon name="refresh" :size="15" /></template>
          Atualizar
        </AppButton>
        <AppButton to="/admin/convidados?novo=1" size="sm">
          <template #icon><AppIcon name="plus" :size="16" /></template>
          Novo convidado
        </AppButton>
      </template>
    </PageHeader>

    <AppAlert v-if="error" type="error" title="Não foi possível carregar o dashboard" class="mb-6">
      {{ apiErrorMessage(error) }}
      <button type="button" class="ml-2 underline" @click="reload">Tentar novamente</button>
    </AppAlert>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
      <div v-for="index in 8" :key="index" class="card-surface p-5">
        <div class="skeleton h-3 w-24 rounded" />
        <div class="skeleton mt-4 h-10 w-20 rounded-lg" />
        <div class="skeleton mt-3 h-3 w-32 rounded" />
      </div>
    </div>

    <template v-else-if="data && metrics && charts">
      <!-- Indicadores principais -->
      <section aria-label="Indicadores principais" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de convites"
          :value="metrics.totalInvites"
          hint="Pessoas, famílias ou grupos convidados"
          icon="ticket"
          tone="blue"
        />
        <StatCard
          label="Convites enviados"
          :value="metrics.sentInvites"
          :hint="`${metrics.pendingInvites} aguardando envio${metrics.failedInvites ? ` · ${metrics.failedInvites} com falha` : ''}`"
          icon="send"
          tone="sky"
        />
        <StatCard
          label="Confirmações recebidas"
          :value="metrics.totalConfirmedInvites + metrics.totalDeclinedInvites"
          :hint="`${metrics.awaitingInvites} convites ainda sem resposta`"
          icon="check-circle"
          tone="green"
        />
        <StatCard
          label="Pessoas confirmadas"
          :value="metrics.totalPeople"
          hint="Soma de adultos e crianças nos RSVPs positivos"
          icon="party"
          tone="red"
        />
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <!-- Destaque de pessoas -->
        <section class="relative overflow-hidden rounded-3xl bg-navy-950 p-6 text-white shadow-soft">
          <div class="pointer-events-none absolute inset-0 text-white opacity-10">
            <WebDecoration class="absolute -right-16 -top-16 h-72 w-72" />
            <WebDecoration class="absolute -bottom-24 -left-16 h-64 w-64" :flip-x="true" :flip-y="true" />
          </div>
          <div class="relative">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-200">Time da festa</p>
            <div class="mt-2 flex items-end gap-3">
              <span class="font-display text-6xl leading-none text-white">{{ metrics.totalPeople }}</span>
              <span class="mb-1 text-sm font-bold text-navy-200">pessoas confirmadas</span>
            </div>
            <p class="mt-2 max-w-md text-xs font-semibold text-navy-300">
              Soma real dos RSVPs positivos — não confundir com o número de convites confirmados
              ({{ metrics.totalConfirmedInvites }}).
            </p>
            <div class="mt-5 grid grid-cols-3 gap-2.5">
              <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p class="font-display text-2xl text-spider-300">{{ metrics.adults }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-300">Adultos</p>
              </div>
              <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p class="font-display text-2xl text-sky-300">{{ metrics.children8to11 }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-300">8 a 11 anos</p>
              </div>
              <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p class="font-display text-2xl text-amber-300">{{ metrics.children0to7 }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-300">0 a 7 anos</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Progresso -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">Evolução das confirmações</h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">Percentuais sobre os convites enviados e o total.</p>
            </div>
            <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
              {{ metrics.confirmationRate }}% confirmado
            </span>
          </div>
          <div class="mt-5 space-y-5">
            <ProgressBar
              :value="metrics.confirmationRate"
              label="Confirmação sobre convites enviados"
              color="#10b981"
            />
            <ProgressBar
              :value="metrics.awaitingRate"
              label="Convidados que ainda não responderam"
              color="#3d6dae"
            />
            <div class="grid grid-cols-3 gap-2 border-t border-navy-100 pt-4 text-center">
              <div>
                <p class="font-display text-2xl text-emerald-600">{{ metrics.totalConfirmedInvites }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-400">Vão comparecer</p>
              </div>
              <div>
                <p class="font-display text-2xl text-rose-500">{{ metrics.totalDeclinedInvites }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-400">Não vão</p>
              </div>
              <div>
                <p class="font-display text-2xl text-navy-400">{{ metrics.awaitingInvites }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-navy-400">Sem resposta</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Gráficos -->
      <section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Gráficos da festa">
        <div class="card-surface p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">Status das confirmações</h2>
              <p class="text-xs font-semibold text-navy-400">Por convite (família ou pessoa)</p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <AppIcon name="chart" :size="18" />
            </span>
          </div>
          <DonutChart :segments="statusSegments" center-label="convites" />
        </div>

        <div class="card-surface p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">Pessoas por faixa etária</h2>
              <p class="text-xs font-semibold text-navy-400">Somente confirmações positivas</p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-spider-50 text-spider-600">
              <AppIcon name="users" :size="18" />
            </span>
          </div>
          <BarChart :items="ageBars" unit="pessoas" />
        </div>

        <div class="card-surface p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">Envios de convites</h2>
              <p class="text-xs font-semibold text-navy-400">Situação atual de cada convite</p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <AppIcon name="send" :size="18" />
            </span>
          </div>
          <BarChart :items="sendBars" unit="convites" />
        </div>

        <div class="card-surface p-6">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">Atividade recente</h2>
              <p class="text-xs font-semibold text-navy-400">Últimas respostas e envios registrados</p>
            </div>
            <AppButton to="/admin/confirmacoes" variant="ghost" size="sm">
              Ver tudo
              <template #icon><AppIcon name="arrow-right" :size="14" /></template>
            </AppButton>
          </div>

          <div v-if="data.recentRsvps.length || data.recentSends.length" class="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 class="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                <AppIcon name="calendar-check" :size="13" /> Confirmações
              </h3>
              <ul class="space-y-2">
                <li v-for="rsvp in data.recentRsvps.slice(0, 4)" :key="`${rsvp.guestName}-${rsvp.confirmedAt}`" class="rounded-xl border border-navy-100 p-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-xs font-extrabold text-navy-800">{{ rsvp.guestName }}</p>
                    <span :class="['h-2 w-2 shrink-0 rounded-full', rsvp.attendanceStatus === 'yes' ? 'bg-emerald-500' : 'bg-rose-400']" aria-hidden="true" />
                  </div>
                  <p class="mt-0.5 text-[11px] font-semibold text-navy-400">
                    {{ rsvp.attendanceStatus === 'yes' ? `${rsvp.totalPeople} pessoa(s)` : 'Não comparecerá' }}
                    · {{ formatDateTime(rsvp.confirmedAt) }}
                  </p>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                <AppIcon name="send" :size="13" /> Envios
              </h3>
              <ul class="space-y-2">
                <li v-for="send in data.recentSends.slice(0, 4)" :key="`${send.guestName}-${send.sentAt}`" class="rounded-xl border border-navy-100 p-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-xs font-extrabold text-navy-800">{{ send.guestName }}</p>
                    <span :class="['h-2 w-2 shrink-0 rounded-full', send.status === 'sent' ? 'bg-sky-500' : 'bg-amber-500']" aria-hidden="true" />
                  </div>
                  <p class="mt-0.5 text-[11px] font-semibold text-navy-400">
                    {{ send.status === 'sent' ? 'Convite enviado' : 'Falha registrada' }}
                    · {{ formatDateTime(send.sentAt) }}
                  </p>
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="rounded-2xl border-2 border-dashed border-navy-200 p-6 text-center">
            <p class="text-sm font-semibold text-navy-400">Nenhuma atividade registrada ainda.</p>
            <AppButton to="/admin/convidados" size="sm" class="mt-3">
              Cadastrar e enviar convites
            </AppButton>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
