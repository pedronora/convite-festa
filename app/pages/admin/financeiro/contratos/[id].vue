<script setup lang="ts">
import type { ContractDetail, PaymentItem } from '#shared/types'
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '#shared/config/finance'
import { formatDateOnly, formatDateShort } from '#shared/utils/format'
import { formatCentsBRL } from '#shared/utils/money'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = Number(route.params.id)
if (!Number.isInteger(id) || id < 1) {
  throw createError({ statusCode: 404, statusMessage: 'Contrato não encontrado' })
}

const toast = useToast()
const { data: contract, pending, error, refresh } = await useFetch<ContractDetail>(`/api/admin/contracts/${id}`, {
  key: `admin-contract-${id}`,
})

useHead({ title: computed(() => contract.value ? `${contract.value.supplierName} · Contrato` : 'Contrato') })

const editOpen = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const paymentFormOpen = ref(false)
const editingPayment = ref<PaymentItem | null>(null)
const paying = ref<PaymentItem | null>(null)
const deletePaymentTarget = ref<PaymentItem | null>(null)
const deletingPayment = ref(false)

const totalScheduledCents = computed(() =>
  (contract.value?.payments ?? []).reduce((sum, payment) => sum + payment.amountCents, 0),
)

const availableCents = computed(() => Math.max(0, (contract.value?.totalCents ?? 0) - totalScheduledCents.value))

const scheduledForForm = computed(() => {
  const all = totalScheduledCents.value
  if (!editingPayment.value) return all
  return Math.max(0, all - editingPayment.value.amountCents)
})

const budgetSegments = computed(() => [
  { label: 'Pago', value: contract.value?.paidCents ?? 0, color: '#10b981' },
  { label: 'Agendado', value: contract.value?.scheduledCents ?? 0, color: '#3d6dae' },
  { label: 'Sem parcela', value: contract.value?.unscheduledCents ?? 0, color: '#f59e0b' },
])

const nextPayment = computed(() =>
  (contract.value?.payments ?? []).find(payment => !payment.paidOn) ?? null,
)

function openCreatePayment() {
  editingPayment.value = null
  paymentFormOpen.value = true
}

function openEditPayment(payment: PaymentItem) {
  editingPayment.value = payment
  paymentFormOpen.value = true
}

async function onPaymentSaved() {
  editingPayment.value = null
  await refresh()
}

async function onPaid() {
  paying.value = null
  await refresh()
}

function closePay(open: boolean) {
  if (!open) paying.value = null
}

async function confirmDeletePayment() {
  if (!deletePaymentTarget.value) return
  deletingPayment.value = true
  try {
    await $fetch(`/api/admin/contracts/${id}/payments/${deletePaymentTarget.value.id}`, { method: 'DELETE' })
    toast.success('Parcela excluída.')
    deletePaymentTarget.value = null
    await refresh()
  }
  catch (err) {
    toast.error(apiErrorMessage(err, 'Não foi possível excluir a parcela.'))
  }
  finally {
    deletingPayment.value = false
  }
}

async function confirmDeleteContract() {
  deleting.value = true
  try {
    await $fetch(`/api/admin/contracts/${id}`, { method: 'DELETE' })
    toast.success('Fornecedor e contrato excluídos.')
    await navigateTo('/admin/financeiro/contratos')
  }
  catch (err) {
    toast.error(apiErrorMessage(err, 'Não foi possível excluir o fornecedor.'))
  }
  finally {
    deleting.value = false
  }
}

