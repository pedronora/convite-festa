<script setup lang="ts">
import type { GuestDetail, SendHistoryItem } from '#shared/types'
import { buildInvitationLink, formatDateTime } from '#shared/utils/format'
import { formatPhone } from '#shared/utils/phone'
import { whatsappChatUrl } from '#shared/utils/whatsapp'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = Number(route.params.id)
if (!Number.isInteger(id) || id < 1) {
  throw createError({ statusCode: 404, statusMessage: 'Convidado não encontrado' })
}

const toast = useToast()
const { data: guest, pending, error, refresh } = await useFetch<GuestDetail>(`/api/admin/guests/${id}`, {
  key: `admin-guest-${id}`,
})

useHead({ title: computed(() => guest.value ? `${guest.value.name} · Convidado` : 'Convidado') })

const editOpen = ref(false)
const sendOpen = ref(false)
const deleteOpen = ref(false)
const regenOpen = ref(false)
const deleting = ref(false)
const regenerating = ref(false)
const selectedSend = ref<SendHistoryItem | null>(null)

const inviteUrl = computed(() => {
  if (!guest.value) return ''
  const base = import.meta.client ? window.location.origin : (useRuntimeConfig().public.appUrl as string)
  return buildInvitationLink(base, guest.value.invitationUuid)
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    toast.success('Link copiado.')
  }
  catch {
    toast.error('Não foi possível copiar o link.')
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/admin/guests/${id}`, { method: 'DELETE' })
    toast.success('Convidado excluído.')
    await navigateTo('/admin/convidados')
  }
  catch (err) {
    toast.error(apiErrorMessage(err, 'Não foi possível excluir.'))
  }
  finally {
    deleting.value = false
  }
}

async function regenerateLink() {
  regenerating.value = true
  try {
    await $fetch(`/api/admin/guests/${id}/link`, { method: 'POST' })
    toast.success('Novo link gerado. O link anterior não funciona mais.')
    regenOpen.value = false
    await refresh()
  }
  catch (err) {
    toast.error(apiErrorMessage(err, 'Não foi possível gerar um novo link.'))
  }
  finally {
    regenerating.value = false
  }
}

async function onSaved() {
  await refresh()
}
</script>

<template>
  <div>
    <div class="mb-4">
      <NuxtLink
        to="/admin/convidados"
        class="inline-flex items-center gap-1.5 text-xs font-extrabold text-navy-400 transition hover:text-navy-700"
      >
        <AppIcon
          name="chevron-left"
          :size="14"
        /> Voltar para convidados
      </NuxtLink>
    </div>

    <div
      v-if="pending && !guest"
      class="space-y-4"
    >
      <div class="card-surface p-6">
        <div class="skeleton h-6 w-52 rounded" />
        <div class="skeleton mt-3 h-4 w-72 rounded" />
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <div
          v-for="n in 2"
          :key="n"
          class="card-surface h-64 p-6"
        >
          <div class="skeleton h-full w-full rounded-xl" />
        </div>
      </div>
    </div>

    <AppAlert
      v-else-if="error || !guest"
      type="error"
      title="Convidado não encontrado"
    >
      Este convidado pode ter sido excluído.
      <NuxtLink
        to="/admin/convidados"
        class="underline"
      >Voltar para a lista</NuxtLink>
    </AppAlert>

    <template v-else>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-4">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 font-display text-2xl text-white shadow-comic-sm">
            {{ guest.name.charAt(0).toUpperCase() }}
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="font-display text-3xl text-navy-950 sm:text-4xl">
                {{ guest.name }}
              </h1>
              <StatusBadge
                kind="rsvp"
                :status="guest.rsvpStatus"
                size="sm"
              />
              <StatusBadge
                kind="send"
                :status="guest.sendStatus"
                size="sm"
              />
            </div>
            <p class="mt-1 text-sm font-semibold text-navy-500">
              {{ guest.groupName || 'Convite individual' }}
              <span v-if="guest.groupName"> · responsável: {{ guest.name }}</span>
            </p>
            <p class="mt-1 text-xs font-semibold text-navy-400">
              Cadastrado em {{ formatDateTime(guest.createdAt) }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton
            variant="outline"
            size="sm"
            @click="copyLink"
          >
            <template #icon>
              <AppIcon
                name="copy"
                :size="15"
              />
            </template>
            Copiar link
          </AppButton>
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
            Editar
          </AppButton>
          <AppButton
            size="sm"
            @click="sendOpen = true"
          >
            <template #icon>
              <AppIcon
                name="whatsapp"
                :size="16"
              />
            </template>
            Enviar convite
          </AppButton>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <!-- Dados do convidado -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="user"
              :size="17"
              class="text-spider-600"
            /> Dados do convidado
          </h2>
          <dl class="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Nome / responsável
              </dt>
              <dd class="mt-0.5 text-sm font-bold text-navy-800">
                {{ guest.name }}
              </dd>
            </div>
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Família / grupo
              </dt>
              <dd class="mt-0.5 text-sm font-bold text-navy-800">
                {{ guest.groupName || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                WhatsApp
              </dt>
              <dd class="mt-0.5 text-sm font-bold text-navy-800">
                <a
                  :href="whatsappChatUrl(guest.phone)"
                  target="_blank"
                  rel="noopener"
                  class="hover:text-spider-600"
                >
                  {{ formatPhone(guest.phone) }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                E-mail
              </dt>
              <dd class="mt-0.5 truncate text-sm font-bold text-navy-800">
                <a
                  v-if="guest.email"
                  :href="`mailto:${guest.email}`"
                  class="hover:text-spider-600"
                >{{ guest.email }}</a>
                <span v-else>—</span>
              </dd>
            </div>
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Estimativa inicial
              </dt>
              <dd class="mt-0.5 text-sm font-bold text-navy-800">
                {{ guest.estimatedGuests ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Limite de pessoas
              </dt>
              <dd class="mt-0.5 text-sm font-bold text-navy-800">
                {{ guest.maxGuests ?? 'Sem limite' }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Observações internas
              </dt>
              <dd class="mt-1 whitespace-pre-line rounded-xl bg-navy-50 p-3 text-xs font-semibold leading-relaxed text-navy-600">
                {{ guest.notes || 'Nenhuma observação interna.' }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Link do convite -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="link"
              :size="17"
              class="text-sky-600"
            /> Link individual
          </h2>
          <p class="mt-1 text-xs font-semibold text-navy-400">
            Este é o endereço exclusivo deste convite. Não compartilhe em redes sociais.
          </p>
          <div class="mt-3 rounded-xl border border-navy-200 bg-navy-50/60 p-2.5">
            <p class="break-all font-mono text-[11px] font-semibold text-navy-600">
              {{ inviteUrl }}
            </p>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <AppButton
              variant="outline"
              size="sm"
              @click="copyLink"
            >
              <template #icon>
                <AppIcon
                  name="copy"
                  :size="14"
                />
              </template>
              Copiar
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              :to="`/convite/${guest.invitationUuid}#rsvp`"
              target="_blank"
            >
              <template #icon>
                <AppIcon
                  name="external"
                  :size="14"
                />
              </template>
              Abrir convite
            </AppButton>
          </div>
          <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p class="text-[11px] font-bold leading-relaxed text-amber-800">
              Precisa invalidar o link atual? Gere um novo — o anterior deixará de funcionar e o status de envio voltará para “não enviado”.
            </p>
            <button
              type="button"
              class="mt-2 text-[11px] font-extrabold text-amber-900 underline underline-offset-2"
              @click="regenOpen = true"
            >
              Gerar novo link
            </button>
          </div>
        </section>

        <!-- Confirmação -->
        <section class="card-surface p-6">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
            <AppIcon
              name="calendar-check"
              :size="17"
              class="text-emerald-600"
            /> Confirmação de presença
          </h2>
          <div
            v-if="guest.rsvpStatus === 'awaiting'"
            class="mt-4 rounded-2xl border-2 border-dashed border-navy-200 p-6 text-center"
          >
            <AppIcon
              name="clock"
              :size="28"
              class="mx-auto text-navy-300"
            />
            <p class="mt-2 text-sm font-extrabold text-navy-600">
              Aguardando resposta
            </p>
            <p class="mt-1 text-xs font-semibold text-navy-400">
              Envie o convite e acompanhe a confirmação por aqui.
            </p>
          </div>
          <template v-else>
            <div :class="['mt-4 rounded-2xl p-4', guest.rsvpStatus === 'yes' ? 'bg-emerald-50' : 'bg-rose-50']">
              <p :class="['text-sm font-extrabold', guest.rsvpStatus === 'yes' ? 'text-emerald-800' : 'text-rose-800']">
                {{ guest.rsvpStatus === 'yes' ? 'Presença confirmada' : 'Não comparecerá' }}
              </p>
              <p
                class="mt-0.5 text-[11px] font-semibold"
                :class="guest.rsvpStatus === 'yes' ? 'text-emerald-700' : 'text-rose-700'"
              >
                Respondido em {{ formatDateTime(guest.rsvpUpdatedAt || guest.confirmedAt) }}
              </p>
            </div>
            <template v-if="guest.rsvpStatus === 'yes'">
              <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                <div class="rounded-xl bg-spider-50 p-2.5">
                  <p class="font-display text-2xl text-spider-700">
                    {{ guest.adults }}
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-spider-700/70">
                    Adultos
                  </p>
                </div>
                <div class="rounded-xl bg-sky-50 p-2.5">
                  <p class="font-display text-2xl text-sky-700">
                    {{ guest.children8to11 }}
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-sky-700/70">
                    8 a 11 anos
                  </p>
                </div>
                <div class="rounded-xl bg-amber-50 p-2.5">
                  <p class="font-display text-2xl text-amber-700">
                    {{ guest.children0to7 }}
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700/70">
                    0 a 7 anos
                  </p>
                </div>
              </div>
              <p class="mt-2 text-center text-xs font-extrabold text-navy-600">
                Total: {{ guest.totalPeople }} pessoa(s)
              </p>
            </template>
            <dl class="mt-3 space-y-1.5 text-xs">
              <div class="flex justify-between gap-3">
                <dt class="font-semibold text-navy-400">
                  Responsável
                </dt>
                <dd class="font-bold text-navy-700">
                  {{ guest.responsibleName || guest.name }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="font-semibold text-navy-400">
                  Telefone
                </dt>
                <dd class="font-bold text-navy-700">
                  {{ formatPhone(guest.rsvpPhone || guest.phone) }}
                </dd>
              </div>
              <div
                v-if="guest.rsvpEmail || guest.email"
                class="flex justify-between gap-3"
              >
                <dt class="font-semibold text-navy-400">
                  E-mail
                </dt>
                <dd class="truncate font-bold text-navy-700">
                  {{ guest.rsvpEmail || guest.email }}
                </dd>
              </div>
            </dl>
            <div
              v-if="guest.rsvpNotes"
              class="mt-3 rounded-xl bg-navy-50 p-3"
            >
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
                Observações do convidado
              </p>
              <p class="mt-1 whitespace-pre-line text-xs font-semibold leading-relaxed text-navy-600">
                {{ guest.rsvpNotes }}
              </p>
            </div>
          </template>
        </section>

        <!-- Histórico -->
        <section class="card-surface p-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-sm font-extrabold text-navy-900">
              <AppIcon
                name="send"
                :size="17"
                class="text-sky-600"
              /> Histórico de envios
            </h2>
            <span class="rounded-full bg-navy-100 px-2.5 py-0.5 text-[11px] font-extrabold text-navy-600">{{ guest.sends.length }}</span>
          </div>
          <div
            v-if="!guest.sends.length"
            class="mt-4 rounded-2xl border-2 border-dashed border-navy-200 p-6 text-center"
          >
            <p class="text-sm font-bold text-navy-500">
              Nenhum envio registrado.
            </p>
            <AppButton
              size="sm"
              class="mt-3"
              @click="sendOpen = true"
            >
              Enviar convite agora
            </AppButton>
          </div>
          <ol
            v-else
            class="mt-4 space-y-3"
          >
            <li
              v-for="send in guest.sends"
              :key="send.id"
              class="rounded-xl border border-navy-100 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    :class="['h-2 w-2 rounded-full', send.status === 'sent' ? 'bg-emerald-500' : 'bg-amber-500']"
                    aria-hidden="true"
                  />
                  <p class="text-xs font-extrabold text-navy-800">
                    {{ send.status === 'sent' ? 'Enviado' : 'Falha no envio' }} · tentativa {{ send.attempt }}
                  </p>
                </div>
                <p class="text-[10px] font-semibold text-navy-400">
                  {{ formatDateTime(send.sentAt) }}
                </p>
              </div>
              <p class="mt-1 text-[11px] font-semibold text-navy-400">
                {{ send.method === 'whatsapp_web' ? 'WhatsApp Web' : 'WhatsApp Business API' }} · {{ formatPhone(send.phone) }}
              </p>
              <button
                type="button"
                class="mt-1.5 text-[11px] font-extrabold text-spider-600 hover:text-spider-800"
                @click="selectedSend = send"
              >
                Ver mensagem enviada
              </button>
            </li>
          </ol>
        </section>
      </div>

      <section class="mt-4 flex flex-col items-start justify-between gap-3 rounded-3xl border border-spider-100 bg-spider-50/50 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-sm font-extrabold text-spider-900">
            Área de risco
          </h2>
          <p class="mt-0.5 text-xs font-semibold text-spider-700/80">
            Excluir o convite remove também o RSVP e o histórico de envios.
          </p>
        </div>
        <AppButton
          variant="danger"
          size="sm"
          @click="deleteOpen = true"
        >
          <template #icon>
            <AppIcon
              name="trash"
              :size="15"
            />
          </template>
          Excluir convidado
        </AppButton>
      </section>

      <GuestFormModal
        v-model="editOpen"
        :guest="guest"
        @saved="onSaved"
      />
      <SendInviteModal
        v-model="sendOpen"
        :guests="[guest]"
        @sent="refresh()"
      />

      <!-- Mensagem enviada -->
      <AppModal
        :model-value="Boolean(selectedSend)"
        title="Mensagem enviada"
        description="Conteúdo registrado no histórico."
        size="md"
        @update:model-value="selectedSend = null"
      >
        <div
          v-if="selectedSend"
          class="space-y-3"
        >
          <div class="flex flex-wrap gap-2 text-[11px] font-bold text-navy-500">
            <span class="rounded-full bg-navy-100 px-2.5 py-1">{{ formatDateTime(selectedSend.sentAt) }}</span>
            <span class="rounded-full bg-navy-100 px-2.5 py-1">{{ formatPhone(selectedSend.phone) }}</span>
            <span class="rounded-full bg-navy-100 px-2.5 py-1">Tentativa {{ selectedSend.attempt }}</span>
          </div>
          <p class="whitespace-pre-line rounded-2xl border border-navy-100 bg-navy-50/60 p-4 text-sm font-medium leading-relaxed text-navy-700">
            {{ selectedSend.message }}
          </p>
        </div>
      </AppModal>

      <!-- Novo link -->
      <AppModal
        v-model="regenOpen"
        title="Gerar novo link"
        size="sm"
      >
        <p class="text-sm font-semibold text-navy-600">
          O link atual será invalidado imediatamente. Se o convite já tiver sido enviado, será necessário
          reenviar com o novo endereço.
        </p>
        <p class="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          A resposta de presença existente é preservada, caso já tenha sido registrada.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <AppButton
              variant="ghost"
              size="sm"
              @click="regenOpen = false"
            >
              Cancelar
            </AppButton>
            <AppButton
              size="sm"
              :loading="regenerating"
              @click="regenerateLink"
            >
              Gerar novo link
            </AppButton>
          </div>
        </template>
      </AppModal>

      <!-- Excluir -->
      <AppModal
        v-model="deleteOpen"
        title="Excluir convidado"
        size="sm"
      >
        <p class="text-sm font-semibold text-navy-600">
          Excluir <strong class="text-navy-900">{{ guest.name }}</strong> e todo o histórico? Esta ação não pode ser desfeita.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <AppButton
              variant="ghost"
              size="sm"
              @click="deleteOpen = false"
            >
              Cancelar
            </AppButton>
            <AppButton
              variant="danger"
              size="sm"
              :loading="deleting"
              @click="confirmDelete"
            >
              Excluir definitivamente
            </AppButton>
          </div>
        </template>
      </AppModal>
    </template>
  </div>
</template>
