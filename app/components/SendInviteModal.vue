<script setup lang="ts">
import type { GuestListItem } from '#shared/types'
import { defaultPartySettings, type PartySettings } from '#shared/config/party'
import { buildInvitationLink, renderInviteMessage, inviteeFirstName } from '#shared/utils/format'
import { formatPhoneBR, whatsappUrl } from '#shared/utils/phone'

const props = defineProps<{
  modelValue: boolean
  guests: GuestListItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'sent': [guestId: number]
}>()

const toast = useToast()
const config = useRuntimeConfig()
const settings = ref<PartySettings | null>(null)
const queue = ref<GuestListItem[]>([])
const index = ref(0)
const message = ref('')
const openedWhatsApp = ref(false)
const confirmSent = ref(false)
const registering = ref(false)
const finished = ref(false)
const sentIds = ref<number[]>([])

const current = computed(() => queue.value[index.value] ?? null)
const isBulk = computed(() => queue.value.length > 1)
const baseUrl = computed(() => {
  if (import.meta.client) return window.location.origin
  return (config.public.appUrl as string) || ''
})
const inviteLink = computed(() => current.value
  ? buildInvitationLink(baseUrl.value, current.value.invitationUuid)
  : '')

const imageUrl = computed(() => settings.value?.inviteImageUrl || defaultPartySettings.inviteImageUrl)

watch(() => props.modelValue, async (open) => {
  if (!open) return
  queue.value = [...props.guests]
  index.value = 0
  finished.value = false
  sentIds.value = []
  openedWhatsApp.value = false
  confirmSent.value = false
  if (!settings.value) {
    try {
      settings.value = await $fetch<PartySettings>('/api/admin/settings')
    }
    catch {
      settings.value = { ...defaultPartySettings }
      toast.error('Não foi possível carregar as configurações. Usando o modelo padrão.')
    }
  }
  buildMessage()
}, { immediate: true })

watch(() => current.value?.id, () => {
  buildMessage()
  openedWhatsApp.value = false
  confirmSent.value = false
})

function buildMessage() {
  if (!current.value) return
  const activeSettings = settings.value ?? defaultPartySettings
  message.value = renderInviteMessage(activeSettings.whatsappTemplate, {
    name: inviteeFirstName(current.value.name),
    link: inviteLink.value,
    settings: activeSettings,
  })
}

function close() {
  emit('update:modelValue', false)
}

function openWhatsApp() {
  if (!current.value) return
  window.open(whatsappUrl(current.value.phone, message.value), '_blank', 'noopener,noreferrer')
  openedWhatsApp.value = true
  confirmSent.value = true
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    toast.success('Link copiado para a área de transferência.')
  }
  catch {
    toast.error('Não foi possível copiar automaticamente. Selecione o link no campo e copie.')
  }
}

async function registerSend(status: 'sent' | 'failed') {
  if (!current.value) return
  registering.value = true
  try {
    await $fetch(`/api/admin/guests/${current.value.id}/send`, {
      method: 'POST',
      body: {
        phone: current.value.phone,
        message: message.value,
        method: 'whatsapp_web',
        status,
      },
    })
    if (status === 'sent') {
      sentIds.value.push(current.value.id)
      emit('sent', current.value.id)
      toast.success(`Envio registrado para ${current.value.name}.`)
    }
    else {
      toast.info(`Falha de envio registrada para ${current.value.name}.`)
    }
    advance()
  }
  catch (error) {
    toast.error(apiErrorMessage(error, 'Não foi possível registrar o envio.'))
  }
  finally {
    registering.value = false
  }
}

function advance() {
  if (index.value < queue.value.length - 1) {
    index.value += 1
  }
  else {
    finished.value = true
  }
}

function skip() {
  if (index.value < queue.value.length - 1) {
    index.value += 1
  }
  else {
    finished.value = true
  }
}