function paymentStatusHint(payment: PaymentItem): string {
  if (payment.paidOn) return `Pago em ${formatDateOnly(payment.paidOn)}`
  if (payment.daysUntilDue === null) return 'A vencer'
  if (payment.daysUntilDue < 0) {
    const days = Math.abs(payment.daysUntilDue)
    return `Atrasada há ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  if (payment.daysUntilDue === 0) return 'Vence hoje'
  if (payment.daysUntilDue === 1) return 'Vence amanhã'
  return `Vence em ${payment.daysUntilDue} dias`
}
</script>

<template>
  <div>
    <div class="mb-4">
      <NuxtLink
        to="/admin/financeiro/contratos"
        class="inline-flex items-center gap-1.5 text-xs font-extrabold text-navy-400 transition hover:text-navy-700"
      >
        <AppIcon
          name="chevron-left"
          :size="14"
        /> Voltar para contratos
      </NuxtLink>
    </div>

    <div
      v-if="pending && !contract"
      class="space-y-4"
    >
      <div class="card-surface p-6">
        <div class="skeleton h-6 w-52 rounded" />
        <div class="skeleton mt-3 h-4 w-72 rounded" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="n in 4"
          :key="n"
          class="card-surface h-28 p-5"
        >
          <div class="skeleton h-full w-full rounded-xl" />
        </div>
      </div>
    </div>

    <AppAlert
      v-else-if="error || !contract"
      type="error"
      title="Contrato não encontrado"
    >
      Este fornecedor pode ter sido excluído.
      <NuxtLink
        to="/admin/financeiro/contratos"
        class="underline"
      >
        Voltar para a lista
      </NuxtLink>
    </AppAlert>

    <template v-else>
      <PageHeader
        :eyebrow="EXPENSE_CATEGORY_LABELS[contract.category]"
        :title="contract.supplierName"
        :subtitle="contract.description"
      >
        <template #actions>
          <AppButton
            variant="outline"
            size="sm"
            @click="editOpen = true"
          >
            <template #icon>
              <AppIcon
                name="edit"
                :size="15"
              />
            </template>
            Editar contrato
          </AppButton>
          <AppButton
            size="sm"
            :disabled="availableCents <= 0"
            @click="openCreatePayment"
          >
            <template #icon>
              <AppIcon
                name="plus"
                :size="16"
              />
            </template>
            Nova parcela
          </AppButton>
          <button
            type="button"
            class="rounded-lg p-2 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Excluir contrato"
            title="Excluir contrato"
            @click="deleteOpen = true"
          >
            <AppIcon
              name="trash"
              :size="18"
            />
          </button>
        </template>
      </PageHeader>

      <!-- Resumo -->
      <section
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo do contrato"
      >
        <StatCard
          label="Valor contratado"
          :value="formatCentsBRL(contract.totalCents)"
          :hint="`${contract.paymentCount} ${contract.paymentCount === 1 ? 'parcela cadastrada' : 'parcelas cadastradas'}`"
          icon="receipt"
          tone="blue"
          compact
        />
        <StatCard
          label="Pago"
          :value="formatCentsBRL(contract.paidCents)"
          :hint="`${contract.progressPercent}% do contrato`"
          icon="check-circle"
          tone="green"
          compact
        />
        <StatCard
          label="Em aberto"
          :value="formatCentsBRL(contract.openCents)"
          :hint="contract.status === 'paid' ? 'Contrato quitado' : 'Ainda falta pagar'"
          icon="wallet"
          tone="red"
          compact
        />
        <StatCard
          label="Sem parcela"
          :value="formatCentsBRL(contract.unscheduledCents)"
          :hint="contract.unscheduledCents > 0 ? 'Saldo que ainda não foi parcelado' : 'Todo o saldo está parcelado'"
          icon="calendar-clock"
          tone="amber"
          compact
        />
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <!-- Orçamento -->
        <section class="card-surface p-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-navy-900">
                Situação do pagamento
              </h2>
              <p class="mt-0.5 text-xs font-semibold text-navy-400">
                O contrato está {{ contract.progressPercent }}% pago.
              </p>
            </div>
            <StatusBadge
              kind="contract"
              :status="contract.status"
            />
          </div>

          <div class="mt-5">
            <StackedBar
              :segments="budgetSegments"
              :total="contract.totalCents"
              :height="16"
              aria-label="Distribuição do contrato entre pago, agendado e sem parcela"
            />
          </div>

          <div
            v-if="contract.unscheduledCents > 0"
            class="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="flex items-start gap-2 text-xs font-semibold text-amber-900">
              <AppIcon
                name="alert"
                :size="15"
                class="mt-0.5 shrink-0"
              />
              Ainda há {{ formatCentsBRL(contract.unscheduledCents) }} sem parcela.
            </p>
            <AppButton
              variant="outline"
              size="sm"
              @click="openCreatePayment"
            >
              Adicionar parcela
            </AppButton>
          </div>

          <div
            v-if="availableCents <= 0 && contract.unscheduledCents === 0"
            class="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
          >
            <AppIcon
              name="check-circle"
              :size="16"
            />
            Todas as parcelas somam o valor total do contrato.
          </div>
        </section>

        <!-- Informações -->
        <section class="card-surface p-6">
          <h2 class="text-sm font-extrabold text-navy-900">
            Dados do fornecedor
          </h2>
          <dl class="mt-4 space-y-3">
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                Categoria
              </dt>
              <dd class="flex items-center gap-1.5 text-sm font-bold text-navy-800">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: EXPENSE_CATEGORY_COLORS[contract.category] }"
                  aria-hidden="true"
                />
                {{ EXPENSE_CATEGORY_LABELS[contract.category] }}
              </dd>
            </div>
            <div
              v-if="contract.contact"
              class="flex items-start justify-between gap-4"
            >
              <dt class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                Contato
              </dt>
              <dd class="break-all text-right text-sm font-bold text-navy-800">
                {{ contract.contact }}
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                Próximo vencimento
              </dt>
              <dd class="text-right text-sm font-bold text-navy-800">
                <template v-if="contract.nextDueDate">
                  {{ formatDateOnly(contract.nextDueDate) }}
                  <span class="block text-[11px] font-semibold text-navy-400">
                    {{ contract.nextDueCents ? formatCentsBRL(contract.nextDueCents) : '' }}
                  </span>
                </template>
                <span
                  v-else
                  class="text-navy-400"
                >—</span>
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
                Cadastrado em
              </dt>
              <dd class="text-right text-sm font-bold text-navy-800">
                {{ formatDateShort(contract.createdAt) }}
              </dd>
            </div>
          </dl>

          <div
            v-if="contract.notes"
            class="mt-4 rounded-xl bg-navy-50 p-3"
          >
            <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
              Observações internas
            </p>
            <p class="mt-1 whitespace-pre-line text-xs font-semibold leading-relaxed text-navy-700">
              {{ contract.notes }}
            </p>
          </div>

          <div
            v-if="nextPayment"
            class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3"
          >
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
                Próxima parcela
              </p>
              <p class="truncate text-sm font-extrabold text-navy-900">
                {{ nextPayment.label || 'Parcela' }} · {{ formatCentsBRL(nextPayment.amountCents) }}
              </p>
              <p class="text-[11px] font-semibold text-navy-400">
                {{ formatDateOnly(nextPayment.dueDate) }} · {{ paymentStatusHint(nextPayment) }}
              </p>
            </div>
            <AppButton
              variant="outline"
              size="sm"
              @click="paying = nextPayment"
            >
              Pagar
            </AppButton>
          </div>
        </section>
      </div>

      <!-- Parcelas -->
      <section class="card-surface mt-4 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-sm font-extrabold text-navy-900">
              Parcelas do contrato
            </h2>
            <p class="mt-0.5 text-xs font-semibold text-navy-400">
              {{ contract.paymentCount }} {{ contract.paymentCount === 1 ? 'parcela' : 'parcelas' }}
              · {{ contract.paidPaymentCount }} {{ contract.paidPaymentCount === 1 ? 'paga' : 'pagas' }}
            </p>
          </div>
          <AppButton
            variant="outline"
            size="sm"
            :disabled="availableCents <= 0"
            @click="openCreatePayment"
          >
            <template #icon>
              <AppIcon
                name="plus"
                :size="15"
              />
            </template>
            Adicionar parcela
          </AppButton>
        </div>

        <div
          v-if="!contract.payments.length"
          class="p-6"
        >
          <EmptyState
            icon="credit-card"
            title="Nenhuma parcela cadastrada"
            description="Cadastre a primeira parcela ou programe as demais até o dia da festa. O saldo sem parcela fica destacado no painel."
          >
            <template #action>
              <AppButton
                size="sm"
                :disabled="availableCents <= 0"
                @click="openCreatePayment"
              >
                <template #icon>
                  <AppIcon
                    name="plus"
                    :size="16"
                  />
                </template>
                Adicionar primeira parcela
              </AppButton>
            </template>
          </EmptyState>
        </div>

        <ul
          v-else
          class="divide-y divide-navy-100"
        >
          <li
            v-for="payment in contract.payments"
            :key="payment.id"
            class="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-navy-50/40 sm:flex-nowrap sm:px-6"
          >
            <span
              :class="[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : payment.status === 'overdue' ? 'bg-rose-50 text-rose-600' : payment.status === 'due_soon' ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-500',
              ]"
            >
              <AppIcon
                :name="payment.status === 'paid' ? 'check-circle' : 'calendar-clock'"
                :size="18"
              />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-extrabold text-navy-900">
                {{ payment.label || 'Parcela' }}
              </p>
              <p class="text-[11px] font-semibold text-navy-400">
                Vence {{ formatDateOnly(payment.dueDate) }}
                <span v-if="payment.method"> · {{ PAYMENT_METHOD_LABELS[payment.method] }}</span>
                <span v-if="payment.notes"> · {{ payment.notes }}</span>
              </p>
            </div>

            <div class="text-right">
              <p class="text-sm font-extrabold text-navy-900">
                {{ formatCentsBRL(payment.amountCents) }}
              </p>
              <p class="text-[10px] font-semibold text-navy-400">
                {{ paymentStatusHint(payment) }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <StatusBadge
                kind="payment"
                :status="payment.status"
                size="sm"
              />
              <button
                type="button"
                class="rounded-lg p-2 transition"
                :class="payment.paidOn ? 'text-navy-400 hover:bg-navy-100 hover:text-navy-800' : 'text-emerald-600 hover:bg-emerald-50'"
                :aria-label="payment.paidOn ? `Desfazer pagamento de ${formatCentsBRL(payment.amountCents)}` : `Registrar pagamento de ${formatCentsBRL(payment.amountCents)}`"
                :title="payment.paidOn ? 'Desfazer pagamento' : 'Registrar pagamento'"
                @click="paying = payment"
              >
                <AppIcon
                  :name="payment.paidOn ? 'refresh' : 'check-circle'"
                  :size="16"
                />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-800"
                aria-label="Editar parcela"
                title="Editar parcela"
                @click="openEditPayment(payment)"
              >
                <AppIcon
                  name="edit"
                  :size="16"
                />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Excluir parcela"
                title="Excluir parcela"
                @click="deletePaymentTarget = payment"
              >
                <AppIcon
                  name="trash"
                  :size="16"
                />
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <ContractFormModal
      v-model="editOpen"
      :contract="contract"
      @saved="refresh()"
    />

    <PaymentFormModal
      v-if="contract"
      v-model="paymentFormOpen"
      :contract-id="contract.id"
      :supplier-name="contract.supplierName"
      :contract-total-cents="contract.totalCents"
      :scheduled-cents="scheduledForForm"
      :payment-count="contract.paymentCount"
      :payment="editingPayment"
      @saved="onPaymentSaved"
    />

    <PaymentPayModal
      :model-value="Boolean(paying)"
      :supplier-name="contract?.supplierName ?? ''"
      :payment="paying"
      @update:model-value="closePay"
      @paid="onPaid"
    />

    <AppModal
      :model-value="Boolean(deletePaymentTarget)"
      title="Excluir parcela"
      size="sm"
      @update:model-value="deletePaymentTarget = null"
    >
      <p class="text-sm font-semibold text-navy-600">
        Excluir a parcela de <strong class="text-navy-900">{{ deletePaymentTarget ? formatCentsBRL(deletePaymentTarget.amountCents) : '' }}</strong>
        com vencimento em {{ deletePaymentTarget ? formatDateOnly(deletePaymentTarget.dueDate) : '' }}?
      </p>
      <p class="mt-2 rounded-xl bg-spider-50 p-3 text-xs font-semibold text-spider-800">
        O valor volta a ficar sem parcela no contrato. Se esta parcela estava paga, o pagamento também deixa de contar no painel.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="deletingPayment"
            @click="deletePaymentTarget = null"
          >
            Cancelar
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            :loading="deletingPayment"
            @click="confirmDeletePayment"
          >
            <template #icon>
              <AppIcon
                name="trash"
                :size="15"
              />
            </template>
            Excluir parcela
          </AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal
      :model-value="deleteOpen"
      title="Excluir fornecedor"
      size="sm"
      @update:model-value="deleteOpen = false"
    >
      <p class="text-sm font-semibold text-navy-600">
        Tem certeza que deseja excluir <strong class="text-navy-900">{{ contract?.supplierName }}</strong>?
      </p>
      <p class="mt-2 rounded-xl bg-spider-50 p-3 text-xs font-semibold text-spider-800">
        O contrato e todas as {{ contract?.paymentCount ?? 0 }} parcelas serão removidos, incluindo o histórico de pagamentos.
        Esta ação não pode ser desfeita.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="deleting"
            @click="deleteOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            :loading="deleting"
            @click="confirmDeleteContract"
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
