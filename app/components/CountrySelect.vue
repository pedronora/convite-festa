<script setup lang="ts">
import type { CountryCode } from 'libphonenumber-js'
import type { CountryOption } from '#shared/config/countries'
import { countryFlag, countryLabel, countryOption, searchCountries } from '#shared/config/countries'

const props = defineProps<{
  modelValue: CountryCode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CountryCode]
}>()

interface PanelStyle {
  top?: string
  bottom?: string
  left: string
  width: string
  maxHeight: string
}

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const panelStyle = ref<PanelStyle>({ left: '0px', width: '320px', maxHeight: '320px' })
const listboxId = useId()

const selectedOption = computed(() => countryOption(props.modelValue))
const selectedLabel = computed(() => countryLabel(props.modelValue))
const results = computed(() => searchCountries(query.value))
const activeOption = computed<CountryOption | undefined>(() => results.value[activeIndex.value])

function optionId(index: number): string {
  return `${listboxId}-option-${index}`
}

function updatePosition() {
  if (!import.meta.client || !trigger.value) return

  const rect = trigger.value.getBoundingClientRect()
  const margin = 8
  const width = Math.min(320, window.innerWidth - margin * 2)
  const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin)
  const spaceBelow = window.innerHeight - rect.bottom - margin
  const spaceAbove = rect.top - margin
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow

  panelStyle.value = openAbove
    ? {
        bottom: `${window.innerHeight - rect.top + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.max(120, Math.min(320, spaceAbove - 4))}px`,
      }
    : {
        top: `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.max(120, Math.min(320, spaceBelow - 4))}px`,
      }
}

function scrollActiveIntoView() {
  const options = panel.value?.querySelectorAll<HTMLElement>('[role="option"]')
  options?.[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
}

async function openPanel() {
  if (open.value) return
  query.value = ''
  const selectedIndex = results.value.findIndex(option => option.code === props.modelValue)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  open.value = true
  updatePosition()
  await nextTick()
  searchInput.value?.focus()
  scrollActiveIntoView()
}

function closePanel(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

function selectCountry(option: CountryOption) {
  emit('update:modelValue', option.code)
  closePanel()
}

function moveActive(step: number) {
  if (!results.value.length) return
  activeIndex.value = (activeIndex.value + step + results.value.length) % results.value.length
  nextTick(scrollActiveIntoView)
}

function onQueryInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  activeIndex.value = 0
  nextTick(scrollActiveIntoView)
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    if (activeOption.value) selectCountry(activeOption.value)
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closePanel()
    return
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    closePanel()
  }
}

function onDocumentMouseDown(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (trigger.value?.contains(target) || panel.value?.contains(target)) return
  closePanel(false)
}

function onViewportChange() {
  if (open.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
  window.visualViewport?.addEventListener('resize', onViewportChange)
  window.visualViewport?.addEventListener('scroll', onViewportChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
  window.visualViewport?.removeEventListener('resize', onViewportChange)
  window.visualViewport?.removeEventListener('scroll', onViewportChange)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="input-base flex w-24 shrink-0 items-center justify-between gap-1 px-2.5 text-left sm:w-28"
    :aria-label="`País do telefone: ${selectedLabel}`"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :aria-controls="open ? listboxId : undefined"
    @click="open ? closePanel() : openPanel()"
    @keydown.down.prevent="openPanel"
  >
    <span class="text-base leading-none">{{ countryFlag(props.modelValue) }}</span>
    <span class="text-sm font-bold text-navy-800">+{{ selectedOption?.dialCode }}</span>
    <AppIcon
      name="chevron-down"
      :size="14"
      class="shrink-0 text-navy-400"
    />
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panel"
      :style="panelStyle"
      class="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-2xl"
    >
      <div class="border-b border-navy-100 p-2">
        <div class="relative">
          <AppIcon
            name="search"
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
          />
          <input
            ref="searchInput"
            :value="query"
            type="search"
            role="combobox"
            aria-label="Buscar país"
            aria-autocomplete="list"
            :aria-expanded="open"
            :aria-controls="listboxId"
            :aria-activedescendant="activeOption ? optionId(activeIndex) : undefined"
            autocomplete="off"
            spellcheck="false"
            class="input-base py-2 pl-9 text-sm"
            placeholder="Buscar país ou DDI"
            @input="onQueryInput"
            @keydown="onSearchKeydown"
          >
        </div>
      </div>

      <ul
        :id="listboxId"
        role="listbox"
        aria-label="Países"
        class="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1"
      >
        <li
          v-for="(option, index) in results"
          :id="optionId(index)"
          :key="option.code"
          role="option"
          :aria-selected="option.code === props.modelValue"
          :class="[
            'flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 transition',
            index === activeIndex ? 'bg-spider-50 text-spider-800' : 'text-navy-700 hover:bg-navy-50',
          ]"
          @mouseenter="activeIndex = index"
          @mousedown.prevent="selectCountry(option)"
        >
          <span class="text-base leading-none">{{ countryFlag(option.code) }}</span>
          <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ option.name }}</span>
          <span class="text-xs font-bold text-navy-400">+{{ option.dialCode }}</span>
          <AppIcon
            v-if="option.code === props.modelValue"
            name="check"
            :size="15"
            class="shrink-0 text-spider-600"
          />
        </li>
        <li
          v-if="!results.length"
          class="px-3 py-6 text-center text-sm text-navy-400"
        >
          Nenhum país encontrado.
        </li>
      </ul>
    </div>
  </Teleport>
</template>
