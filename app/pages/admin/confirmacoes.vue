<script setup lang="ts">
import { buildInvitationLink, formatDateTime } from '#shared/utils/format'
import { formatPhone } from '#shared/utils/phone'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Confirmações' })

interface RsvpsResponse {
  items: Array<{
    id: number
    guestId: number
    invitationUuid: string
    guestName: string
    groupName: string | null
    phone: string
    responsibleName: string
    attendanceStatus: 'yes' | 'no'
    adults: number
    children8to11: number
    children0to7: number
    totalPeople: number
    notes: string | null
    confirmedAt: string
    updatedAt: string
  }>
  pagination: { page: number, pageSize: number, total: number, totalPages: number }
  stats: { confirmed: number, declined: number, people: number }
}

const toast = useToast()
const searchInput = ref('')
const filters = reactive({ search: '', status: 'all', page: 1, pageSize: 20 })
let timer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    filters.search = value.trim()
    filters.page = 1
  }, 350)
})
watch(() => filters.status, () => {
  filters.page = 1
})

const { data, pending } = await useFetch<RsvpsResponse>('/api/admin/rsvps', {
  key: 'admin-rsvps',
  query: computed(() => ({ ...filters })),
})

const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)
const stats = computed(() => data.value?.stats)
const details = ref<RsvpsResponse['items'][number] | null>(null)

function copyLink(uuid: string) {
  if (!import.meta.client) return
  navigator.clipboard.writeText(buildInvitationLink(window.location.origin, uuid))
    .then(() => toast.success('Link copiado.'))
    .catch(() => toast.error('Não foi possível copiar o link.'))
}

