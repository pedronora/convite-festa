<script setup lang="ts">
import type { ContractDetail, PaymentItem } from '#shared/types'
import type { PaymentMethod } from '#shared/config/finance'
import { PAYMENT_METHOD_OPTIONS } from '#shared/config/finance'
import { paymentInputSchema, zodFieldErrors } from '#shared/validation'
import { formatCentsBRL } from '#shared/utils/money'
import { todayInSaoPaulo } from '#shared/utils/format'

const props = defineProps<{
  modelValue: boolean
  contractId: number
  supplierName: string
  contractTotalCents: number
  /** Soma das outras parcelas, sem contar a parcela em edição. */
  scheduledCents: number
  paymentCount?: number
  payment?: PaymentItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [contract: ContractDetail]
}>()

const toast = useToast()
const saving = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const today = todayInSaoPaulo()

const emptyForm = () => ({
  label: '',
  amountCents: null as number | null,
  dueDate: today,
  paid: false,
  paidOn: today,
  method: null as PaymentMethod | null,
  notes: '',
})

const form = reactive(emptyForm())
const isEdit = computed(() => Boolean(props.payment))
const title = computed(() => isEdit.value ? 'Editar parcela' : 'Nova parcela')
const availableCents = computed(() => Math.max(0, props.contractTotalCents - props.scheduledCents))
const remainingAfterCents = computed(() => Math.max(0, availableCents.value - (form.amountCents ?? 0)))

watch(() => props.modelValue, (open) => {
  if (!open) return
  serverError.value = ''
  fieldErrors.value = {}
  Object.assign(form, emptyForm())
  if (props.payment) {
    Object.assign(form, {
      label: props.payment.label || '',
      amountCents: props.payment.amountCents,
      dueDate: props.payment.dueDate,
      paid: Boolean(props.payment.paidOn),
      paidOn: props.payment.paidOn || today,
      method: props.payment.method,
      notes: props.payment.notes || '',
    })
  }
}, { immediate: true })

