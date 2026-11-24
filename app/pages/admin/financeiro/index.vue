<script setup lang="ts">
import type { FinanceSummary, FinanceUpcomingPayment, PaymentItem } from '#shared/types'
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS, UPCOMING_WINDOWS } from '#shared/config/finance'
import { formatDateOnly, formatDateOnlyLong } from '#shared/utils/format'
import { formatCentsBRL } from '#shared/utils/money'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Financeiro' })

const { data, pending, error, refresh } = await useFetch<FinanceSummary>('/api/admin/finance/summary', {
  key: 'admin-finance-summary',
})

const refreshing = ref(false)
const windowDays = ref<number>(30)
const paying = ref<FinanceUpcomingPayment | null>(null)

const metrics = computed(() => data.value?.metrics)
const contractedCents = computed(() => metrics.value?.contractedCents ?? 0)

const budgetSegments = computed(() => [
  { label: 'Pago', value: metrics.value?.paidCents ?? 0, color: '#10b981' },
  { label: 'Agendado', value: metrics.value?.scheduledCents ?? 0, color: '#3d6dae' },
  { label: 'Sem parcela', value: metrics.value?.unscheduledCents ?? 0, color: '#f59e0b' },
])

const visibleUpcoming = computed(() => {
  const items = data.value?.upcoming ?? []
  if (!windowDays.value) return items
  return items.filter(item => item.daysUntilDue === null || item.daysUntilDue <= windowDays.value)
})

const upcomingTotal = computed(() => visibleUpcoming.value.reduce((sum, item) => sum + item.amountCents, 0))

const maxCategoryCents = computed(() => Math.max(1, ...(data.value?.byCategory.map(row => row.contractedCents) ?? [1])))

const payTarget = computed<PaymentItem | null>(() => {
  const item = paying.value
  if (!item) return null
  return {
    id: item.id,
    contractId: item.contractId,
    label: item.label,
    amountCents: item.amountCents,
    dueDate: item.dueDate,
    paidOn: null,
    method: null,
    notes: null,
    status: item.status,
    daysUntilDue: item.daysUntilDue,
    createdAt: '',
    updatedAt: '',
  }
})

const hasContracts = computed(() => (metrics.value?.contractsCount ?? 0) > 0)

