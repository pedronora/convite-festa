<script setup lang="ts">
import type { GuestImportResult } from '#shared/types'
import { GUEST_IMPORT_COLUMNS, GUEST_IMPORT_MAX_ROWS, GUEST_IMPORT_TEMPLATE } from '#shared/config/guest-import'
import { formatPhoneBR } from '#shared/utils/phone'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'imported': [result: GuestImportResult]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const error = ref('')
const result = ref<GuestImportResult | null>(null)

const requiredColumns = GUEST_IMPORT_COLUMNS.filter(column => column.required)
const optionalColumns = GUEST_IMPORT_COLUMNS.filter(column => !column.required)

watch(() => props.modelValue, (open) => {
  if (open) reset()
})

function reset() {
  selectedFile.value = null
  importing.value = false
  error.value = ''
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  error.value = ''
  result.value = null
}

function downloadTemplate() {
  const blob = new Blob(['\uFEFF', GUEST_IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'modelo-convidados.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function submit() {
  const file = selectedFile.value
  if (!file) {
    error.value = 'Selecione um arquivo CSV.'
    return
  }

  importing.value = true
  error.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const data = await $fetch<GuestImportResult>('/api/admin/guests/import', {
      method: 'POST',
      body,
    })
    result.value = data
    emit('imported', data)
  }
  catch (requestError) {
    error.value = apiErrorMessage(requestError, 'Não foi possível importar o arquivo.')
  }
  finally {
    importing.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Importar convidados"
    description="Envie um CSV com os convidados. Cada linha aceita vira um convite individual."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      v-if="result"
      class="space-y-4"
    >
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="rounded-xl border border-navy-100 bg-navy-50/60 p-3 text-center">
          <p class="text-2xl font-extrabold text-navy-900">
            {{ result.total }}
          </p>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
            Linhas
          </p>
        </div>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-emerald-700">
            {{ result.imported.length }}
          </p>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700/70">
            Incluídos
          </p>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-amber-700">
            {{ result.skipped.length }}
          </p>
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-amber-700/70">
            Ignorados
          </p>
        </div>
      </div>

      <section v-if="result.imported.length">
        <h3 class="text-xs font-extrabold uppercase tracking-wide text-navy-500">
          Convidados incluídos
        </h3>
        <div class="mt-2 max-h-56 overflow-auto rounded-xl border border-navy-100">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-navy-50 text-[10px] uppercase tracking-wide text-navy-500">
              <tr>
                <th class="px-3 py-2 font-extrabold">
                  Linha
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Nome
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Família/Grupo
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Telefone
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-navy-100 bg-white">
              <tr
                v-for="row in result.imported"
                :key="`${row.line}-${row.phone}`"
              >
                <td class="px-3 py-2 font-semibold text-navy-400">
                  {{ row.line }}
                </td>
                <td class="px-3 py-2 font-bold text-navy-900">
                  {{ row.name }}
                </td>
                <td class="px-3 py-2 text-navy-600">
                  {{ row.groupName || '—' }}
                </td>
                <td class="px-3 py-2 text-navy-600">
                  {{ formatPhoneBR(row.phone) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <AppAlert
        v-else
        type="warning"
        title="Nenhum convidado incluído"
      >
        Confira o relatório abaixo e corrija o arquivo antes de tentar novamente.
      </AppAlert>

      <section v-if="result.skipped.length">
        <h3 class="text-xs font-extrabold uppercase tracking-wide text-navy-500">
          Linhas ignoradas
        </h3>
        <div class="mt-2 max-h-56 overflow-auto rounded-xl border border-navy-100">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-navy-50 text-[10px] uppercase tracking-wide text-navy-500">
              <tr>
                <th class="px-3 py-2 font-extrabold">
                  Linha
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Nome
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Telefone
                </th>
                <th class="px-3 py-2 font-extrabold">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-navy-100 bg-white">
              <tr
                v-for="row in result.skipped"
                :key="`${row.line}-${row.reason}`"
              >
                <td class="px-3 py-2 font-semibold text-navy-400">
                  {{ row.line }}
                </td>
                <td class="px-3 py-2 font-bold text-navy-900">
                  {{ row.name }}
                </td>
                <td class="px-3 py-2 text-navy-600">
                  {{ formatPhoneBR(row.phone) }}
                </td>
                <td class="px-3 py-2 font-semibold text-amber-700">
                  {{ row.reason }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <form
      v-else
      id="guest-import-form"
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <AppAlert
        v-if="error"
        type="error"
        title="Não foi possível importar"
      >
        {{ error }}
      </AppAlert>

      <p class="text-sm font-semibold text-navy-600">
        A primeira linha precisa ter os cabeçalhos. Use <strong>;</strong> ou <strong>,</strong>
        como separador. O arquivo pode ter até <strong>{{ GUEST_IMPORT_MAX_ROWS }} linhas</strong>
        e <strong>1 MB</strong>.
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-navy-100 bg-white p-3">
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-spider-700">
            Obrigatórias
          </p>
          <ul class="mt-1.5 space-y-1 text-xs font-semibold text-navy-700">
            <li
              v-for="column in requiredColumns"
              :key="column.key"
            >
              {{ column.label }}
            </li>
          </ul>
        </div>
        <div class="rounded-xl border border-navy-100 bg-white p-3">
          <p class="text-[10px] font-extrabold uppercase tracking-wide text-navy-400">
            Opcionais
          </p>
          <ul class="mt-1.5 space-y-1 text-xs font-semibold text-navy-600">
            <li
              v-for="column in optionalColumns"
              :key="column.key"
            >
              {{ column.label }}
            </li>
          </ul>
        </div>
      </div>

      <p class="flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-xs font-semibold text-navy-500">
        <AppIcon
          name="info"
          :size="15"
          class="mt-0.5 shrink-0"
        />
        Convidados com o mesmo telefone de um cadastro existente ou repetido no arquivo são
        ignorados e aparecem no relatório. O e-mail não é usado para detectar duplicidade.
      </p>

      <div>
        <AppButton
          variant="outline"
          size="sm"
          @click="downloadTemplate"
        >
          <template #icon>
            <AppIcon
              name="download"
              :size="15"
            />
          </template>
          Baixar modelo
        </AppButton>
      </div>

      <div>
        <label
          for="guest-import-file"
          class="mb-1.5 block text-xs font-extrabold text-navy-700"
        >
          Arquivo CSV
        </label>
        <input
          id="guest-import-file"
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/50 px-4 py-6 text-sm font-semibold text-navy-600 transition hover:border-navy-300 file:mr-4 file:rounded-lg file:border-0 file:bg-spider-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
          @change="onFileChange"
        >
        <p
          v-if="selectedFile"
          class="mt-1.5 text-xs font-semibold text-navy-500"
        >
          {{ selectedFile.name }} · {{ formatSize(selectedFile.size) }}
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <template v-if="result">
          <AppButton
            variant="ghost"
            size="sm"
            @click="reset"
          >
            Importar outro
          </AppButton>
          <AppButton
            size="sm"
            @click="close"
          >
            Concluir
          </AppButton>
        </template>
        <template v-else>
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="importing"
            @click="close"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            form="guest-import-form"
            size="sm"
            :loading="importing"
            :disabled="!selectedFile"
          >
            <template #icon>
              <AppIcon
                name="upload"
                :size="15"
              />
            </template>
            Importar convidados
          </AppButton>
        </template>
      </div>
    </template>
  </AppModal>
</template>