function payload() {
  return {
    label: form.label || null,
    amountCents: form.amountCents ?? 0,
    dueDate: form.dueDate,
    paidOn: form.paid ? form.paidOn : null,
    method: form.method,
    notes: form.notes || null,
  }
}

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  if (form.paid && !form.paidOn) {
    fieldErrors.value = { paidOn: 'Informe a data do pagamento.' }
    return
  }
  const parsed = paymentInputSchema.safeParse(payload())
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<ContractDetail>(
      isEdit.value
        ? `/api/admin/contracts/${props.contractId}/payments/${props.payment!.id}`
        : `/api/admin/contracts/${props.contractId}/payments`,
      { method: isEdit.value ? 'PUT' : 'POST', body: payload() },
    )
    toast.success(isEdit.value ? 'Parcela atualizada.' : 'Parcela cadastrada.')
    emit('saved', saved)
    emit('update:modelValue', false)
  }
  catch (error) {
    serverError.value = apiErrorMessage(error)
    Object.assign(fieldErrors.value, apiFieldErrors(error))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="title"
    :description="`${supplierName} · parcelas do contrato`"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      id="payment-form"
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <AppAlert
        v-if="serverError"
        type="error"
        title="Não foi possível salvar a parcela"
      >
        {{ serverError }}
      </AppAlert>

      <div class="grid grid-cols-3 gap-2 rounded-2xl bg-navy-50 p-3 text-center">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
            Contratado
          </p>
          <p class="mt-0.5 text-xs font-extrabold text-navy-900">
            {{ formatCentsBRL(contractTotalCents) }}
          </p>
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
            Já parcelado
          </p>
          <p class="mt-0.5 text-xs font-extrabold text-navy-900">
            {{ formatCentsBRL(scheduledCents) }}
          </p>
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
            Disponível
          </p>
          <p class="mt-0.5 text-xs font-extrabold text-emerald-700">
            {{ formatCentsBRL(availableCents) }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Identificação da parcela"
          for="payment-label"
          :error="fieldErrors.label"
          hint="Opcional. Ex.: Entrada, Parcela 2/4."
        >
          <input
            id="payment-label"
            v-model="form.label"
            type="text"
            class="input-base"
            maxlength="80"
            :placeholder="paymentCount ? `Parcela ${paymentCount + 1}` : 'Ex.: Entrada'"
            data-autofocus
          >
        </FormField>

        <FormField
          label="Valor da parcela"
          for="payment-amount"
          :error="fieldErrors.amountCents"
          :hint="`Disponível: ${formatCentsBRL(availableCents)}`"
          required
        >
          <CurrencyInput
            id="payment-amount"
            v-model="form.amountCents"
            placeholder="0,00"
          />
        </FormField>

        <FormField
          label="Vencimento"
          for="payment-due"
          :error="fieldErrors.dueDate"
          required
        >
          <input
            id="payment-due"
            v-model="form.dueDate"
            type="date"
            class="input-base"
          >
        </FormField>

        <FormField
          label="Forma de pagamento"
          for="payment-method"
          :error="fieldErrors.method"
          hint="Opcional."
        >
          <select
            id="payment-method"
            v-model="form.method"
            class="input-base"
          >
            <option :value="null">
              Não informada
            </option>
            <option
              v-for="option in PAYMENT_METHOD_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </FormField>

        <div class="sm:col-span-2">
          <label
            class="flex items-start gap-2.5 rounded-xl border border-navy-200 p-3"
          >
            <input
              v-model="form.paid"
              type="checkbox"
              class="mt-0.5 h-4 w-4 accent-emerald-600"
            >
            <span>
              <span class="block text-sm font-extrabold text-navy-800">Esta parcela já foi paga</span>
              <span class="mt-0.5 block text-xs font-semibold text-navy-400">
                Marque para registrar a data do pagamento. Se ainda está prevista, deixe desmarcado.
              </span>
            </span>
          </label>
        </div>

        <FormField
          v-if="form.paid"
          label="Data do pagamento"
          for="payment-paid-on"
          :error="fieldErrors.paidOn"
          required
          class="sm:col-span-2"
        >
          <input
            id="payment-paid-on"
            v-model="form.paidOn"
            type="date"
            class="input-base"
          >
        </FormField>

        <FormField
          label="Observações da parcela"
          for="payment-notes"
          :error="fieldErrors.notes"
          hint="Opcional. Comprovante, forma combinada, referência."
          class="sm:col-span-2"
        >
          <textarea
            id="payment-notes"
            v-model="form.notes"
            rows="2"
            maxlength="500"
            class="input-base resize-y"
            placeholder="Ex.: PIX enviado em 10/06, comprovante no e-mail."
          />
        </FormField>
      </div>

      <p
        v-if="form.amountCents && form.amountCents > availableCents"
        class="flex items-start gap-2 rounded-xl bg-spider-50 p-3 text-xs font-semibold text-spider-800"
      >
        <AppIcon
          name="alert"
          :size="15"
          class="mt-0.5 shrink-0"
        />
        O valor ultrapassa o saldo disponível. Ajuste o valor ou edite o contrato.
      </p>
      <p
        v-else-if="form.amountCents"
        class="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
      >
        <AppIcon
          name="info"
          :size="15"
          class="mt-0.5 shrink-0"
        />
        Depois desta parcela, restarão {{ formatCentsBRL(remainingAfterCents) }} de saldo sem parcela (ou disponível para outras parcelas).
      </p>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AppButton
          variant="ghost"
          size="sm"
          @click="emit('update:modelValue', false)"
        >
          Cancelar
        </AppButton>
        <AppButton
          type="submit"
          form="payment-form"
          size="sm"
          :loading="saving"
        >
          <template #icon>
            <AppIcon
              :name="isEdit ? 'check' : 'plus'"
              :size="16"
            />
          </template>
          {{ isEdit ? 'Salvar parcela' : 'Adicionar parcela' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
