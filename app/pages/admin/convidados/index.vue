<script setup lang="ts">
import type { GuestListItem, GuestListResponse } from '#shared/types'
import { buildInvitationLink, formatDateShort, formatDateTime } from '#shared/utils/format'
import { formatPhoneBR } from '#shared/utils/phone'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Convidados' })

const route = useRoute()
const toast = useToast()

const searchInput = ref(typeof route.query.busca === 'string' ? route.query.busca : '')
const filters = reactive({
  search: searchInput.value,
  send: 'all',
  rsvp: 'all',
  sort: 'createdAt' as 'name' | 'createdAt' | 'sentAt' | 'confirmedAt',
  order: 'desc' as 'asc' | 'desc',
  page: 1,
  pageSize: 20,
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.search = value.trim()
    filters.page = 1
  }, 350)
})

watch(() => [filters.send, filters.rsvp, filters.sort, filters.order], () => {
  filters.page = 1
})

const query = computed(() => ({ ...filters }))
const { data, pending, refresh } = await useFetch<GuestListResponse>('/api/admin/guests', {
  key: 'admin-guests',
  query,
})

const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

// Modais
const formOpen = ref(false)
const importOpen = ref(false)
const editingGuest = ref<GuestListItem | null>(null)
const sendOpen = ref(false)
const sendQueue = ref<GuestListItem[]>([])
const deleteTarget = ref<GuestListItem | null>(null)
const deleting = ref(false)
const selected = ref<number[]>([])

onMounted(() => {
  if (route.query.novo === '1') {
    editingGuest.value = null
    formOpen.value = true
  }
})

watch(items, () => {
  selected.value = selected.value.filter(id => items.value.some(item => item.id === id))
})

function openCreate() {
  editingGuest.value = null
  formOpen.value = true
}

function openEdit(guest: GuestListItem) {
  editingGuest.value = guest
  formOpen.value = true
}

function openSend(guests: GuestListItem[]) {
  sendQueue.value = guests
  sendOpen.value = true
}

function openBulkSend() {
  const guests = items.value.filter(item => selected.value.includes(item.id))
  if (!guests.length) return
  openSend(guests)
}

function toggleAll() {
  if (selected.value.length === items.value.length) {
    selected.value = []
  }
  else {
    selected.value = items.value.map(item => item.id)
  }
}

function toggleOne(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(value => value !== id)
    : [...selected.value, id]
}

function sortBy(field: typeof filters.sort) {
  if (filters.sort === field) {
    filters.order = filters.order === 'asc' ? 'desc' : 'asc'
  }
  else {
    filters.sort = field
    filters.order = field === 'name' ? 'asc' : 'desc'
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/guests/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success('Convidado excluído.')
    deleteTarget.value = null
    selected.value = []
    await refresh()
  }
  catch (error) {
    toast.error(apiErrorMessage(error, 'Não foi possível excluir o convidado.'))
  }
  finally {
    deleting.value = false
  }
}

function clearFilters() {
  searchInput.value = ''
  filters.search = ''
  filters.send = 'all'
  filters.rsvp = 'all'
  filters.page = 1
}

function changePage(page: number) {
  if (!pagination.value) return
  filters.page = Math.min(Math.max(1, page), pagination.value.totalPages)
}

async function onSaved() {
  await refresh()
  if (route.query.novo) {
    await navigateTo({ path: '/admin/convidados' }, { replace: true })
  }
}

async function onImported() {
  await refresh()
}

function copyInviteLink(guest: GuestListItem) {
  const url = buildInvitationLink(window.location.origin, guest.invitationUuid)
  navigator.clipboard.writeText(url)
    .then(() => toast.success('Link copiado.'))
    .catch(() => toast.error('Não foi possível copiar o link.'))
}

