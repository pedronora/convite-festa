<script setup lang="ts">
import { defaultPartySettings, partySettingsSchema, type PartySettings } from '#shared/config/party'
import { passwordChangeSchema, zodFieldErrors } from '#shared/validation'
import { buildInvitationLink, fromDateTimeLocalValue, renderInviteMessage, toDateTimeLocalValue } from '#shared/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Configurações' })

const toast = useToast()
const { data, pending, error, refresh } = await useFetch<PartySettings>('/api/admin/settings', {
  key: 'admin-settings',
})

const form = reactive<PartySettings>(JSON.parse(JSON.stringify(defaultPartySettings)) as PartySettings)
const partyDateLocal = ref(toDateTimeLocalValue(defaultPartySettings.partyDate))
const maxGuestsInput = ref('')
const saving = ref(false)
const uploading = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const saveError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(data, (value) => {
  if (!value) return
  Object.assign(form, JSON.parse(JSON.stringify(value)) as PartySettings)
  partyDateLocal.value = toDateTimeLocalValue(value.partyDate)
  maxGuestsInput.value = value.maxGuestsDefault ? String(value.maxGuestsDefault) : ''
}, { immediate: true })

const previewLink = computed(() => {
  const base = import.meta.client ? window.location.origin : 'https://seu-dominio.com'
  return buildInvitationLink(base, '00000000-0000-4000-8000-000000000000')
})

const previewMessage = computed(() => renderInviteMessage(form.whatsappTemplate || '', {
  name: 'Maria',
  groupName: 'Família Silva',
  link: previewLink.value,
  settings: form,
}))

const templateHasLink = computed(() => form.whatsappTemplate.includes('[LINK]'))
const customImage = computed(() => form.inviteImageUrl.startsWith('/api/invite-image/'))

function addCelebrant() {
  if (form.celebrants.length >= 4) return
  form.celebrants.push({ name: '', age: 1 })
}

function removeCelebrant(index: number) {
  if (form.celebrants.length <= 1) return
  form.celebrants.splice(index, 1)
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    toast.error('Envie uma imagem PNG, JPG ou WebP.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('A imagem deve ter no máximo 5 MB.')
    return
  }
  uploading.value = true
  try {
    const body = new FormData()
    body.append('image', file)
    const result = await $fetch<{ url: string }>('/api/admin/settings/image', { method: 'POST', body })
    form.inviteImageUrl = result.url
    toast.success('Imagem enviada. Salve as configurações para publicar.')
  }
  catch (err) {
    toast.error(apiErrorMessage(err, 'Não foi possível enviar a imagem.'))
  }
  finally {
    uploading.value = false
  }
}

async function saveSettings() {
  saveError.value = ''
  fieldErrors.value = {}
  const payload = {
    ...JSON.parse(JSON.stringify(form)) as PartySettings,
    partyDate: fromDateTimeLocalValue(partyDateLocal.value),
    maxGuestsDefault: maxGuestsInput.value === '' ? null : Number(maxGuestsInput.value),
  }
  const parsed = partySettingsSchema.safeParse(payload)
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    saveError.value = parsed.error.issues[0]?.message || 'Revise as configurações.'
    toast.error('Revise os campos destacados.')
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<PartySettings>('/api/admin/settings', { method: 'PUT', body: parsed.data })
    Object.assign(form, saved)
    partyDateLocal.value = toDateTimeLocalValue(saved.partyDate)
    toast.success('Configurações salvas e publicadas.')
    await refresh()
  }
  catch (err) {
    saveError.value = apiErrorMessage(err, 'Não foi possível salvar as configurações.')
    fieldErrors.value = apiFieldErrors(err)
  }
  finally {
    saving.value = false
  }
}

// Alteração de senha
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordErrors = ref<Record<string, string>>({})
const passwordError = ref('')
const savingPassword = ref(false)

