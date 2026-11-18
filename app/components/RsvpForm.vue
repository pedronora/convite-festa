<script setup lang="ts">
import type { PublicInvitation, RsvpSummary } from '#shared/types'
import { rsvpInputSchema, zodFieldErrors } from '#shared/validation'
import { totalGuests } from '#shared/utils/format'

const props = defineProps<{ invitation: PublicInvitation }>()
const emit = defineEmits<{ saved: [rsvp: RsvpSummary] }>()

const toast = useToast()
const saving = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const existing = props.invitation.existingRsvp
const form = reactive({
  attendanceStatus: existing?.attendanceStatus ?? 'yes' as 'yes' | 'no',
  responsibleName: existing?.responsibleName || props.invitation.guest.name,
  phone: existing?.phone || props.invitation.guest.phone,
  email: existing?.email || props.invitation.guest.email || '',
  adults: existing?.adults ?? 1,
  children8to11: existing?.children8to11 ?? 0,
  children0to7: existing?.children0to7 ?? 0,
  notes: existing?.notes ?? '',
})

const isAttending = computed(() => form.attendanceStatus === 'yes')
const total = computed(() => totalGuests(form.adults, form.children8to11, form.children0to7))
const guestLimit = computed(() => props.invitation.guest.maxGuests ?? props.invitation.settings.maxGuestsDefault ?? null)
const limitExceeded = computed(() => Boolean(guestLimit.value && total.value > guestLimit.value))

