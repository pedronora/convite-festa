<script setup lang="ts">
import type { ContractListResponse, ContractSummary, PaymentItem } from '#shared/types'
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
} from '#shared/config/finance'
import { formatDateOnly } from '#shared/utils/format'
import { formatCentsBRL } from '#shared/utils/money'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Contratos e fornecedores' })

const route = useRoute()
const toast = useToast()

const statusFromQuery = (): string => {
  const value = route.query.status
  return typeof value === 'string' && ['open', 'paid', 'due_soon', 'overdue'].includes(value) ? value : 'all'
}

const searchInput = ref(typeof route.query.busca === 'string' ? route.query.busca : '')
const filters = reactive({
  search: searchInput.value,
  category: 'all',
  status: statusFromQuery(),
  sort: 'recent' as 'recent' | 'next_due' | 'highest' | 'name',
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.search = value.trim()
  }, 350)
})

const query = computed(() => ({ ...filters }))
const { data, pending, refresh } = await useFetch<ContractListResponse>('/api/admin/contracts', {
  key: 'admin-contracts',
  query,
})

const items = computed(() => data.value?.items ?? [])
const totals = computed(() => data.value?.totals)
const hasActiveFilters = computed(() =>
  Boolean(filters.search)
  || filters.category !== 'all'
  || filters.status !== 'all'
  || filters.sort !== 'recent',
)

function clearFilters() {
  searchInput.value = ''
  filters.search = ''
  filters.category = 'all'
  filters.status = 'all'
  filters.sort = 'recent'
}

const formOpen = ref(false)
const editingContract = ref<ContractSummary | null>(null)
const deleteTarget = ref<ContractSummary | null>(null)
const deleting = ref(false)
const paying = ref<ContractSummary | null>(null)

const payTarget = computed<PaymentItem | null>(() => {
  const contract = paying.value
  if (!contract?.nextPaymentId || !contract.nextDueDate || !contract.nextDueCents) return null
  return {
    id: contract.nextPaymentId,
    contractId: contract.id,
    label: null,
    amountCents: contract.nextDueCents,
    dueDate: contract.nextDueDate,
    paidOn: null,
    method: null,
    notes: null,
    status: contract.status === 'overdue' ? 'overdue' : contract.status === 'due_soon' ? 'due_soon' : 'pending',
    daysUntilDue: null,
    createdAt: '',
    updatedAt: '',
  }
})

onMounted(() => {
  if (route.query.novo === '1') openCreate()
})

function openCreate() {
  editingContract.value = null
  formOpen.value = true
}

function openEdit(contract: ContractSummary) {
  editingContract.value = contract
  formOpen.value = true
}

async function onSaved() {
  await refresh()
  if (route.query.novo) {
    await navigateTo({ path: '/admin/financeiro/contratos', query: { ...route.query, novo: undefined } }, { replace: true })
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/contracts/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success('Fornecedor e contrato excluídos.')
    deleteTarget.value = null
    await refresh()
  }
  catch (error) {
    toast.error(apiErrorMessage(error, 'Não foi possível excluir o fornecedor.'))
  }
  finally {
    deleting.value = false
  }
}

async function onPaid() {
  paying.value = null
  await refresh()
}

function closePay(open: boolean) {
  if (!open) paying.value = null
}

function statusHint(contract: ContractSummary): string {
  if (contract.unscheduledCents > 0) return `${formatCentsBRL(contract.unscheduledCents)} sem parcela`
  if (contract.status === 'due_soon' && contract.nextDueDate) return `Vence ${formatDateOnly(contract.nextDueDate)}`
  if (contract.status === 'overdue' && contract.nextDueDate) return `Atrasado desde ${formatDateOnly(contract.nextDueDate)}`
  if (contract.status === 'paid') return 'Contrato quitado'
  return contract.nextDueDate ? `Próximo vencimento ${formatDateOnly(contract.nextDueDate)}` : 'Sem parcelas cadastradas'
}
</script>