async function changePassword() {
  passwordError.value = ''
  passwordErrors.value = {}
  const parsed = passwordChangeSchema.safeParse(passwordForm)
  if (!parsed.success) {
    passwordErrors.value = zodFieldErrors(parsed.error)
    return
  }
  savingPassword.value = true
  try {
    await $fetch('/api/admin/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      },
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    toast.success('Senha atualizada. As outras sessões foram encerradas.')
  }
  catch (err) {
    passwordError.value = apiErrorMessage(err, 'Não foi possível alterar a senha.')
    passwordErrors.value = apiFieldErrors(err)
  }
  finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Personalização"
      title="Configurações"
      subtitle="Estes dados alimentam a página pública, os convites e o dashboard. Salve para publicar as alterações."
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          to="/"
          target="_blank"
        >
          <template #icon>
            <AppIcon
              name="external"
              :size="15"
            />
          </template>
          Ver página pública
        </AppButton>
        <AppButton
          size="sm"
          :loading="saving"
          @click="saveSettings"
        >
          <template #icon>
            <AppIcon
              name="check"
              :size="16"
            />
          </template>
          Salvar configurações
        </AppButton>
      </template>
    </PageHeader>

    <AppAlert
      v-if="error"
      type="error"
      class="mb-4"
      title="Erro ao carregar configurações"
    >
      {{ apiErrorMessage(error) }}
      <button
        class="underline"
        type="button"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </AppAlert>
    <AppAlert
      v-if="saveError"
      type="error"
      class="mb-4"
      title="Não foi possível salvar"
    >
      {{ saveError }}
    </AppAlert>

    <div
      v-if="pending && !data"
      class="grid gap-4 xl:grid-cols-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="card-surface h-64 p-6"
      >
        <div class="skeleton h-full w-full rounded-xl" />
      </div>
    </div>

    <div
      v-else
      class="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"
    >
      <div class="space-y-4">
        <!-- Aniversariantes e festa -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="party"
              :size="17"
              class="text-spider-600"
            /> Aniversariantes e festa
          </h2>

          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-extrabold uppercase tracking-wide text-navy-400">
                Aniversariantes
              </p>
              <button
                type="button"
                class="text-xs font-extrabold text-spider-600 hover:text-spider-800"
                :disabled="form.celebrants.length >= 4"
                @click="addCelebrant"
              >
                + Adicionar
              </button>
            </div>
            <div
              v-for="(celebrant, index) in form.celebrants"
              :key="index"
              class="grid gap-2 sm:grid-cols-[1fr_110px_auto]"
            >
              <div>
                <label
                  :for="`celebrant-name-${index}`"
                  class="sr-only"
                >Nome do aniversariante</label>
                <input
                  :id="`celebrant-name-${index}`"
                  v-model="celebrant.name"
                  type="text"
                  class="input-base"
                  maxlength="60"
                  placeholder="Nome"
                >
              </div>
              <div>
                <label
                  :for="`celebrant-age-${index}`"
                  class="sr-only"
                >Idade</label>
                <input
                  :id="`celebrant-age-${index}`"
                  v-model.number="celebrant.age"
                  type="number"
                  min="0"
                  max="120"
                  class="input-base"
                  placeholder="Idade"
                >
              </div>
              <button
                type="button"
                class="rounded-xl border border-navy-200 px-3 text-navy-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                :disabled="form.celebrants.length <= 1"
                aria-label="Remover aniversariante"
                @click="removeCelebrant(index)"
              >
                <AppIcon
                  name="trash"
                  :size="16"
                />
              </button>
            </div>
            <p
              v-if="fieldErrors.celebrants"
              class="text-xs font-semibold text-spider-700"
              role="alert"
            >
              {{ fieldErrors.celebrants }}
            </p>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Data e hora do evento"
              for="party-date"
              :error="fieldErrors.partyDate"
              hint="Usada na contagem regressiva e no calendário."
              required
            >
              <input
                id="party-date"
                v-model="partyDateLocal"
                type="datetime-local"
                class="input-base"
              >
            </FormField>
            <FormField
              label="Data por extenso"
              for="date-label"
              :error="fieldErrors.dateLabel"
              hint="Ex.: 23 de janeiro"
              required
            >
              <input
                id="date-label"
                v-model="form.dateLabel"
                type="text"
                class="input-base"
                maxlength="80"
              >
            </FormField>
            <FormField
              label="Horário exibido"
              for="time-label"
              :error="fieldErrors.timeLabel"
              hint="Ex.: 15h"
              required
            >
              <input
                id="time-label"
                v-model="form.timeLabel"
                type="text"
                class="input-base"
                maxlength="40"
              >
            </FormField>
            <FormField
              label="Nome do local"
              for="venue"
              :error="fieldErrors.venue"
              required
            >
              <input
                id="venue"
                v-model="form.venue"
                type="text"
                class="input-base"
                maxlength="160"
              >
            </FormField>
            <FormField
              label="Endereço"
              for="address"
              :error="fieldErrors.address"
              required
            >
              <input
                id="address"
                v-model="form.address"
                type="text"
                class="input-base"
                maxlength="200"
              >
            </FormField>
            <FormField
              label="Bairro"
              for="neighborhood"
              :error="fieldErrors.neighborhood"
              required
            >
              <input
                id="neighborhood"
                v-model="form.neighborhood"
                type="text"
                class="input-base"
                maxlength="100"
              >
            </FormField>
            <FormField
              label="Cidade"
              for="city"
              :error="fieldErrors.city"
              required
            >
              <input
                id="city"
                v-model="form.city"
                type="text"
                class="input-base"
                maxlength="100"
              >
            </FormField>
            <FormField
              label="UF"
              for="state"
              :error="fieldErrors.state"
              required
            >
              <input
                id="state"
                v-model="form.state"
                type="text"
                class="input-base uppercase"
                maxlength="2"
                placeholder="PR"
              >
            </FormField>
            <FormField
              label="Busca do Google Maps"
              for="maps-query"
              :error="fieldErrors.mapsQuery"
              hint="Endereço usado no botão “Como chegar”."
              required
              class="sm:col-span-2"
            >
              <input
                id="maps-query"
                v-model="form.mapsQuery"
                type="text"
                class="input-base"
                maxlength="400"
              >
            </FormField>
          </div>
        </section>

        <!-- Arte do convite -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="image"
              :size="17"
              class="text-sky-600"
            /> Arte do convite
          </h2>
          <p class="mt-1 text-xs font-semibold text-navy-400">
            Esta imagem aparece na página pública e deve ser anexada manualmente no WhatsApp.
          </p>
          <div class="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
            <div class="overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
              <img
                :src="form.inviteImageUrl"
                alt="Prévia da arte do convite"
                class="h-52 w-full object-contain"
              >
            </div>
            <div class="space-y-3">
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                @change="onFileChange"
              >
              <div class="flex flex-wrap gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  :loading="uploading"
                  @click="fileInput?.click()"
                >
                  <template #icon>
                    <AppIcon
                      name="upload"
                      :size="15"
                    />
                  </template>
                  Enviar nova arte
                </AppButton>
                <AppButton
                  v-if="customImage"
                  variant="ghost"
                  size="sm"
                  @click="form.inviteImageUrl = defaultPartySettings.inviteImageUrl"
                >
                  Restaurar padrão
                </AppButton>
              </div>
              <p class="text-[11px] font-semibold text-navy-400">
                PNG, JPG ou WebP · até 5 MB. A arte atual está em
                <strong class="text-navy-600">{{ customImage ? 'arquivo enviado' : 'imagem padrão do sistema' }}</strong>.
              </p>
              <p class="text-[11px] font-semibold text-navy-400">
                Dica: formato vertical (proporção 4:5) funciona melhor no celular e no WhatsApp.
              </p>
              <p
                v-if="fieldErrors.inviteImageUrl"
                class="text-xs font-semibold text-spider-700"
                role="alert"
              >
                {{ fieldErrors.inviteImageUrl }}
              </p>
            </div>
          </div>
        </section>

        <!-- Mensagem -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="whatsapp"
              :size="17"
              class="text-emerald-600"
            /> Mensagem de WhatsApp
          </h2>
          <p class="mt-1 text-xs font-semibold text-navy-400">
            Use os marcadores abaixo. O <strong>[LINK]</strong> é obrigatório e vira o link individual do convidado.
            O <strong>[GRUPO]</strong> usa a família/grupo do convidado e, quando não houver, o nome dele.
          </p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="token in ['[Nome]', '[GRUPO]', '[DATA]', '[HORARIO]', '[LOCAL]', '[ENDERECO]', '[CIDADE]', '[LINK]']"
              :key="token"
              class="rounded-md bg-navy-100 px-2 py-1 font-mono text-[10px] font-bold text-navy-600"
            >{{ token }}</span>
          </div>
          <FormField
            label="Modelo da mensagem"
            for="whatsapp-template"
            :error="fieldErrors.whatsappTemplate"
            class="mt-3"
          >
            <textarea
              id="whatsapp-template"
              v-model="form.whatsappTemplate"
              rows="11"
              maxlength="4000"
              class="input-base resize-y font-medium leading-relaxed"
            />
          </FormField>
          <p
            v-if="!templateHasLink"
            class="mt-1 flex items-center gap-1 text-xs font-bold text-spider-700"
          >
            <AppIcon
              name="alert"
              :size="14"
            /> A mensagem precisa conter [LINK].
          </p>
        </section>

        <!-- Textos da página -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="clipboard"
              :size="17"
              class="text-amber-600"
            /> Textos da confirmação
          </h2>
          <div class="mt-4 space-y-4">
            <FormField
              label="Introdução na página do convite"
              for="rsvp-intro"
              :error="fieldErrors.rsvpIntro"
            >
              <textarea
                id="rsvp-intro"
                v-model="form.rsvpIntro"
                rows="3"
                maxlength="600"
                class="input-base resize-y"
              />
            </FormField>
            <FormField
              label="Mensagem de sucesso (presença confirmada)"
              for="success-message"
              :error="fieldErrors.successMessage"
            >
              <textarea
                id="success-message"
                v-model="form.successMessage"
                rows="3"
                maxlength="600"
                class="input-base resize-y"
              />
            </FormField>
            <FormField
              label="Mensagem para quem não comparecerá"
              for="decline-message"
              :error="fieldErrors.declineMessage"
            >
              <textarea
                id="decline-message"
                v-model="form.declineMessage"
                rows="3"
                maxlength="600"
                class="input-base resize-y"
              />
            </FormField>
            <FormField
              label="Limite padrão de pessoas por convite"
              for="max-guests"
              :error="fieldErrors.maxGuestsDefault"
              hint="Opcional. Pode ser sobrescrito no cadastro de cada convidado."
            >
              <input
                id="max-guests"
                v-model="maxGuestsInput"
                type="number"
                min="1"
                max="50"
                step="1"
                class="input-base"
                placeholder="Sem limite"
              >
            </FormField>
          </div>
        </section>
      </div>

      <!-- Coluna lateral -->
      <aside class="space-y-4">
        <section class="card-surface p-5">
          <h2 class="text-sm font-extrabold text-navy-900">
            Prévia da mensagem
          </h2>
          <p class="mt-0.5 text-[11px] font-semibold text-navy-400">
            Como o convidado verá no WhatsApp.
          </p>
          <div class="mt-3 rounded-2xl bg-[#e5ddd5] p-3">
            <div class="relative rounded-xl rounded-tl-sm bg-[#dcf8c6] p-3 text-[11px] font-medium leading-relaxed text-navy-900 shadow-sm">
              <p class="whitespace-pre-line">
                {{ previewMessage }}
              </p>
              <p class="mt-1 text-right text-[9px] text-navy-500">
                15:00 ✓✓
              </p>
            </div>
          </div>
          <div class="mt-3 rounded-xl border border-navy-100 p-2">
            <img
              :src="form.inviteImageUrl"
              alt="Arte do convite"
              class="max-h-56 w-full object-contain"
            >
            <p class="mt-1 text-center text-[10px] font-semibold text-navy-400">
              Imagem a ser anexada manualmente
            </p>
          </div>
        </section>

        <section class="card-surface p-5">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="shield"
              :size="17"
              class="text-spider-600"
            /> Segurança da conta
          </h2>
          <p class="mt-1 text-[11px] font-semibold text-navy-400">
            Ao alterar a senha, as demais sessões são encerradas.
          </p>
          <AppAlert
            v-if="passwordError"
            type="error"
            class="mt-3"
          >
            {{ passwordError }}
          </AppAlert>
          <form
            class="mt-3 space-y-3"
            novalidate
            @submit.prevent="changePassword"
          >
            <FormField
              label="Senha atual"
              for="current-password"
              :error="passwordErrors.currentPassword"
            >
              <input
                id="current-password"
                v-model="passwordForm.currentPassword"
                type="password"
                class="input-base"
                autocomplete="current-password"
              >
            </FormField>
            <FormField
              label="Nova senha"
              for="new-password"
              :error="passwordErrors.newPassword"
              hint="Mínimo de 10 caracteres."
            >
              <input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                class="input-base"
                autocomplete="new-password"
              >
            </FormField>
            <FormField
              label="Confirmar nova senha"
              for="confirm-password"
              :error="passwordErrors.confirmPassword"
            >
              <input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input-base"
                autocomplete="new-password"
              >
            </FormField>
            <AppButton
              type="submit"
              variant="secondary"
              size="sm"
              block
              :loading="savingPassword"
            >
              Alterar senha
            </AppButton>
          </form>
        </section>

        <div class="sticky bottom-4 rounded-2xl border border-navy-200 bg-white/95 p-3 shadow-soft backdrop-blur">
          <AppButton
            size="sm"
            block
            :loading="saving"
            @click="saveSettings"
          >
            <template #icon>
              <AppIcon
                name="check"
                :size="16"
              />
            </template>
            Salvar configurações
          </AppButton>
          <p class="mt-1.5 text-center text-[10px] font-semibold text-navy-400">
            As mudanças valem imediatamente para todos os links.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>
