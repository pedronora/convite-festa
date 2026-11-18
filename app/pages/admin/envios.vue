<script setup lang="ts">
import type { GuestDetail, SendHistoryItem } from '#shared/types'
import { buildInvitationLink, formatDateTime } from '#shared/utils/format'
import { formatPhoneBR } from '#shared/utils/phone'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Envios' })

interface SendsResponse {
  items: Array<SendHistoryItem & { guestId: number, guestName: string, invitationUuid: string, phone: string }>
  pagination: { page: number, pageSize: number, total: number, totalPages: number }
  stats: { sent: number, failed: number }
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

const { data, pending, refresh } = await useFetch<SendsResponse>('/api/admin/sends', {
  key: 'admin-sends',
  query: computed(() => ({ ...filters })),
})

const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)
const stats = computed(() => data.value?.stats)
const selectedSend = ref<SendHistoryItem | null>(null)
const resendOpen = ref(false)
const resendQueue = ref<GuestDetail[]>([])
const loadingGuest = ref<number | null>(null)

async function resend(item: SendsResponse['items'][number]) {
  loadingGuest.value = item.guestId
  try {
    const guest = await $fetch<GuestDetail>(`/api/admin/guests/${item.guestId}`)
    resendQueue.value = [guest]
    resendOpen.value = true
  }
  catch (error) {
    toast.error(apiErrorMessage(error, 'Não foi possível abrir o convite.'))
  }
  finally {
    loadingGuest.value = null
  }
}

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
      eyebrow="Histórico e reenvios"
      title="Envios de convites"
      subtitle="Cada envio confirmado pelo administrador fica registrado com telefone, mensagem, método e tentativa."
    >
      <template #actions>
        <AppButton
          to="/admin/convidados"
          size="sm"
        >
          <template #icon>
            <AppIcon
              name="send"
              :size="16"
            />
          </template>
          Enviar convites
        </AppButton>
      </template>
    </PageHeader>

    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><AppIcon
          name="send"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Envios registrados
          </p>
          <p class="font-display text-2xl leading-none text-navy-950">
            {{ stats?.sent ?? 0 }}
          </p>
        </div>
      </div>
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><AppIcon
          name="alert"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Falhas registradas
          </p>
          <p class="font-display text-2xl leading-none text-navy-950">
            {{ stats?.failed ?? 0 }}
          </p>
        </div>
      </div>
      <div class="card-surface flex items-center gap-3 p-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600"><AppIcon
          name="clipboard"
          :size="19"
        /></span>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-navy-400">
            Total de tentativas
          </p>
          <p class="font-display text-2xl leading-none text-navy-950">
            {{ (stats?.sent ?? 0) + (stats?.failed ?? 0) }}
          </p>
        </div>
      </div>
    </div>

    <AppAlert
      type="info"
      class="mb-4"
    >
      O sistema não envia mensagens automaticamente. Ele abre o WhatsApp com a mensagem pronta; o envio só é
      contabilizado após a confirmação do administrador. A imagem do convite deve ser anexada manualmente.
    </AppAlert>

    <section class="card-surface mb-4 p-4">
      <div class="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div class="relative">
          <AppIcon
            name="search"
            :size="17"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <label
            for="send-search"
            class="sr-only"
          >Pesquisar envios</label>
          <input
            id="send-search"
            v-model="searchInput"
            type="search"
            class="input-base pl-10"
            placeholder="Pesquisar por convidado ou telefone…"
          >
        </div>
        <div>
          <label
            for="send-status"
            class="sr-only"
          >Filtrar status</label>
          <select
            id="send-status"
            v-model="filters.status"
            class="input-base"
          >
            <option value="all">
              Todos os status
            </option>
            <option value="sent">
              Enviados
            </option>
            <option value="failed">
              Falhas
            </option>
          </select>
        </div>
      </div>
    </section>

    <section class="card-surface overflow-hidden">
      <div class="hidden overflow-x-auto scrollbar-thin md:block">
        <table class="w-full min-w-[820px] text-left">
          <caption class="sr-only">
            Histórico de envios de convites
          </caption>
          <thead class="table-head">
            <tr>
              <th class="px-4 py-3">
                Convidado
              </th>
              <th class="px-3 py-3">
                Telefone de destino
              </th>
              <th class="px-3 py-3">
                Status
              </th>
              <th class="px-3 py-3">
                Método
              </th>
              <th class="px-3 py-3">
                Tentativa
              </th>
              <th class="px-3 py-3">
                Data e hora
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
                  colspan="7"
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
                <NuxtLink
                  :to="`/admin/convidados/${item.guestId}`"
                  class="text-sm font-extrabold text-navy-900 hover:text-spider-700"
                >
                  {{ item.guestName }}
                </NuxtLink>
                <p class="text-[10px] font-semibold text-navy-400">
                  Convite #{{ item.invitationId }}
                </p>
              </td>
              <td class="px-3 py-3 text-xs font-bold text-navy-700">
                {{ formatPhoneBR(item.phone) }}
              </td>
              <td class="px-3 py-3">
                <StatusBadge
                  kind="send"
                  :status="item.status"
                  size="sm"
                />
              </td>
              <td class="px-3 py-3 text-xs font-semibold text-navy-500">
                {{ item.method === 'whatsapp_web' ? 'WhatsApp Web' : 'WhatsApp Business' }}
              </td>
              <td class="px-3 py-3 text-xs font-bold text-navy-700">
                #{{ item.attempt }}
              </td>
              <td class="px-3 py-3 text-xs font-semibold text-navy-500">
                {{ formatDateTime(item.sentAt) }}
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                    aria-label="Ver mensagem enviada"
                    title="Ver mensagem"
                    @click="selectedSend = item"
                  >
                    <AppIcon
                      name="eye"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                    aria-label="Copiar link"
                    title="Copiar link"
                    @click="copyLink(item.invitationUuid)"
                  >
                    <AppIcon
                      name="copy"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                    :disabled="loadingGuest === item.guestId"
                    aria-label="Reenviar convite"
                    title="Reenviar"
                    @click="resend(item)"
                  >
                    <AppIcon
                      name="refresh"
                      :size="16"
                      :class="loadingGuest === item.guestId ? 'animate-spin' : ''"
                    />
                  </button>
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
              <NuxtLink
                :to="`/admin/convidados/${item.guestId}`"
                class="text-sm font-extrabold text-navy-900"
              >{{ item.guestName }}</NuxtLink>
              <p class="text-[11px] font-semibold text-navy-400">
                {{ formatPhoneBR(item.phone) }}
              </p>
            </div>
            <StatusBadge
              kind="send"
              :status="item.status"
              size="sm"
            />
          </div>
          <p class="mt-2 text-[11px] font-semibold text-navy-500">
            Tentativa #{{ item.attempt }} · {{ item.method === 'whatsapp_web' ? 'WhatsApp Web' : 'WhatsApp Business' }} · {{ formatDateTime(item.sentAt) }}
          </p>
          <div class="mt-2 flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-navy-50 px-3 py-1.5 text-[11px] font-extrabold text-navy-600"
              @click="selectedSend = item"
            >
              Ver mensagem
            </button>
            <button
              type="button"
              class="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700"
              @click="resend(item)"
            >
              Reenviar
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="!pending && !items.length"
        class="p-6"
      >
        <EmptyState
          icon="send"
          title="Nenhum envio registrado"
          :description="filters.search || filters.status !== 'all' ? 'Ajuste a busca ou o status.' : 'Abra a lista de convidados e envie o primeiro convite pelo WhatsApp.'"
        >
          <template #action>
            <AppButton
              to="/admin/convidados"
              size="sm"
            >
              Ir para convidados
            </AppButton>
          </template>
        </EmptyState>
      </div>
    </section>

    <nav
      v-if="pagination && pagination.totalPages > 1"
      class="mt-4 flex items-center justify-between gap-3"
      aria-label="Paginação de envios"
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

    <SendInviteModal
      v-model="resendOpen"
      :guests="resendQueue"
      @sent="refresh()"
    />

    <AppModal
      :model-value="Boolean(selectedSend)"
      title="Mensagem do envio"
      description="Conteúdo exato registrado no histórico."
      size="md"
      @update:model-value="selectedSend = null"
    >
      <div
        v-if="selectedSend"
        class="space-y-3"
      >
        <div class="flex flex-wrap gap-2 text-[11px] font-bold text-navy-500">
          <span class="rounded-full bg-navy-100 px-2.5 py-1">{{ selectedSend.guestName }}</span>
          <span class="rounded-full bg-navy-100 px-2.5 py-1">{{ formatDateTime(selectedSend.sentAt) }}</span>
          <span class="rounded-full bg-navy-100 px-2.5 py-1">Tentativa {{ selectedSend.attempt }}</span>
          <span class="rounded-full bg-navy-100 px-2.5 py-1">{{ formatPhoneBR(selectedSend.phone) }}</span>
        </div>
        <p class="whitespace-pre-line rounded-2xl border border-navy-100 bg-navy-50/60 p-4 text-sm font-medium leading-relaxed text-navy-700">
          {{ selectedSend.message }}
        </p>
      </div>
    </AppModal>
  </div>
</template>
