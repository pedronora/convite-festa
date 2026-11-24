<script setup lang="ts">
import type { ContractDetail, PaymentItem } from '#shared/types'
import { formatDateOnly, todayInSaoPaulo } from '#shared/utils/format'
import { formatCentsBRL } from '#shared/utils/money'

const props = defineProps<{
  modelValue: boolean
  supplierName: string
  payment: PaymentItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'paid': [contract: ContractDetail]
}>()

const toast = useToast()
const saving = ref(false)
const serverError = ref('')
const paidOn = ref(todayInSaoPaulo())

const isUndo = computed(() => Boolean(props.payment?.paidOn))
const title = computed(() => isUndo.value ? 'Desfazer pagamento' : 'Registrar pagamento')

watch(() => props.modelValue, (open) => {
  if (!open) return
  serverError.value = ''
  paidOn.value = todayInSaoPaulo()
}, { immediate: true })

async function submit() {
  if (!props.payment) return
  serverError.value = ''
  if (!isUndo.value && !paidOn.value) {
    serverError.value = 'Informe a data do pagamento.'
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<ContractDetail>(
      `/api/admin/contracts/${props.payment.contractId}/payments/${props.payment.id}/pay`,
      {
        method: 'PATCH',
        body: { paidOn: isUndo.value ? null : paidOn.value },
      },
    )
    toast.success(isUndo.value ? 'Pagamento desfeito.' : 'Pagamento registrado.')
    emit('paid', saved)
    emit('update:modelValue', false)
  }
  catch (error) {
    serverError.value = apiErrorMessage(error, 'Não foi possível atualizar o pagamento.')
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
    :description="supplierName"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      v-if="payment"
      class="space-y-4"
    >
      <AppAlert
        v-if="serverError"
        type="error"
        title="Não foi possível atualizar"
      >
        {{ serverError }}
      </AppAlert>

      <div class="rounded-2xl border border-navy-100 bg-navy-50/70 p-4">
        <p class="text-[11px] font-extrabold uppercase tracking-wide text-navy-400">
          {{ payment.label || 'Parcela' }}
        </p>
        <p class="mt-1 font-display text-3xl text-navy-950">
          {{ formatCentsBRL(payment.amountCents) }}
        </p>
        <p class="mt-1 text-xs font-semibold text-navy-500">
          Vencimento: {{ formatDateOnly(payment.dueDate) }}
          <span v-if="payment.paidOn"> · Pago em {{ formatDateOnly(payment.paidOn) }}</span>
        </p>
      </div>

      <template v-if="isUndo">
        <p class="text-sm font-semibold text-navy-600">
          A parcela voltará para o saldo em aberto e deixará de contar como paga. Deseja continuar?
        </p>
      </template>
      <template v-else>
        <FormField
          label="Data do pagamento"
          for="pay-date"
          hint="Use a data em que o valor saiu da conta."
          required
        >
          <input
            id="pay-date"
            v-model="paidOn"
            type="date"
            class="input-base"
            data-autofocus
          >
        </FormField>
        <p class="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <AppIcon
            name="check-circle"
            :size="15"
            class="mt-0.5 shrink-0"
          />
          Ao confirmar, esta parcela será marcada como paga e o valor entrará no total realizado do dashboard.
        </p>
      </template>
    </div>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="saving"
          @click="emit('update:modelValue', false)"
        >
          Cancelar
        </AppButton>
        <AppButton
          :variant="isUndo ? 'danger' : 'primary'"
          size="sm"
          :loading="saving"
          @click="submit"
        >
          <template #icon>
            <AppIcon
              :name="isUndo ? 'refresh' : 'check-circle'"
              :size="16"
            />
          </template>
          {{ isUndo ? 'Desfazer pagamento' : 'Confirmar pagamento' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