const hasActiveFilters = computed(() => Boolean(filters.search) || filters.send !== 'all' || filters.rsvp !== 'all')
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Gestão de convites"
      title="Convidados"
      subtitle="Cadastre pessoas, famílias ou grupos, envie o link individual e acompanhe as respostas."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          @click="importOpen = true"
        >
          <template #icon>
            <AppIcon
              name="upload"
              :size="16"
            />
          </template>
          Importar CSV
        </AppButton>
        <a
          href="/api/admin/export"
          class="inline-flex items-center gap-2 rounded-xl border-2 border-navy-200 bg-white px-4 py-2.5 text-sm font-extrabold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
        >
          <AppIcon
            name="download"
            :size="16"
          />
          Exportar CSV
        </a>
        <AppButton
          size="sm"
          @click="openCreate"
        >
          <template #icon>
            <AppIcon
              name="plus"
              :size="16"
            />
          </template>
          Novo convidado
        </AppButton>
      </template>
    </PageHeader>

    <!-- Filtros -->
    <section
      class="card-surface mb-4 p-4"
      aria-label="Filtros de convidados"
    >
      <div class="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <div class="relative">
          <AppIcon
            name="search"
            :size="17"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <label
            for="guest-search"
            class="sr-only"
          >Pesquisar convidados</label>
          <input
            id="guest-search"
            v-model="searchInput"
            type="search"
            class="input-base pl-10"
            placeholder="Pesquisar por nome, família ou telefone…"
          >
        </div>
        <div>
          <label
            for="filter-send"
            class="sr-only"
          >Filtrar por status de envio</label>
          <select
            id="filter-send"
            v-model="filters.send"
            class="input-base min-w-[170px]"
          >
            <option value="all">
              Todos os envios
            </option>
            <option value="not_sent">
              Não enviados
            </option>
            <option value="sent">
              Enviados
            </option>
            <option value="failed">
              Falha no envio
            </option>
          </select>
        </div>
        <div>
          <label
            for="filter-rsvp"
            class="sr-only"
          >Filtrar por confirmação</label>
          <select
            id="filter-rsvp"
            v-model="filters.rsvp"
            class="input-base min-w-[190px]"
          >
            <option value="all">
              Todas as confirmações
            </option>
            <option value="awaiting">
              Aguardando resposta
            </option>
            <option value="yes">
              Confirmados
            </option>
            <option value="no">
              Não comparecerão
            </option>
          </select>
        </div>
        <div>
          <label
            for="sort-guests"
            class="sr-only"
          >Ordenar convidados</label>
          <select
            id="sort-guests"
            v-model="filters.sort"
            class="input-base min-w-[165px]"
          >
            <option value="createdAt">
              Mais recentes
            </option>
            <option value="name">
              Nome (A-Z)
            </option>
            <option value="sentAt">
              Data de envio
            </option>
            <option value="confirmedAt">
              Data de confirmação
            </option>
          </select>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-bold text-navy-400">
          {{ pagination?.total ?? 0 }} {{ (pagination?.total ?? 0) === 1 ? 'convite' : 'convites' }} encontrados
        </p>
        <div class="flex items-center gap-3">
          <button
            v-if="filters.sort !== 'createdAt' || filters.order !== 'desc'"
            type="button"
            class="text-xs font-bold text-navy-500 hover:text-navy-800"
            @click="filters.sort = 'createdAt'; filters.order = 'desc'"
          >
            Restaurar ordenação
          </button>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="text-xs font-bold text-spider-600 hover:text-spider-800"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </section>

    <AppAlert
      v-if="data === null || (pending === false && !data)"
      type="error"
      title="Erro ao carregar"
      class="mb-4"
    >
      Não foi possível carregar os convidados.
      <button
        type="button"
        class="underline"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </AppAlert>

    <!-- Tabela desktop -->
    <section class="card-surface hidden overflow-hidden md:block">
      <div class="overflow-x-auto scrollbar-thin">
        <table class="w-full min-w-[880px] text-left">
          <caption class="sr-only">
            Lista de convidados e status
          </caption>
          <thead class="table-head">
            <tr>
              <th class="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-spider-600"
                  :checked="items.length > 0 && selected.length === items.length"
                  :indeterminate.prop="selected.length > 0 && selected.length < items.length"
                  aria-label="Selecionar todos os convidados desta página"
                  @change="toggleAll"
                >
              </th>
              <th class="px-3 py-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-navy-800"
                  @click="sortBy('name')"
                >
                  Convidado
                  <AppIcon
                    v-if="filters.sort === 'name'"
                    :name="filters.order === 'asc' ? 'chevron-down' : 'chevron-down'"
                    :size="12"
                    :class="filters.order === 'asc' ? 'rotate-180' : ''"
                  />
                </button>
              </th>
              <th class="px-3 py-3">
                Telefone
              </th>
              <th class="px-3 py-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-navy-800"
                  @click="sortBy('sentAt')"
                >
                  Envio
                  <AppIcon
                    v-if="filters.sort === 'sentAt'"
                    name="chevron-down"
                    :size="12"
                    :class="filters.order === 'asc' ? 'rotate-180' : ''"
                  />
                </button>
              </th>
              <th class="px-3 py-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-navy-800"
                  @click="sortBy('confirmedAt')"
                >
                  Confirmação
                  <AppIcon
                    v-if="filters.sort === 'confirmedAt'"
                    name="chevron-down"
                    :size="12"
                    :class="filters.order === 'asc' ? 'rotate-180' : ''"
                  />
                </button>
              </th>
              <th class="px-3 py-3">
                Pessoas
              </th>
              <th class="px-3 py-3 text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-navy-100">
            <template v-if="pending && !data">
              <tr
                v-for="n in 6"
                :key="n"
              >
                <td
                  colspan="7"
                  class="px-4 py-3"
                >
                  <div class="skeleton h-10 w-full rounded-lg" />
                </td>
              </tr>
            </template>
            <tr
              v-for="guest in items"
              v-else
              :key="guest.id"
              :class="['group transition hover:bg-navy-50/50', selected.includes(guest.id) ? 'bg-spider-50/40' : '']"
            >
              <td class="px-3 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-spider-600"
                  :checked="selected.includes(guest.id)"
                  :aria-label="`Selecionar ${guest.name}`"
                  @change="toggleOne(guest.id)"
                >
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-extrabold text-navy-600">
                    {{ guest.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/admin/convidados/${guest.id}`"
                      class="block truncate text-sm font-extrabold text-navy-900 hover:text-spider-700"
                    >
                      {{ guest.name }}
                    </NuxtLink>
                    <p class="truncate text-[11px] font-semibold text-navy-400">
                      {{ guest.groupName || 'Convite individual' }}
                      <span v-if="guest.maxGuests"> · limite {{ guest.maxGuests }}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <p class="text-xs font-bold text-navy-700">
                  {{ formatPhoneBR(guest.phone) }}
                </p>
                <p
                  v-if="guest.email"
                  class="truncate text-[10px] text-navy-400"
                  :title="guest.email"
                >
                  {{ guest.email }}
                </p>
              </td>
              <td class="px-3 py-3">
                <StatusBadge
                  kind="send"
                  :status="guest.sendStatus"
                  size="sm"
                />
                <p class="mt-1 text-[10px] font-semibold text-navy-400">
                  {{ guest.lastSentAt ? formatDateShort(guest.lastSentAt) : 'Ainda não enviado' }}
                </p>
              </td>
              <td class="px-3 py-3">
                <StatusBadge
                  kind="rsvp"
                  :status="guest.rsvpStatus"
                  size="sm"
                />
                <p class="mt-1 text-[10px] font-semibold text-navy-400">
                  {{ guest.rsvpStatus === 'awaiting' ? 'Sem resposta' : formatDateTime(guest.rsvpUpdatedAt || guest.confirmedAt) }}
                </p>
              </td>
              <td class="px-3 py-3">
                <div
                  v-if="guest.rsvpStatus === 'yes'"
                  class="flex items-center gap-1.5 text-[10px] font-bold"
                >
                  <span
                    class="rounded bg-spider-50 px-1.5 py-0.5 text-spider-700"
                    :title="`${guest.adults} adulto(s)`"
                  >A {{ guest.adults }}</span>
                  <span
                    class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700"
                    :title="`${guest.children8to11} criança(s) de 8 a 11`"
                  >8-11 {{ guest.children8to11 }}</span>
                  <span
                    class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700"
                    :title="`${guest.children0to7} criança(s) de 0 a 7`"
                  >0-7 {{ guest.children0to7 }}</span>
                </div>
                <p
                  v-else-if="guest.rsvpStatus === 'no'"
                  class="text-[11px] font-semibold text-navy-400"
                >
                  Não comparecerá
                </p>
                <p
                  v-else
                  class="text-[11px] font-semibold text-navy-300"
                >
                  —
                </p>
                <p
                  v-if="guest.rsvpStatus === 'yes'"
                  class="mt-1 text-[10px] font-extrabold text-navy-600"
                >
                  Total: {{ guest.totalPeople }}
                </p>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-sky-50 hover:text-sky-700"
                    :aria-label="`Copiar link de ${guest.name}`"
                    title="Copiar link"
                    @click="copyInviteLink(guest)"
                  >
                    <AppIcon
                      name="link"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                    :aria-label="`Enviar convite para ${guest.name}`"
                    title="Enviar convite"
                    @click="openSend([guest])"
                  >
                    <AppIcon
                      name="whatsapp"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
                    :aria-label="`Editar ${guest.name}`"
                    title="Editar"
                    @click="openEdit(guest)"
                  >
                    <AppIcon
                      name="edit"
                      :size="16"
                    />
                  </button>
                  <NuxtLink
                    :to="`/admin/convidados/${guest.id}`"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
                    :aria-label="`Ver detalhes de ${guest.name}`"
                    title="Ver detalhes"
                  >
                    <AppIcon
                      name="eye"
                      :size="16"
                    />
                  </NuxtLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
                    :aria-label="`Excluir ${guest.name}`"
                    title="Excluir"
                    @click="deleteTarget = guest"
                  >
                    <AppIcon
                      name="trash"
                      :size="16"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!pending && !items.length"
        class="p-6"
      >
        <EmptyState
          icon="users"
          :title="hasActiveFilters ? 'Nenhum convidado encontrado' : 'Nenhum convidado cadastrado'"
          :description="hasActiveFilters ? 'Ajuste os filtros ou pesquise por outro termo.' : 'Cadastre o primeiro convidado para gerar um link individual de confirmação.'"
        >
          <template #action>
            <AppButton
              v-if="hasActiveFilters"
              variant="outline"
              size="sm"
              @click="clearFilters"
            >
              Limpar filtros
            </AppButton>
            <AppButton
              v-else
              size="sm"
              @click="openCreate"
            >
              <template #icon>
                <AppIcon
                  name="plus"
                  :size="16"
                />
              </template>
              Cadastrar convidado
            </AppButton>
          </template>
        </EmptyState>
      </div>
    </section>

    <!-- Cards mobile -->
    <section
      class="space-y-3 md:hidden"
      aria-label="Lista de convidados"
    >
      <template v-if="pending && !data">
        <div
          v-for="n in 4"
          :key="n"
          class="card-surface p-4"
        >
          <div class="skeleton h-4 w-32 rounded" />
          <div class="skeleton mt-3 h-3 w-48 rounded" />
          <div class="skeleton mt-4 h-8 w-full rounded" />
        </div>
      </template>
      <article
        v-for="guest in items"
        v-else
        :key="guest.id"
        class="card-surface p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-extrabold text-navy-600">
              {{ guest.name.charAt(0).toUpperCase() }}
            </span>
            <div>
              <NuxtLink
                :to="`/admin/convidados/${guest.id}`"
                class="text-sm font-extrabold text-navy-900"
              >{{ guest.name }}</NuxtLink>
              <p class="text-[11px] font-semibold text-navy-400">
                {{ guest.groupName || 'Convite individual' }}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            class="mt-1 h-4 w-4 accent-spider-600"
            :checked="selected.includes(guest.id)"
            :aria-label="`Selecionar ${guest.name}`"
            @change="toggleOne(guest.id)"
          >
        </div>
        <p class="mt-2 text-xs font-bold text-navy-600">
          {{ formatPhoneBR(guest.phone) }}
        </p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <StatusBadge
            kind="send"
            :status="guest.sendStatus"
            size="sm"
          />
          <StatusBadge
            kind="rsvp"
            :status="guest.rsvpStatus"
            size="sm"
          />
        </div>
        <div
          v-if="guest.rsvpStatus === 'yes'"
          class="mt-2 rounded-lg bg-navy-50 px-2.5 py-1.5 text-[11px] font-bold text-navy-600"
        >
          {{ guest.totalPeople }} pessoa(s): {{ guest.adults }} adulto(s), {{ guest.children8to11 }} de 8-11 e {{ guest.children0to7 }} de 0-7
        </div>
        <div class="mt-3 flex items-center justify-between border-t border-navy-100 pt-2.5">
          <div class="flex gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-navy-500 hover:bg-navy-100"
              aria-label="Copiar link"
              @click="copyInviteLink(guest)"
            >
              <AppIcon
                name="link"
                :size="16"
              />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
              aria-label="Enviar convite"
              @click="openSend([guest])"
            >
              <AppIcon
                name="whatsapp"
                :size="16"
              />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-navy-500 hover:bg-navy-100"
              aria-label="Editar"
              @click="openEdit(guest)"
            >
              <AppIcon
                name="edit"
                :size="16"
              />
            </button>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/admin/convidados/${guest.id}`"
              class="text-xs font-extrabold text-spider-600"
            >Detalhes</NuxtLink>
            <button
              type="button"
              class="rounded-lg p-2 text-navy-300 hover:bg-red-50 hover:text-red-600"
              aria-label="Excluir"
              @click="deleteTarget = guest"
            >
              <AppIcon
                name="trash"
                :size="15"
              />
            </button>
          </div>
        </div>
      </article>
      <EmptyState
        v-if="!pending && !items.length"
        icon="users"
        :title="hasActiveFilters ? 'Nenhum convidado encontrado' : 'Nenhum convidado cadastrado'"
        :description="hasActiveFilters ? 'Ajuste os filtros de busca.' : 'Cadastre o primeiro convidado para começar.'"
      >
        <template #action>
          <AppButton
            v-if="hasActiveFilters"
            variant="outline"
            size="sm"
            @click="clearFilters"
          >
            Limpar filtros
          </AppButton>
          <AppButton
            v-else
            size="sm"
            @click="openCreate"
          >
            Cadastrar convidado
          </AppButton>
        </template>
      </EmptyState>
    </section>

    <!-- Paginação -->
    <nav
      v-if="pagination && pagination.totalPages > 1"
      class="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
      aria-label="Paginação de convidados"
    >
      <p class="text-xs font-semibold text-navy-400">
        Página {{ pagination.page }} de {{ pagination.totalPages }} · {{ pagination.total }} convites
      </p>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-bold text-navy-600 transition hover:bg-navy-50 disabled:opacity-40"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          <AppIcon
            name="chevron-left"
            :size="14"
          /> Anterior
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-bold text-navy-600 transition hover:bg-navy-50 disabled:opacity-40"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          Próxima <AppIcon
            name="chevron-right"
            :size="14"
          />
        </button>
      </div>
    </nav>

    <!-- Barra de seleção -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-10 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-10 opacity-0"
    >
      <div
        v-if="selected.length"
        class="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-navy-800 bg-navy-950 px-4 py-3 text-white shadow-2xl sm:bottom-6"
      >
        <p class="text-xs font-extrabold sm:text-sm">
          {{ selected.length }} {{ selected.length === 1 ? 'convidado selecionado' : 'convidados selecionados' }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs font-bold text-navy-300 hover:text-white"
            @click="selected = []"
          >
            Limpar
          </button>
          <AppButton
            variant="whatsapp"
            size="sm"
            @click="openBulkSend"
          >
            <template #icon>
              <AppIcon
                name="send"
                :size="15"
              />
            </template>
            Enviar convites
          </AppButton>
        </div>
      </div>
    </Transition>

    <GuestImportModal
      v-model="importOpen"
      @imported="onImported"
    />
    <GuestFormModal
      v-model="formOpen"
      :guest="editingGuest"
      @saved="onSaved"
    />
    <SendInviteModal
      v-model="sendOpen"
      :guests="sendQueue"
      @sent="refresh()"
    />

    <AppModal
      :model-value="Boolean(deleteTarget)"
      title="Excluir convidado"
      size="sm"
      @update:model-value="deleteTarget = null"
    >
      <p class="text-sm font-semibold text-navy-600">
        Tem certeza que deseja excluir <strong class="text-navy-900">{{ deleteTarget?.name }}</strong>?
      </p>
      <p class="mt-2 rounded-xl bg-spider-50 p-3 text-xs font-semibold text-spider-800">
        O link de confirmação deixará de funcionar. Todo o histórico de envios e a resposta de presença
        deste convite também serão removidos. Esta ação não pode ser desfeita.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="deleting"
            @click="deleteTarget = null"
          >
            Cancelar
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            :loading="deleting"
            @click="confirmDelete"
          >
            <template #icon>
              <AppIcon
                name="trash"
                :size="15"
              />
            </template>
            Excluir definitivamente
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