<template>
  <div>
    <div class="mb-4">
      <NuxtLink
        to="/admin/financeiro"
        class="inline-flex items-center gap-1.5 text-xs font-extrabold text-navy-400 transition hover:text-navy-700"
      >
        <AppIcon
          name="chevron-left"
          :size="14"
        /> Voltar para o financeiro
      </NuxtLink>
    </div>

    <PageHeader
      eyebrow="Fornecedores e contratos"
      title="Contratos"
      subtitle="Cadastre o que foi contratado, o valor fechado e as parcelas até o dia da festa."
    >
      <template #actions>
        <AppButton
          to="/admin/financeiro"
          variant="outline"
          size="sm"
        >
          <template #icon>
            <AppIcon
              name="chart"
              :size="15"
            />
          </template>
          Painel financeiro
        </AppButton>
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
          Novo fornecedor
        </AppButton>
      </template>
    </PageHeader>

    <!-- Resumo -->
    <section
      v-if="totals"
      class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Resumo dos contratos filtrados"
    >
      <StatCard
        label="Contratos"
        :value="totals.count"
        :hint="hasActiveFilters ? 'Resultado dos filtros atuais' : 'Fornecedores cadastrados'"
        icon="receipt"
        tone="blue"
        compact
      />
      <StatCard
        label="Contratado"
        :value="formatCentsBRL(totals.contractedCents)"
        hint="Soma dos valores fechados"
        icon="clipboard"
        tone="navy"
        compact
      />
      <StatCard
        label="Pago"
        :value="formatCentsBRL(totals.paidCents)"
        hint="Parcelas com pagamento registrado"
        icon="check-circle"
        tone="green"
        compact
      />
      <StatCard
        label="Em aberto"
        :value="formatCentsBRL(totals.openCents)"
        hint="Ainda falta quitar"
        icon="wallet"
        tone="red"
        compact
      />
    </section>

    <!-- Filtros -->
    <section
      class="card-surface mb-4 p-4"
      aria-label="Filtros de contratos"
    >
      <div class="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <div class="relative">
          <AppIcon
            name="search"
            :size="17"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <label
            for="contract-search"
            class="sr-only"
          >Pesquisar contratos</label>
          <input
            id="contract-search"
            v-model="searchInput"
            type="search"
            class="input-base pl-10"
            placeholder="Pesquisar por fornecedor, descrição ou contato…"
          >
        </div>
        <div>
          <label
            for="filter-category"
            class="sr-only"
          >Filtrar por categoria</label>
          <select
            id="filter-category"
            v-model="filters.category"
            class="input-base min-w-[175px]"
          >
            <option value="all">
              Todas as categorias
            </option>
            <option
              v-for="option in EXPENSE_CATEGORY_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="filter-status"
            class="sr-only"
          >Filtrar por situação</label>
          <select
            id="filter-status"
            v-model="filters.status"
            class="input-base min-w-[160px]"
          >
            <option value="all">
              Todas as situações
            </option>
            <option value="open">
              Em aberto
            </option>
            <option value="due_soon">
              Vencem em breve
            </option>
            <option value="overdue">
              Em atraso
            </option>
            <option value="paid">
              Quitados
            </option>
          </select>
        </div>
        <div>
          <label
            for="sort-contracts"
            class="sr-only"
          >Ordenar contratos</label>
          <select
            id="sort-contracts"
            v-model="filters.sort"
            class="input-base min-w-[170px]"
          >
            <option value="recent">
              Mais recentes
            </option>
            <option value="next_due">
              Próximo vencimento
            </option>
            <option value="highest">
              Maior valor
            </option>
            <option value="name">
              Fornecedor (A-Z)
            </option>
          </select>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-bold text-navy-400">
          {{ totals?.count ?? 0 }} {{ (totals?.count ?? 0) === 1 ? 'contrato encontrado' : 'contratos encontrados' }}
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="text-xs font-bold text-spider-600 hover:text-spider-800"
          @click="clearFilters"
        >
          Limpar filtros
        </button>
      </div>
    </section>

    <!-- Tabela desktop -->
    <section class="card-surface hidden overflow-hidden md:block">
      <div class="overflow-x-auto scrollbar-thin">
        <table class="w-full min-w-[980px] text-left">
          <caption class="sr-only">
            Contratos e situação de pagamento
          </caption>
          <thead class="table-head">
            <tr>
              <th class="px-4 py-3">
                Fornecedor
              </th>
              <th class="px-4 py-3">
                Contratado
              </th>
              <th class="px-4 py-3">
                Pago
              </th>
              <th class="px-4 py-3">
                Em aberto
              </th>
              <th class="px-4 py-3">
                Situação
              </th>
              <th class="px-4 py-3 text-right">
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
                  colspan="6"
                  class="px-4 py-3"
                >
                  <div class="skeleton h-11 w-full rounded-lg" />
                </td>
              </tr>
            </template>
            <tr
              v-for="contract in items"
              v-else
              :key="contract.id"
              class="group transition hover:bg-navy-50/50"
            >
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/admin/financeiro/contratos/${contract.id}`"
                  class="block truncate text-sm font-extrabold text-navy-900 hover:text-spider-700"
                >
                  {{ contract.supplierName }}
                </NuxtLink>
                <p class="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-navy-400">
                  <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: EXPENSE_CATEGORY_COLORS[contract.category] }"
                    aria-hidden="true"
                  />
                  {{ EXPENSE_CATEGORY_LABELS[contract.category] }}
                  <span
                    v-if="contract.contact"
                    class="truncate"
                  >· {{ contract.contact }}</span>
                </p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-extrabold text-navy-900">
                  {{ formatCentsBRL(contract.totalCents) }}
                </p>
                <p class="text-[10px] font-semibold text-navy-400">
                  {{ contract.paymentCount }} {{ contract.paymentCount === 1 ? 'parcela' : 'parcelas' }}
                </p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-extrabold text-emerald-700">
                  {{ formatCentsBRL(contract.paidCents) }}
                </p>
                <div class="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-navy-100">
                  <div
                    class="h-full rounded-full bg-emerald-500"
                    :style="{ width: `${contract.progressPercent}%` }"
                  />
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-extrabold text-navy-900">
                  {{ formatCentsBRL(contract.openCents) }}
                </p>
                <p
                  v-if="contract.unscheduledCents > 0"
                  class="text-[10px] font-bold text-amber-700"
                >
                  {{ formatCentsBRL(contract.unscheduledCents) }} sem parcela
                </p>
              </td>
              <td class="px-4 py-3">
                <StatusBadge
                  kind="contract"
                  :status="contract.status"
                  size="sm"
                />
                <p class="mt-1 max-w-[190px] truncate text-[10px] font-semibold text-navy-400">
                  {{ statusHint(contract) }}
                </p>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-0.5">
                  <button
                    v-if="contract.nextPaymentId"
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                    :aria-label="`Registrar pagamento de ${contract.supplierName}`"
                    title="Registrar próximo pagamento"
                    @click="paying = contract"
                  >
                    <AppIcon
                      name="check-circle"
                      :size="16"
                    />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
                    :aria-label="`Editar ${contract.supplierName}`"
                    title="Editar contrato"
                    @click="openEdit(contract)"
                  >
                    <AppIcon
                      name="edit"
                      :size="16"
                    />
                  </button>
                  <NuxtLink
                    :to="`/admin/financeiro/contratos/${contract.id}`"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
                    :aria-label="`Ver detalhes de ${contract.supplierName}`"
                    title="Ver detalhes e parcelas"
                  >
                    <AppIcon
                      name="eye"
                      :size="16"
                    />
                  </NuxtLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
                    :aria-label="`Excluir ${contract.supplierName}`"
                    title="Excluir"
                    @click="deleteTarget = contract"
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
          icon="receipt"
          :title="hasActiveFilters ? 'Nenhum contrato encontrado' : 'Nenhum fornecedor cadastrado'"
          :description="hasActiveFilters ? 'Ajuste os filtros ou pesquise por outro termo.' : 'Cadastre o primeiro fornecedor com o objeto do contrato e o valor fechado.'"
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
              Cadastrar fornecedor
            </AppButton>
          </template>
        </EmptyState>
      </div>
    </section>

    <!-- Cards mobile -->
    <section
      class="space-y-3 md:hidden"
      aria-label="Lista de contratos"
    >
      <template v-if="pending && !data">
        <div
          v-for="n in 4"
          :key="n"
          class="card-surface p-4"
        >
          <div class="skeleton h-4 w-32 rounded" />
          <div class="skeleton mt-3 h-3 w-48 rounded" />
          <div class="skeleton mt-4 h-16 w-full rounded" />
        </div>
      </template>
      <article
        v-for="contract in items"
        v-else
        :key="contract.id"
        class="card-surface p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="`/admin/financeiro/contratos/${contract.id}`"
              class="block break-words text-sm font-extrabold leading-snug text-navy-900"
            >
              {{ contract.supplierName }}
            </NuxtLink>
          </div>
          <StatusBadge
            kind="contract"
            :status="contract.status"
            size="sm"
            class="mt-0.5 shrink-0"
          />
        </div>
        <p class="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-navy-400">
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :style="{ backgroundColor: EXPENSE_CATEGORY_COLORS[contract.category] }"
            aria-hidden="true"
          />
          {{ EXPENSE_CATEGORY_LABELS[contract.category] }}
        </p>

        <div class="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-navy-50 p-2 text-center sm:gap-2 sm:p-2.5">
          <div>
            <p class="text-[9px] font-extrabold uppercase tracking-wide text-navy-400">
              Contratado
            </p>
            <p class="mt-0.5 text-[10px] font-extrabold tabular-nums text-navy-900 sm:text-[11px]">
              {{ formatCentsBRL(contract.totalCents) }}
            </p>
          </div>
          <div>
            <p class="text-[9px] font-extrabold uppercase tracking-wide text-navy-400">
              Pago
            </p>
            <p class="mt-0.5 text-[10px] font-extrabold tabular-nums text-emerald-700 sm:text-[11px]">
              {{ formatCentsBRL(contract.paidCents) }}
            </p>
          </div>
          <div>
            <p class="text-[9px] font-extrabold uppercase tracking-wide text-navy-400">
              Aberto
            </p>
            <p class="mt-0.5 text-[10px] font-extrabold tabular-nums text-spider-700 sm:text-[11px]">
              {{ formatCentsBRL(contract.openCents) }}
            </p>
          </div>
        </div>

        <p class="mt-2 text-[11px] font-semibold text-navy-400">
          {{ statusHint(contract) }}
        </p>

        <div class="mt-3 flex items-center justify-between border-t border-navy-100 pt-2.5">
          <div class="flex gap-1">
            <button
              v-if="contract.nextPaymentId"
              type="button"
              class="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
              aria-label="Registrar pagamento"
              @click="paying = contract"
            >
              <AppIcon
                name="check-circle"
                :size="16"
              />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-navy-500 hover:bg-navy-100"
              aria-label="Editar contrato"
              @click="openEdit(contract)"
            >
              <AppIcon
                name="edit"
                :size="16"
              />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-navy-300 hover:bg-red-50 hover:text-red-600"
              aria-label="Excluir contrato"
              @click="deleteTarget = contract"
            >
              <AppIcon
                name="trash"
                :size="15"
              />
            </button>
          </div>
          <NuxtLink
            :to="`/admin/financeiro/contratos/${contract.id}`"
            class="-mr-1 rounded-lg px-2 py-2 text-xs font-extrabold text-spider-600 transition hover:bg-spider-50"
          >Parcelas e detalhes</NuxtLink>
        </div>
      </article>
      <EmptyState
        v-if="!pending && !items.length"
        icon="receipt"
        :title="hasActiveFilters ? 'Nenhum contrato encontrado' : 'Nenhum fornecedor cadastrado'"
        :description="hasActiveFilters ? 'Ajuste os filtros de busca.' : 'Cadastre o primeiro fornecedor para começar.'"
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
            Cadastrar fornecedor
          </AppButton>
        </template>
      </EmptyState>
    </section>

    <ContractFormModal
      v-model="formOpen"
      :contract="editingContract"
      @saved="onSaved"
    />

    <PaymentPayModal
      :model-value="Boolean(paying)"
      :supplier-name="paying?.supplierName ?? ''"
      :payment="payTarget"
      @update:model-value="closePay"
      @paid="onPaid"
    />

    <AppModal
      :model-value="Boolean(deleteTarget)"
      title="Excluir fornecedor"
      size="sm"
      @update:model-value="deleteTarget = null"
    >
      <p class="text-sm font-semibold text-navy-600">
        Tem certeza que deseja excluir <strong class="text-navy-900">{{ deleteTarget?.supplierName }}</strong>?
      </p>
      <p class="mt-2 rounded-xl bg-spider-50 p-3 text-xs font-semibold text-spider-800">
        O contrato e todas as {{ deleteTarget?.paymentCount ?? 0 }} parcelas cadastradas serão removidos,
        incluindo o histórico de pagamentos. Esta ação não pode ser desfeita.
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