function selectAttendance(value: 'yes' | 'no') {
  form.attendanceStatus = value
  if (value === 'no') {
    form.adults = 0
    form.children8to11 = 0
    form.children0to7 = 0
  } else if (total.value === 0) {
    form.adults = 1
  }
  fieldErrors.value = {}
}

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  const parsed = rsvpInputSchema.safeParse({
    ...form,
    email: form.email || null,
    notes: form.notes || null,
  })
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    serverError.value = parsed.error.issues[0]?.message || 'Revise os dados informados.'
    return
  }
  if (parsed.data.attendanceStatus === 'yes' && parsed.data.adults + parsed.data.children8to11 + parsed.data.children0to7 < 1) {
    fieldErrors.value = { adults: 'Confirme ao menos uma pessoa.' }
    return
  }
  if (limitExceeded.value) {
    fieldErrors.value = { adults: `Este convite permite até ${guestLimit.value} pessoas.` }
    return
  }

  saving.value = true
  try {
    const response = await $fetch<{ ok: boolean, rsvp: RsvpSummary }>(
      `/api/public/invitations/${props.invitation.uuid}`,
      {
        method: 'PUT',
        body: {
          attendanceStatus: form.attendanceStatus,
          responsibleName: form.responsibleName,
          phone: form.phone,
          email: form.email || null,
          adults: form.attendanceStatus === 'yes' ? form.adults : 0,
          children8to11: form.attendanceStatus === 'yes' ? form.children8to11 : 0,
          children0to7: form.attendanceStatus === 'yes' ? form.children0to7 : 0,
          notes: form.notes || null,
        },
      },
    )
    toast.success(response.rsvp.wasUpdate ? 'Sua resposta foi atualizada!' : 'Resposta registrada com sucesso!')
    emit('saved', response.rsvp)
  } catch (error) {
    serverError.value = apiErrorMessage(error, 'Não foi possível salvar sua resposta. Tente novamente.')
    fieldErrors.value = apiFieldErrors(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <AppAlert v-if="serverError" type="error" title="Revise sua resposta">
      {{ serverError }}
    </AppAlert>

    <fieldset>
      <legend class="mb-2 block text-sm font-extrabold text-navy-800">
        Você poderá comparecer? <span class="text-spider-600" aria-hidden="true">*</span>
      </legend>
      <div class="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          :aria-pressed="form.attendanceStatus === 'yes'"
          :class="[
            'flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 transition',
            form.attendanceStatus === 'yes'
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
              : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300',
          ]"
          @click="selectAttendance('yes')"
        >
          <AppIcon name="check-circle" :size="24" />
          <span class="text-sm font-extrabold">Sim, estaremos lá!</span>
        </button>
        <button
          type="button"
          :aria-pressed="form.attendanceStatus === 'no'"
          :class="[
            'flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 transition',
            form.attendanceStatus === 'no'
              ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm'
              : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300',
          ]"
          @click="selectAttendance('no')"
        >
          <AppIcon name="x-circle" :size="24" />
          <span class="text-sm font-extrabold">Não poderei ir</span>
        </button>
      </div>
      <p v-if="fieldErrors.attendanceStatus" class="mt-1.5 text-xs font-semibold text-spider-700" role="alert">
        {{ fieldErrors.attendanceStatus }}
      </p>
    </fieldset>

    <div class="grid gap-4 sm:grid-cols-2">
      <FormField label="Nome do responsável" for="rsvp-name" :error="fieldErrors.responsibleName" required class="sm:col-span-2">
        <input
          id="rsvp-name"
          v-model="form.responsibleName"
          type="text"
          class="input-base"
          autocomplete="name"
          maxlength="160"
          placeholder="Quem está confirmando?"
        >
      </FormField>
      <FormField label="WhatsApp / telefone" for="rsvp-phone" :error="fieldErrors.phone" hint="Para contato em caso de imprevisto." required>
        <input
          id="rsvp-phone"
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          class="input-base"
          autocomplete="tel"
          placeholder="(45) 99999-9999"
        >
      </FormField>
      <FormField label="E-mail" for="rsvp-email" :error="fieldErrors.email" hint="Opcional">
        <input
          id="rsvp-email"
          v-model="form.email"
          type="email"
          class="input-base"
          autocomplete="email"
          maxlength="200"
          placeholder="voce@email.com"
        >
      </FormField>
    </div>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="isAttending" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-extrabold text-navy-800">Quantas pessoas virão?</p>
            <p class="text-[11px] font-semibold text-navy-400">Conte adultos e crianças em faixas exclusivas.</p>
          </div>
          <span class="rounded-full bg-navy-950 px-3 py-1 text-xs font-extrabold text-white">
            {{ total }} {{ total === 1 ? 'pessoa' : 'pessoas' }}
          </span>
        </div>

        <CountStepper
          v-model="form.adults"
          label="Adultos"
          description="18 anos ou mais"
          icon="user"
          tone="red"
          :max="50"
        />
        <CountStepper
          v-model="form.children8to11"
          label="Crianças de 8 a 11 anos"
          description="Faixa escolar"
          icon="smile"
          tone="sky"
          :max="50"
        />
        <CountStepper
          v-model="form.children0to7"
          label="Crianças de 0 a 7 anos"
          description="Bebês e crianças pequenas"
          icon="baby"
          tone="amber"
          :max="50"
        />

        <AppAlert v-if="limitExceeded" type="warning">
          Este convite permite até {{ guestLimit }} pessoas. Ajuste as quantidades para continuar.
        </AppAlert>
        <p v-if="fieldErrors.adults" class="text-xs font-semibold text-spider-700" role="alert">{{ fieldErrors.adults }}</p>
        <p v-if="guestLimit" class="text-[11px] font-semibold text-navy-400">
          Limite deste convite: {{ guestLimit }} {{ guestLimit === 1 ? 'pessoa' : 'pessoas' }}.
        </p>
      </div>
    </Transition>

    <FormField label="Observações" for="rsvp-notes" :error="fieldErrors.notes" hint="Opcional. Restrições alimentares, recados, etc.">
      <textarea
        id="rsvp-notes"
        v-model="form.notes"
        rows="3"
        maxlength="1000"
        class="input-base resize-y"
        placeholder="Alguma observação para os anfitriões?"
      />
    </FormField>

    <div class="rounded-2xl bg-navy-50 p-3 text-[11px] font-semibold leading-relaxed text-navy-500">
      Ao enviar, você concorda que usemos os dados informados apenas para organizar a festa.
      Você poderá atualizar sua resposta acessando este mesmo link novamente.
    </div>

    <AppButton type="submit" size="lg" block :loading="saving" :disabled="limitExceeded">
      <template #icon><AppIcon name="send" :size="18" /></template>
      {{ existing ? 'Atualizar minha resposta' : 'Enviar confirmação' }}
    </AppButton>
  </form>
</template>
