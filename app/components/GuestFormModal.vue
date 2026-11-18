<script setup lang="ts">
import type { GuestListItem } from '#shared/types'
import { guestInputSchema, zodFieldErrors } from '#shared/validation'

const props = defineProps<{
  modelValue: boolean
  guest?: GuestListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [guest: GuestListItem]
}>()

const toast = useToast()
const saving = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  groupName: '',
  notes: '',
  estimatedGuests: '' as string | number,
  maxGuests: '' as string | number,
})

const form = reactive(emptyForm())

const isEdit = computed(() => Boolean(props.guest))
const title = computed(() => isEdit.value ? 'Editar convidado' : 'Novo convidado')

watch(() => props.modelValue, (open) => {
  if (!open) return
  serverError.value = ''
  fieldErrors.value = {}
  Object.assign(form, emptyForm())
  if (props.guest) {
    Object.assign(form, {
      name: props.guest.name,
      phone: props.guest.phone,
      email: props.guest.email || '',
      groupName: props.guest.groupName || '',
      notes: props.guest.notes || '',
      estimatedGuests: props.guest.estimatedGuests ?? '',
      maxGuests: props.guest.maxGuests ?? '',
    })
  }
}, { immediate: true })

function payload() {
  return {
    name: form.name,
    phone: form.phone,
    email: form.email || null,
    groupName: form.groupName || null,
    notes: form.notes || null,
    estimatedGuests: form.estimatedGuests === '' ? null : Number(form.estimatedGuests),
    maxGuests: form.maxGuests === '' ? null : Number(form.maxGuests),
  }
}

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  const parsed = guestInputSchema.safeParse(payload())
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<GuestListItem>(
      isEdit.value ? `/api/admin/guests/${props.guest!.id}` : '/api/admin/guests',
      { method: isEdit.value ? 'PUT' : 'POST', body: payload() },
    )
    toast.success(isEdit.value ? 'Convidado atualizado.' : 'Convidado cadastrado com link exclusivo.')
    emit('saved', saved)
    emit('update:modelValue', false)
  } catch (error) {
    serverError.value = apiErrorMessage(error)
    Object.assign(fieldErrors.value, apiFieldErrors(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="title"
    description="Cada convidado recebe um link individual e exclusivo para confirmar presença."
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="guest-form" class="space-y-4" novalidate @submit.prevent="submit">
      <AppAlert v-if="serverError" type="error" title="Não foi possível salvar">
        {{ serverError }}
      </AppAlert>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome do convidado ou responsável"
          for="guest-name"
          :error="fieldErrors.name"
          required
          class="sm:col-span-2"
        >
          <input
            id="guest-name"
            v-model="form.name"
            type="text"
            class="input-base"
            autocomplete="name"
            maxlength="160"
            placeholder="Ex.: João Silva"
            data-autofocus
          >
        </FormField>

        <FormField label="Telefone / WhatsApp" for="guest-phone" :error="fieldErrors.phone" hint="Com DDD. Usaremos para o envio do convite." required>
          <input
            id="guest-phone"
            v-model="form.phone"
            type="tel"
            class="input-base"
            inputmode="tel"
            autocomplete="tel"
            placeholder="(45) 99999-9999"
          >
        </FormField>

        <FormField label="E-mail" for="guest-email" :error="fieldErrors.email" hint="Opcional">
          <input
            id="guest-email"
            v-model="form.email"
            type="email"
            class="input-base"
            autocomplete="email"
            maxlength="200"
            placeholder="convidado@email.com"
          >
        </FormField>

        <FormField
          label="Família ou grupo"
          for="guest-group"
          :error="fieldErrors.groupName"
          hint="Opcional. Ex.: Família Silva"
          class="sm:col-span-2"
        >
          <input
            id="guest-group"
            v-model="form.groupName"
            type="text"
            class="input-base"
            maxlength="160"
            placeholder="Ex.: Família Silva"
          >
        </FormField>

        <FormField
          label="Estimativa inicial de pessoas"
          for="guest-estimated"
          :error="fieldErrors.estimatedGuests"
          hint="Opcional. Ajuda no planejamento."
        >
          <input
            id="guest-estimated"
            v-model="form.estimatedGuests"
            type="number"
            min="0"
            max="100"
            step="1"
            class="input-base"
            placeholder="Ex.: 4"
          >
        </FormField>

        <FormField
          label="Limite de pessoas no convite"
          for="guest-limit"
          :error="fieldErrors.maxGuests"
          hint="Opcional. Deixe vazio para não limitar."
        >
          <input
            id="guest-limit"
            v-model="form.maxGuests"
            type="number"
            min="1"
            max="50"
            step="1"
            class="input-base"
            placeholder="Sem limite"
          >
        </FormField>

        <FormField label="Observações internas" for="guest-notes" :error="fieldErrors.notes" hint="Visível apenas no painel administrativo." class="sm:col-span-2">
          <textarea
            id="guest-notes"
            v-model="form.notes"
            rows="2"
            maxlength="2000"
            class="input-base resize-y"
            placeholder="Anotações sobre este convite…"
          />
        </FormField>
      </div>

      <p class="flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-xs font-semibold text-navy-500">
        <AppIcon name="info" :size="15" class="mt-0.5 shrink-0" />
        O link de confirmação é gerado automaticamente e não muda quando você edita os dados do convidado.
      </p>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AppButton variant="ghost" size="sm" @click="emit('update:modelValue', false)">
          Cancelar
        </AppButton>
        <AppButton type="submit" form="guest-form" size="sm" :loading="saving">
          <template #icon><AppIcon :name="isEdit ? 'check' : 'plus'" :size="16" /></template>
          {{ isEdit ? 'Salvar alterações' : 'Cadastrar convidado' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