function changePage(page: number) {
  if (!pagination.value) return
  filters.page = Math.min(Math.max(1, page), pagination.value.totalPages)
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Respostas dos convidados"
      title="Confirmações"
      subtitle="Veja quem já respondeu, a distribuição por faixa etária e os recados dos convidados."
    >
      <template #actions>
        <a
          href="/api/admin/rsvps/export"
          class="inline-flex items-center gap-2 rounded-xl border-2 border-navy-200 bg-white px-4 py-2.5 text-sm font-extrabold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
        >
          <AppIcon
            name="download"
            :size="16"
          /> Exportar relatório
        </a>
      </template>
    </PageHeader>

    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><AppIcon
          name="check-circle"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Convites confirmados
          </p>
          <p class="font-display text-3xl leading-none text-navy-950">
            {{ stats?.confirmed ?? 0 }}
          </p>
        </div>
      </div>
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AppIcon
          name="x-circle"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Não comparecerão
          </p>
          <p class="font-display text-3xl leading-none text-navy-950">
            {{ stats?.declined ?? 0 }}
          </p>
        </div>
      </div>
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-spider-50 text-spider-600"><AppIcon
          name="party"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Pessoas confirmadas
          </p>
          <p class="font-display text-3xl leading-none text-navy-950">
            {{ stats?.people ?? 0 }}
          </p>
        </div>
      </div>
    </div>

    <section class="card-surface mb-4 p-4">
      <div class="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div class="relative">
          <AppIcon
            name="search"
            :size="17"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <label
            for="rsvp-search"
            class="sr-only"
          >Pesquisar confirmações</label>
          <input
            id="rsvp-search"
            v-model="searchInput"
            type="search"
            class="input-base pl-10"
            placeholder="Pesquisar por convidado, família ou responsável…"
          >
        </div>
        <div>
          <label
            for="rsvp-status"
            class="sr-only"
          >Filtrar resposta</label>
          <select
            id="rsvp-status"
            v-model="filters.status"
            class="input-base"
          >
            <option value="all">
              Todas as respostas
            </option>
            <option value="yes">
              Confirmados
            </option>
            <option value="no">
              Não comparecerão
            </option>
          </select>
        </div>
      </div>
    </section>

    <section class="card-surface overflow-hidden">
      <div class="hidden overflow-x-auto scrollbar-thin md:block">
        <table class="w-full min-w-[900px] text-left">
          <caption class="sr-only">
            Confirmações de presença
          </caption>
          <thead class="table-head">
            <tr>
              <th class="px-4 py-3">
                Convidado
              </th>
              <th class="px-3 py-3">
                Responsável
              </th>
              <th class="px-3 py-3">
                Resposta
              </th>
              <th class="px-3 py-3 text-center">
                Adultos
              </th>
              <th class="px-3 py-3 text-center">
                8 a 11
              </th>
              <th class="px-3 py-3 text-center">
                0 a 7
              </th>
              <th class="px-3 py-3 text-center">
                Total
              </th>
              <th class="px-3 py-3">
                Respondido em
              </th>
              <th class="px-3 py-3 text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-navy-100">
            <template v-if="pending && !data">
              <tr
                v-for="n in 5"
                :key="n"
              >
                <td
                  colspan="9"
                  class="px-4 py-3"
                >
                  <div class="skeleton h-9 w-full rounded-lg" />
                </td>
              </tr>
            </template>
            <tr
              v-for="item in items"
              v-else
              :key="item.id"
              class="transition hover:bg-navy-50/50"
            >
              <td class="px-4 py-3">
                <p class="text-sm font-extrabold text-navy-900">
                  {{ item.guestName }}
                </p>
                <p class="text-[10px] font-semibold text-navy-400">
                  {{ item.groupName || 'Convite individual' }}
                </p>
              </td>
              <td class="px-3 py-3">
                <p class="text-xs font-bold text-navy-700">
                  {{ item.responsibleName }}
                </p>
                <p class="text-[10px] font-semibold text-navy-400">
                  {{ formatPhone(item.phone) }}
                </p>
              </td>
              <td class="px-3 py-3">
                <StatusBadge
                  kind="rsvp"
                  :status="item.attendanceStatus"
                  size="sm"
                />
              </td>
              <td class="px-3 py-3 text-center text-sm font-extrabold text-navy-800">
                {{ item.attendanceStatus === 'yes' ? item.adults : '—' }}
              </td>
              <td class="px-3 py-3 text-center text-sm font-extrabold text-navy-800">
                {{ item.attendanceStatus === 'yes' ? item.children8to11 : '—' }}
              </td>
              <td class="px-3 py-3 text-center text-sm font-extrabold text-navy-800">
                {{ item.attendanceStatus === 'yes' ? item.children0to7 : '—' }}
              </td>
              <td class="px-3 py-3 text-center">
                <span :class="['inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-1 text-xs font-extrabold', item.attendanceStatus === 'yes' ? 'bg-navy-950 text-white' : 'bg-navy-100 text-navy-500']">
                  {{ item.attendanceStatus === 'yes' ? item.totalPeople : 0 }}
                </span>
              </td>
              <td class="px-3 py-3 text-xs font-semibold text-navy-500">
                {{ formatDateTime(item.updatedAt) }}
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                    aria-label="Ver detalhes da confirmação"
                    title="Detalhes"
                    @click="details = item"
                  >
                    <AppIcon
                      name="eye"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                    aria-label="Copiar link do convite"
                    title="Copiar link"
                    @click="copyLink(item.invitationUuid)"
                  >
                    <AppIcon
                      name="copy"
                      :size="16"
                    />
                  </button>
                  <NuxtLink
                    :to="`/admin/convidados/${item.guestId}`"
                    class="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                    aria-label="Abrir convidado"
                    title="Abrir convidado"
                  >
                    <AppIcon
                      name="user"
                      :size="16"
                    />
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="divide-y divide-navy-100 md:hidden">
        <article
          v-for="item in items"
          :key="item.id"
          class="p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-extrabold text-navy-900">
                {{ item.guestName }}
              </p>
              <p class="text-[11px] font-semibold text-navy-400">
                {{ item.responsibleName }} · {{ formatPhone(item.phone) }}
              </p>
            </div>
            <StatusBadge
              kind="rsvp"
              :status="item.attendanceStatus"
              size="sm"
            />
          </div>
          <div
            v-if="item.attendanceStatus === 'yes'"
            class="mt-3 grid grid-cols-4 gap-1.5 text-center"
          >
            <div class="rounded-lg bg-spider-50 py-1.5">
              <p class="font-display text-lg text-spider-700">
                {{ item.adults }}
              </p><p class="text-[8px] font-bold uppercase text-navy-400">
                Adultos
              </p>
            </div>
            <div class="rounded-lg bg-sky-50 py-1.5">
              <p class="font-display text-lg text-sky-700">
                {{ item.children8to11 }}
              </p><p class="text-[8px] font-bold uppercase text-navy-400">
                8-11
              </p>
            </div>
            <div class="rounded-lg bg-amber-50 py-1.5">
              <p class="font-display text-lg text-amber-700">
                {{ item.children0to7 }}
              </p><p class="text-[8px] font-bold uppercase text-navy-400">
                0-7
              </p>
            </div>
            <div class="rounded-lg bg-navy-950 py-1.5 text-white">
              <p class="font-display text-lg">
                {{ item.totalPeople }}
              </p><p class="text-[8px] font-bold uppercase text-navy-300">
                Total
              </p>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-[10px] font-semibold text-navy-400">
              {{ formatDateTime(item.updatedAt) }}
            </p>
            <button
              type="button"
              class="text-[11px] font-extrabold text-spider-600"
              @click="details = item"
            >
              Ver detalhes
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="!pending && !items.length"
        class="p-6"
      >
        <EmptyState
          icon="calendar-check"
          title="Nenhuma confirmação ainda"
          :description="filters.search || filters.status !== 'all' ? 'Ajuste a busca ou o filtro.' : 'As respostas aparecerão aqui assim que os convidados preencherem o link.'"
        >
          <template #action>
            <AppButton
              to="/admin/convidados"
              size="sm"
            >
              Enviar convites
            </AppButton>
          </template>
        </EmptyState>
      </div>
    </section>

    <nav
      v-if="pagination && pagination.totalPages > 1"
      class="mt-4 flex items-center justify-between gap-3"
      aria-label="Paginação de confirmações"
    >
      <p class="text-xs font-semibold text-navy-400">
        Página {{ pagination.page }} de {{ pagination.totalPages }}
      </p>
      <div class="flex gap-1.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          Anterior
        </AppButton>
        <AppButton
          variant="outline"
          size="sm"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          Próxima
        </AppButton>
      </div>
    </nav>

    <AppModal
      :model-value="Boolean(details)"
      title="Detalhes da confirmação"
      size="md"
      @update:model-value="details = null"
    >
      <div
        v-if="details"
        class="space-y-4"
      >
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge
            kind="rsvp"
            :status="details.attendanceStatus"
          />
          <span class="rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-bold text-navy-600">{{ details.groupName || 'Convite individual' }}</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl bg-navy-50 p-3">
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
              Respondido por
            </p>
            <p class="mt-0.5 text-sm font-extrabold text-navy-900">
              {{ details.responsibleName }}
            </p>
            <p class="text-xs font-semibold text-navy-500">
              {{ formatPhone(details.phone) }}
            </p>
          </div>
          <div class="rounded-xl bg-navy-50 p-3">
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
              Datas
            </p>
            <p class="mt-0.5 text-xs font-semibold text-navy-500">
              Resposta: {{ formatDateTime(details.confirmedAt) }}
            </p>
            <p class="text-xs font-semibold text-navy-500">
              Atualização: {{ formatDateTime(details.updatedAt) }}
            </p>
          </div>
        </div>
        <div
          v-if="details.attendanceStatus === 'yes'"
          class="grid grid-cols-4 gap-2 text-center"
        >
          <div class="rounded-xl bg-spider-50 p-2.5">
            <p class="font-display text-2xl text-spider-700">
              {{ details.adults }}
            </p><p class="text-[9px] font-bold uppercase text-navy-400">
              Adultos
            </p>
          </div>
          <div class="rounded-xl bg-sky-50 p-2.5">
            <p class="font-display text-2xl text-sky-700">
              {{ details.children8to11 }}
            </p><p class="text-[9px] font-bold uppercase text-navy-400">
              8 a 11
            </p>
          </div>
          <div class="rounded-xl bg-amber-50 p-2.5">
            <p class="font-display text-2xl text-amber-700">
              {{ details.children0to7 }}
            </p><p class="text-[9px] font-bold uppercase text-navy-400">
              0 a 7
            </p>
          </div>
          <div class="rounded-xl bg-navy-950 p-2.5 text-white">
            <p class="font-display text-2xl">
              {{ details.totalPeople }}
            </p><p class="text-[9px] font-bold uppercase text-navy-300">
              Total
            </p>
          </div>
        </div>
        <div v-if="details.notes">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
            Observações
          </p>
          <p class="mt-1 whitespace-pre-line rounded-xl bg-navy-50 p-3 text-xs font-semibold leading-relaxed text-navy-600">
            {{ details.notes }}
          </p>
        </div>
        <div class="flex justify-end gap-2 border-t border-navy-100 pt-3">
          <AppButton
            variant="outline"
            size="sm"
            @click="copyLink(details!.invitationUuid)"
          >
            Copiar link
          </AppButton>
          <AppButton
            :to="`/admin/convidados/${details!.guestId}`"
            size="sm"
          >
            Abrir convidado
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