function dueLabel(item: FinanceUpcomingPayment): string {
  if (item.daysUntilDue === null) return formatDateOnly(item.dueDate)
  if (item.daysUntilDue < 0) {
    const days = Math.abs(item.daysUntilDue)
    return `Atrasado ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  if (item.daysUntilDue === 0) return 'Vence hoje'
  if (item.daysUntilDue === 1) return 'Vence amanhã'
  return `Vence em ${item.daysUntilDue} dias`
}

function categoryPercent(value: number): number {
  return Math.min(100, Math.max(2, Math.round((value / maxCategoryCents.value) * 100)))
}

function openPercent(paid: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((paid / total) * 100))
}

async function reload() {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

async function onPaid() {
  paying.value = null
  await refresh()
}

function closePay(open: boolean) {
  if (!open) paying.value = null
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Controle de gastos"
      title="Financeiro"
      subtitle="Quanto já foi contratado, quanto já saiu do bolso e o que ainda vai vencer até a festa."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :loading="refreshing"
          @click="reload"
        >
          <template #icon>
            <AppIcon
              name="refresh"
              :size="15"
            />
          </template>
          Atualizar
        </AppButton>
        <AppButton
          to="/admin/financeiro/contratos?novo=1"
          size="sm"
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

    <AppAlert
      v-if="error"
      type="error"
      title="Não foi possível carregar o financeiro"
      class="mb-5"
    >
      {{ apiErrorMessage(error) }}
      <button
        type="button"
        class="ml-1 underline"
        @click="reload"
      >
        Tentar novamente
      </button>
    </AppAlert>

    <div
      v-if="pending && !data"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-live="polite"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="card-surface p-5"
      >
        <div class="skeleton h-3 w-24 rounded" />
        <div class="skeleton mt-4 h-9 w-28 rounded-lg" />
        <div class="skeleton mt-3 h-3 w-32 rounded" />
      </div>
    </div>

    <EmptyState
      v-else-if="data && !hasContracts"
      icon="wallet"
      title="Nenhum contrato cadastrado ainda"
      description="Cadastre o primeiro fornecedor com o valor contratado e as parcelas para acompanhar o orçamento da festa."
    >
      <template #action>
        <AppButton
          to="/admin/financeiro/contratos?novo=1"
          size="sm"
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

    <template v-else-if="data && metrics">
      <!-- Alertas -->
      <section
        v-if="metrics.overdueCents > 0 || metrics.dueNext7DaysCents > 0"
        class="mb-4 grid gap-3 lg:grid-cols-2"
        aria-label="Alertas financeiros"
      >
        <NuxtLink
          v-if="metrics.overdueCents > 0"
          to="/admin/financeiro/contratos?status=overdue"
          class="group flex items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <AppIcon
              name="alert"
              :size="22"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-extrabold text-rose-900">
              {{ formatCentsBRL(metrics.overdueCents) }} em atraso
            </p>
            <p class="text-xs font-semibold text-rose-700">
              {{ metrics.overdueContractsCount }}
              {{ metrics.overdueContractsCount === 1 ? 'contrato precisa' : 'contratos precisam' }}
              de atenção
            </p>
          </div>
          <AppIcon
            name="arrow-right"
            :size="18"
            class="shrink-0 text-rose-400 transition group-hover:translate-x-0.5"
          />
        </NuxtLink>

        <NuxtLink
          v-if="metrics.dueNext7DaysCents > 0"
          to="/admin/financeiro/contratos"
          class="group flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AppIcon
              name="calendar-clock"
              :size="22"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-extrabold text-amber-900">
              {{ formatCentsBRL(metrics.dueNext7DaysCents) }} vencem nos próximos 7 dias
            </p>
            <p class="text-xs font-semibold text-amber-700">
              {{ metrics.dueSoonContractsCount }}
              {{ metrics.dueSoonContractsCount === 1 ? 'contrato' : 'contratos' }}
              com vencimento próximo
            </p>
          </div>
          <AppIcon
            name="arrow-right"
            :size="18"
            class="shrink-0 text-amber-400 transition group-hover:translate-x-0.5"
          />
        </NuxtLink>
      </section>

      <!-- Indicadores -->
      <section
        aria-label="Indicadores financeiros"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total contratado"
          :value="formatCentsBRL(metrics.contractedCents)"
          :hint="`${metrics.contractsCount} ${metrics.contractsCount === 1 ? 'fornecedor' : 'fornecedores'} · ${metrics.paymentsCount} parcelas`"
          icon="receipt"
          tone="blue"
          compact
        />
        <StatCard
          label="Já pago"
          :value="formatCentsBRL(metrics.paidCents)"
          :hint="`${metrics.paidPercent}% do contratado · ${metrics.paidPaymentsCount} parcelas quitadas`"
          icon="check-circle"
          tone="green"
          compact
        />
        <StatCard
          label="Saldo em aberto"
          :value="formatCentsBRL(metrics.openCents)"
          :hint="`${metrics.openContractsCount} ${metrics.openContractsCount === 1 ? 'contrato em aberto' : 'contratos em aberto'}`"
          icon="wallet"
          tone="red"
          compact
        />
        <StatCard
          label="Vence em 30 dias"
          :value="formatCentsBRL(metrics.dueNext30DaysCents)"
          :hint="`${formatCentsBRL(metrics.dueNext7DaysCents)} nos próximos 7 dias`"
          icon="calendar-clock"
          tone="amber"
          compact
        />
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <!-- Termômetro do orçamento -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Termômetro do orçamento
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Como o valor contratado está distribuído entre pago, agendado e ainda sem parcela.
              </p>
            </div>
            <span class="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-extrabold text-navy-600">
              {{ metrics.paidPercent }}% pago
            </span>
          </div>
          <div class="mt-5">
            <StackedBar
              :segments="budgetSegments"
              :total="contractedCents"
              :height="16"
              aria-label="Distribuição do valor contratado"
            />
          </div>
          <div class="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-navy-950 px-4 py-3 text-white">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-300">
                Falta pagar
              </p>
              <p class="font-display text-2xl leading-tight">
                {{ formatCentsBRL(metrics.openCents) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-300">
                Contratado
              </p>
              <p class="text-sm font-extrabold">
                {{ formatCentsBRL(metrics.contractedCents) }}
              </p>
            </div>
          </div>
          <p
            v-if="metrics.unscheduledCents > 0"
            class="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"
          >
            <AppIcon
              name="alert"
              :size="15"
              class="mt-0.5 shrink-0"
            />
            {{ formatCentsBRL(metrics.unscheduledCents) }} do saldo ainda não têm parcela cadastrada.
            <NuxtLink
              to="/admin/financeiro/contratos"
              class="ml-0.5 underline"
            >Revisar contratos</NuxtLink>
          </p>
        </section>

        <!-- Situação dos contratos -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Situação dos contratos
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Calculada pelos vencimentos e pelos pagamentos registrados.
              </p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <AppIcon
                name="clipboard"
                :size="18"
              />
            </span>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-2.5">
            <NuxtLink
              to="/admin/financeiro/contratos?status=paid"
              class="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 transition hover:-translate-y-0.5"
            >
              <p class="font-display text-3xl leading-none text-emerald-700">
                {{ data.byStatus.paid }}
              </p>
              <p class="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                Quitados
              </p>
            </NuxtLink>
            <NuxtLink
              to="/admin/financeiro/contratos?status=open"
              class="rounded-2xl border border-navy-100 bg-navy-50 p-3 transition hover:-translate-y-0.5"
            >
              <p class="font-display text-3xl leading-none text-navy-700">
                {{ data.byStatus.open }}
              </p>
              <p class="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-navy-500">
                Em aberto
              </p>
            </NuxtLink>
            <NuxtLink
              to="/admin/financeiro/contratos?status=due_soon"
              class="rounded-2xl border border-amber-100 bg-amber-50 p-3 transition hover:-translate-y-0.5"
            >
              <p class="font-display text-3xl leading-none text-amber-700">
                {{ data.byStatus.due_soon }}
              </p>
              <p class="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                Vencem em breve
              </p>
            </NuxtLink>
            <NuxtLink
              to="/admin/financeiro/contratos?status=overdue"
              class="rounded-2xl border border-rose-100 bg-rose-50 p-3 transition hover:-translate-y-0.5"
            >
              <p class="font-display text-3xl leading-none text-rose-700">
                {{ data.byStatus.overdue }}
              </p>
              <p class="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                Em atraso
              </p>
            </NuxtLink>
          </div>
          <div class="mt-4 border-t border-navy-100 pt-4">
            <div class="mb-2 flex items-center justify-between text-[11px] font-bold text-navy-400">
              <span>Contratos quitados</span>
              <span>{{ data.byStatus.paid }} de {{ metrics.contractsCount }}</span>
            </div>
            <ProgressBar
              :value="metrics.contractsCount > 0 ? Math.round((data.byStatus.paid / metrics.contractsCount) * 100) : 0"
              color="#10b981"
              :show-value="false"
              label="Contratos quitados"
            />
          </div>
        </section>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <!-- Próximos vencimentos -->
        <section class="card-surface p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Contas a vencer
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Parcelas ainda em aberto, ordenadas por vencimento.
              </p>
            </div>
            <div
              class="inline-flex rounded-lg border border-navy-200 p-0.5"
              role="group"
              aria-label="Filtrar vencimentos"
            >
              <button
                v-for="option in UPCOMING_WINDOWS"
                :key="option"
                type="button"
                :class="[
                  'rounded-md px-2 py-1 text-[11px] font-extrabold transition',
                  windowDays === option ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50',
                ]"
                @click="windowDays = option"
              >
                {{ option }}d
              </button>
              <button
                type="button"
                :class="[
                  'rounded-md px-2 py-1 text-[11px] font-extrabold transition',
                  windowDays === 0 ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50',
                ]"
                @click="windowDays = 0"
              >
                Tudo
              </button>
            </div>
          </div>

          <ul
            v-if="visibleUpcoming.length"
            class="mt-4 divide-y divide-navy-100"
          >
            <li
              v-for="item in visibleUpcoming.slice(0, 8)"
              :key="item.id"
              class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                :class="[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  item.status === 'overdue' ? 'bg-rose-50 text-rose-600' : item.status === 'due_soon' ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-500',
                ]"
              >
                <AppIcon
                  name="receipt"
                  :size="18"
                />
              </span>
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="`/admin/financeiro/contratos/${item.contractId}`"
                  class="block truncate text-sm font-extrabold text-navy-900 hover:text-spider-700"
                >
                  {{ item.supplierName }}
                </NuxtLink>
                <p class="truncate text-[11px] font-semibold text-navy-400">
                  {{ item.label || EXPENSE_CATEGORY_LABELS[item.category] }}
                  · {{ dueLabel(item) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-extrabold text-navy-900">
                  {{ formatCentsBRL(item.amountCents) }}
                </p>
                <p class="text-[10px] font-semibold text-navy-400">
                  {{ formatDateOnly(item.dueDate) }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                :aria-label="`Registrar pagamento de ${item.supplierName}`"
                title="Registrar pagamento"
                @click="paying = item"
              >
                <AppIcon
                  name="check-circle"
                  :size="18"
                />
              </button>
            </li>
          </ul>

          <div
            v-else
            class="mt-4 rounded-2xl border-2 border-dashed border-navy-200 p-6 text-center"
          >
            <AppIcon
              name="check-circle"
              :size="26"
              class="mx-auto text-emerald-400"
            />
            <p class="mt-2 text-sm font-semibold text-navy-500">
              Nenhuma parcela em aberto neste período.
            </p>
          </div>

          <p
            v-if="visibleUpcoming.length"
            class="mt-3 flex items-center justify-between border-t border-navy-100 pt-3 text-[11px] font-bold text-navy-400"
          >
            <span>{{ visibleUpcoming.length }} parcelas no período</span>
            <span class="text-navy-700">{{ formatCentsBRL(upcomingTotal) }}</span>
          </p>
        </section>

        <!-- Categorias -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Onde o dinheiro está indo
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Valor contratado por categoria.
              </p>
            </div>
            <AppButton
              to="/admin/financeiro/contratos"
              variant="ghost"
              size="sm"
            >
              Ver contratos
            </AppButton>
          </div>

          <ul
            v-if="data.byCategory.length"
            class="mt-5 space-y-3.5"
          >
            <li
              v-for="row in data.byCategory"
              :key="row.category"
            >
              <div class="mb-1 flex items-baseline justify-between gap-2">
                <span class="flex items-center gap-1.5 text-xs font-bold text-navy-700">
                  <span
                    class="h-2 w-2 rounded-full"
                    :style="{ backgroundColor: EXPENSE_CATEGORY_COLORS[row.category] }"
                    aria-hidden="true"
                  />
                  {{ EXPENSE_CATEGORY_LABELS[row.category] }}
                </span>
                <span class="text-xs font-extrabold text-navy-900">
                  {{ formatCentsBRL(row.contractedCents) }}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-navy-100">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${categoryPercent(row.contractedCents)}%`, backgroundColor: EXPENSE_CATEGORY_COLORS[row.category] }"
                />
              </div>
              <p class="mt-1 text-[10px] font-semibold text-navy-400">
                {{ row.count }} {{ row.count === 1 ? 'contrato' : 'contratos' }}
                · pago {{ formatCentsBRL(row.paidCents) }}
                · aberto {{ formatCentsBRL(row.openCents) }}
              </p>
            </li>
          </ul>
          <p
            v-else
            class="mt-4 text-sm font-semibold text-navy-400"
          >
            Sem categorias cadastradas.
          </p>
        </section>
      </div>

      <!-- Evolução -->
      <section class="card-surface mt-4 p-6">
        <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-extrabold text-navy-900">
              Planejado x pago
            </h2>
            <p class="mt-0.5 text-xs font-semibold text-navy-400">
              Acumulado mês a mês pelas datas de vencimento e de pagamento.
            </p>
          </div>
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <AppIcon
              name="trending-up"
              :size="18"
            />
          </span>
        </div>
        <CumulativeChart
          :points="data.monthly"
          :contracted-cents="metrics.contractedCents"
        />
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <!-- Maiores saldos -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Maiores saldos em aberto
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Contratos que ainda pesam no orçamento.
              </p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-spider-50 text-spider-600">
              <AppIcon
                name="wallet"
                :size="18"
              />
            </span>
          </div>

          <ul
            v-if="data.topOpenContracts.length"
            class="mt-4 space-y-3"
          >
            <li
              v-for="contract in data.topOpenContracts"
              :key="contract.id"
            >
              <NuxtLink
                :to="`/admin/financeiro/contratos/${contract.id}`"
                class="block rounded-xl border border-navy-100 p-3 transition hover:border-navy-200 hover:bg-navy-50/40"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-extrabold text-navy-900">
                      {{ contract.supplierName }}
                    </p>
                    <p class="text-[11px] font-semibold text-navy-400">
                      {{ EXPENSE_CATEGORY_LABELS[contract.category] }}
                      · {{ contract.paymentCount }} {{ contract.paymentCount === 1 ? 'parcela' : 'parcelas' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-spider-700">
                      {{ formatCentsBRL(contract.openCents) }}
                    </p>
                    <p class="text-[10px] font-semibold text-navy-400">
                      em aberto
                    </p>
                  </div>
                </div>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
                  <div
                    class="h-full rounded-full bg-emerald-500"
                    :style="{ width: `${openPercent(contract.paidCents, contract.totalCents)}%` }"
                  />
                </div>
                <p class="mt-1 text-[10px] font-semibold text-navy-400">
                  {{ openPercent(contract.paidCents, contract.totalCents) }}% de {{ formatCentsBRL(contract.totalCents) }} pago
                  <span v-if="contract.nextDueDate"> · próximo vencimento {{ formatDateOnly(contract.nextDueDate) }}</span>
                </p>
              </NuxtLink>
            </li>
          </ul>
          <p
            v-else
            class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
          >
            <AppIcon
              name="check-circle"
              :size="17"
            />
            Todos os contratos estão quitados.
          </p>
        </section>

        <!-- Pagamentos recentes -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Pagamentos recentes
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                Últimos valores efetivamente pagos.
              </p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <AppIcon
                name="check-circle"
                :size="18"
              />
            </span>
          </div>

          <ul
            v-if="data.recentPayments.length"
            class="mt-4 divide-y divide-navy-100"
          >
            <li
              v-for="payment in data.recentPayments"
              :key="payment.id"
              class="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <NuxtLink
                  :to="`/admin/financeiro/contratos/${payment.contractId}`"
                  class="block truncate text-sm font-extrabold text-navy-900 hover:text-spider-700"
                >
                  {{ payment.supplierName }}
                </NuxtLink>
                <p class="truncate text-[11px] font-semibold text-navy-400">
                  {{ payment.label || 'Pagamento' }} · {{ formatDateOnly(payment.paidOn) }}
                </p>
              </div>
              <p class="shrink-0 text-sm font-extrabold text-emerald-700">
                {{ formatCentsBRL(payment.amountCents) }}
              </p>
            </li>
          </ul>
          <p
            v-else
            class="mt-4 text-sm font-semibold text-navy-400"
          >
            Nenhum pagamento registrado ainda. As parcelas quitadas aparecem aqui.
          </p>
        </section>
      </div>

      <p class="mt-5 text-center text-[11px] font-semibold text-navy-400">
        Referência de hoje: {{ formatDateOnlyLong(data.today) }} · valores em reais.
      </p>
    </template>

    <PaymentPayModal
      :model-value="Boolean(paying)"
      :supplier-name="paying?.supplierName ?? ''"
      :payment="payTarget"
      @update:model-value="closePay"
      @paid="onPaid"
    />
  </div>
</template>