async function fail() {
  if (!import.meta.client) return
  if (!window.confirm('Registrar que este envio falhou? Você poderá tentar novamente depois.')) return
  await registerSend('failed')
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="finished ? 'Envios registrados' : (isBulk ? 'Enviar convites em massa' : 'Enviar convite')"
    :description="finished ? undefined : 'O WhatsApp abre com a mensagem pronta. A imagem precisa ser anexada manualmente.'"
    size="xl"
    :closeable="!registering"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      v-if="finished"
      class="flex flex-col items-center py-6 text-center"
    >
      <span class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
        <AppIcon
          name="check-circle"
          :size="32"
        />
      </span>
      <h3 class="mt-4 font-display text-3xl text-navy-950">
        Tudo registrado!
      </h3>
      <p class="mt-2 max-w-md text-sm font-semibold text-navy-500">
        {{ sentIds.length }} {{ sentIds.length === 1 ? 'envio confirmado' : 'envios confirmados' }}.
        O histórico já está atualizado no painel.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <AppButton
          variant="outline"
          size="sm"
          @click="close"
        >
          Fechar
        </AppButton>
        <AppButton
          to="/admin/envios"
          size="sm"
          @click="close"
        >
          Ver histórico de envios
        </AppButton>
      </div>
    </div>

    <div
      v-else-if="current"
      class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <div class="space-y-5">
        <div
          v-if="isBulk"
          class="flex items-center justify-between gap-3 rounded-xl bg-navy-50 px-3.5 py-2.5"
        >
          <p class="text-xs font-extrabold text-navy-700">
            Convidado {{ index + 1 }} de {{ queue.length }}
          </p>
          <div
            class="flex items-center gap-1"
            aria-hidden="true"
          >
            <span
              v-for="(guest, i) in queue"
              :key="guest.id"
              :class="[
                'h-1.5 w-5 rounded-full',
                sentIds.includes(guest.id) ? 'bg-emerald-500' : i === index ? 'bg-spider-500' : 'bg-navy-200',
              ]"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Destinatário
              </p>
              <p class="mt-0.5 text-base font-extrabold text-navy-950">
                {{ current.name }}
              </p>
              <p class="text-xs font-semibold text-navy-500">
                {{ formatPhoneBR(current.phone) }}
                <span v-if="current.groupName"> · {{ current.groupName }}</span>
              </p>
            </div>
            <StatusBadge
              kind="send"
              :status="current.sendStatus"
              size="sm"
            />
          </div>
        </div>

        <div
          class="grid grid-cols-3 gap-2"
          aria-label="Passos do envio"
        >
          <div :class="['rounded-xl border p-2.5 text-center', openedWhatsApp ? 'border-emerald-200 bg-emerald-50' : 'border-navy-100 bg-white']">
            <span :class="['mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold', openedWhatsApp ? 'bg-emerald-500 text-white' : 'bg-navy-100 text-navy-500']">1</span>
            <p class="mt-1.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-500">
              Abrir WhatsApp
            </p>
          </div>
          <div :class="['rounded-xl border p-2.5 text-center', openedWhatsApp ? 'border-navy-100 bg-white' : 'border-dashed border-navy-200 bg-navy-50/50']">
            <span class="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-navy-100 text-xs font-extrabold text-navy-500">2</span>
            <p class="mt-1.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-500">
              Anexar imagem
            </p>
          </div>
          <div :class="['rounded-xl border p-2.5 text-center', confirmSent ? 'border-spider-200 bg-spider-50' : 'border-dashed border-navy-200 bg-navy-50/50']">
            <span :class="['mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold', confirmSent ? 'bg-spider-500 text-white' : 'bg-navy-100 text-navy-500']">3</span>
            <p class="mt-1.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-500">
              Confirmar envio
            </p>
          </div>
        </div>

        <FormField
          label="Mensagem do convite"
          for="invite-message"
          hint="Personalize antes de enviar. O link individual já está incluído."
        >
          <textarea
            id="invite-message"
            v-model="message"
            rows="10"
            maxlength="4000"
            class="input-base resize-y font-medium leading-relaxed"
          />
        </FormField>

        <div>
          <p class="mb-1.5 text-sm font-bold text-navy-800">
            Link individual de confirmação
          </p>
          <div class="flex gap-2">
            <input
              :value="inviteLink"
              type="text"
              readonly
              class="input-base font-mono text-[11px] text-navy-600"
              aria-label="Link individual de confirmação"
              @focus="($event.target as HTMLInputElement).select()"
            >
            <AppButton
              variant="outline"
              size="sm"
              class="shrink-0"
              @click="copyLink"
            >
              <template #icon>
                <AppIcon
                  name="copy"
                  :size="15"
                />
              </template>
              Copiar
            </AppButton>
          </div>
        </div>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-100 bg-white p-3">
          <input
            v-model="confirmSent"
            type="checkbox"
            class="mt-0.5 h-4 w-4 accent-spider-600"
          >
          <span class="text-xs font-semibold leading-relaxed text-navy-600">
            Confirmo que enviei esta mensagem pelo WhatsApp (ou entreguei o link) com a imagem do convite.
            O registro só será feito após esta confirmação.
          </span>
        </label>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
          <AppButton
            variant="whatsapp"
            size="md"
            class="flex-1"
            @click="openWhatsApp"
          >
            <template #icon>
              <AppIcon
                name="whatsapp"
                :size="18"
              />
            </template>
            Abrir WhatsApp de {{ current.name.split(' ')[0] }}
          </AppButton>
          <AppButton
            size="md"
            :disabled="!confirmSent"
            :loading="registering"
            @click="registerSend('sent')"
          >
            <template #icon>
              <AppIcon
                name="check"
                :size="17"
              />
            </template>
            Confirmar envio
          </AppButton>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 pt-3">
          <button
            type="button"
            class="text-xs font-bold text-navy-400 underline underline-offset-2 hover:text-navy-700"
            @click="skip"
          >
            Pular este convidado
          </button>
          <button
            type="button"
            class="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
            @click="fail"
          >
            Registrar falha no envio
          </button>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
          <img
            :src="imageUrl"
            alt="Arte do convite da festa"
            class="max-h-[320px] w-full bg-white object-contain"
          >
          <div class="grid grid-cols-2 gap-2 border-t border-navy-100 bg-white p-3">
            <a
              :href="imageUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-2.5 py-2 text-xs font-bold text-navy-700 transition hover:bg-navy-50"
            >
              <AppIcon
                name="external"
                :size="14"
              /> Abrir imagem
            </a>
            <a
              :href="imageUrl"
              download="convite-luigi-marco"
              class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-2.5 py-2 text-xs font-bold text-navy-700 transition hover:bg-navy-50"
            >
              <AppIcon
                name="download"
                :size="14"
              /> Baixar
            </a>
          </div>
        </div>

        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <p class="flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
            <AppIcon
              name="info"
              :size="14"
            /> Atenção
          </p>
          <p class="mt-1 text-[11px] font-semibold leading-relaxed text-amber-800/90">
            Links de clique para conversar não anexam imagens automaticamente. Abra o WhatsApp, anexe a imagem
            baixada e cole a mensagem se necessário. Depois, volte aqui e confirme o envio.
          </p>
        </div>

        <div
          v-if="isBulk"
          class="rounded-2xl border border-navy-100 p-3"
        >
          <p class="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
            Fila de envio
          </p>
          <ul class="max-h-56 space-y-1 overflow-y-auto scrollbar-thin">
            <li
              v-for="(guest, i) in queue"
              :key="guest.id"
              :class="[
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold',
                i === index ? 'bg-spider-50 text-spider-800' : sentIds.includes(guest.id) ? 'text-emerald-700' : 'text-navy-400',
              ]"
            >
              <AppIcon
                :name="sentIds.includes(guest.id) ? 'check-circle' : i === index ? 'arrow-right' : 'clock'"
                :size="12"
              />
              <span class="flex-1 truncate">{{ guest.name }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <p class="text-[11px] font-semibold text-navy-400">
          O histórico registra telefone, mensagem, método, status e tentativa.
        </p>
        <AppButton
          variant="ghost"
          size="sm"
          :disabled="registering"
          @click="close"
        >
          Fechar
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
