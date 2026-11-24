<script setup lang="ts">
import type { ContractDetail, ContractSummary } from '#shared/types'
import type { ExpenseCategory } from '#shared/config/finance'
import { EXPENSE_CATEGORY_OPTIONS } from '#shared/config/finance'
import { contractInputSchema, zodFieldErrors } from '#shared/validation'

const props = defineProps<{
  modelValue: boolean
  contract?: ContractSummary | ContractDetail | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [contract: ContractDetail]
}>()

const toast = useToast()
const saving = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const emptyForm = () => ({
  supplierName: '',
  category: 'outros' as ExpenseCategory,
  contact: '',
  description: '',
  totalCents: null as number | null,
  notes: '',
})

const form = reactive(emptyForm())
const isEdit = computed(() => Boolean(props.contract))
const title = computed(() => isEdit.value ? 'Editar fornecedor e contrato' : 'Novo fornecedor e contrato')

watch(() => props.modelValue, (open) => {
  if (!open) return
  serverError.value = ''
  fieldErrors.value = {}
  Object.assign(form, emptyForm())
  if (props.contract) {
    Object.assign(form, {
      supplierName: props.contract.supplierName,
      category: props.contract.category,
      contact: props.contract.contact || '',
      description: props.contract.description,
      totalCents: props.contract.totalCents,
      notes: props.contract.notes || '',
    })
  }
}, { immediate: true })

function payload() {
  return {
    supplierName: form.supplierName,
    category: form.category,
    contact: form.contact || null,
    description: form.description,
    totalCents: form.totalCents ?? 0,
    notes: form.notes || null,
  }
}

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  const parsed = contractInputSchema.safeParse(payload())
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<ContractDetail>(
      isEdit.value ? `/api/admin/contracts/${props.contract!.id}` : '/api/admin/contracts',
      { method: isEdit.value ? 'PUT' : 'POST', body: payload() },
    )
    toast.success(isEdit.value ? 'Fornecedor atualizado.' : 'Fornecedor e contrato cadastrados.')
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
    description="Cadastre o fornecedor, o objeto contratado e o valor total. As parcelas entram depois, no detalhe do contrato."
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      id="contract-form"
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <AppAlert
        v-if="serverError"
        type="error"
        title="Não foi possível salvar"
      >
        {{ serverError }}
      </AppAlert>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Fornecedor"
          for="contract-supplier"
          :error="fieldErrors.supplierName"
          required
          class="sm:col-span-2"
        >
          <input
            id="contract-supplier"
            v-model="form.supplierName"
            type="text"
            class="input-base"
            maxlength="160"
            placeholder="Ex.: Buffet Sabor da Festa"
            data-autofocus
          >
        </FormField>

        <FormField
          label="Categoria"
          for="contract-category"
          :error="fieldErrors.category"
          required
        >
          <select
            id="contract-category"
            v-model="form.category"
            class="input-base"
          >
            <option
              v-for="option in EXPENSE_CATEGORY_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </FormField>

        <FormField
          label="Valor contratado"
          for="contract-total"
          :error="fieldErrors.totalCents"
          hint="O valor total do contrato, ainda que seja pago em parcelas."
          required
        >
          <CurrencyInput
            id="contract-total"
            v-model="form.totalCents"
            placeholder="0,00"
          />
        </FormField>

        <FormField
          label="Contato do fornecedor"
          for="contract-contact"
          :error="fieldErrors.contact"
          hint="Opcional. Nome, telefone ou e-mail."
          class="sm:col-span-2"
        >
          <input
            id="contract-contact"
            v-model="form.contact"
            type="text"
            class="input-base"
            maxlength="160"
            placeholder="Ex.: Ana · (45) 99999-0000"
          >
        </FormField>

        <FormField
          label="Objeto do contrato"
          for="contract-description"
          :error="fieldErrors.description"
          hint="O que está incluído, quantidade, prazo e condições principais."
          required
          class="sm:col-span-2"
        >
          <textarea
            id="contract-description"
            v-model="form.description"
            rows="4"
            maxlength="2000"
            class="input-base resize-y"
            placeholder="Ex.: Buffet completo para 80 pessoas, com salgados, doces, bebidas e equipe de apoio."
          />
        </FormField>

        <FormField
          label="Observações internas"
          for="contract-notes"
          :error="fieldErrors.notes"
          hint="Opcional. Visível apenas no painel administrativo."
          class="sm:col-span-2"
        >
          <textarea
            id="contract-notes"
            v-model="form.notes"
            rows="3"
            maxlength="2000"
            class="input-base resize-y"
            placeholder="Anotações sobre negociação, montagem, contatos…"
          />
        </FormField>
      </div>

      <p class="flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-xs font-semibold text-navy-500">
        <AppIcon
          name="info"
          :size="15"
          class="mt-0.5 shrink-0"
        />
        O valor contratado pode ser parcelado em quantas vezes precisar. O saldo sem parcela também aparece no painel financeiro.
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
          form="contract-form"
          size="sm"
          :loading="saving"
        >
          <template #icon>
            <AppIcon
              :name="isEdit ? 'check' : 'plus'"
              :size="16"
            />
          </template>
          {{ isEdit ? 'Salvar alterações' : 'Cadastrar fornecedor' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
