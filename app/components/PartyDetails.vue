<script setup lang="ts">
import type { PartySettings } from '#shared/config/party'
import { mapsUrl } from '#shared/utils/format'

const props = defineProps<{ settings: PartySettings }>()
const mapLink = computed(() => mapsUrl(props.settings))
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <div class="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-spider-50 text-spider-600">
        <AppIcon
          name="calendar"
          :size="20"
        />
      </span>
      <p class="mt-3 text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
        Quando
      </p>
      <p class="mt-1 text-sm font-extrabold text-navy-900">
        {{ settings.dateLabel }}
      </p>
      <p class="text-xs font-semibold text-navy-500">
        às {{ settings.timeLabel }}
      </p>
    </div>
    <div class="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <AppIcon
          name="mapPin"
          :size="20"
        />
      </span>
      <p class="mt-3 text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
        Onde
      </p>
      <p class="mt-1 text-sm font-extrabold text-navy-900">
        {{ settings.venue }}
      </p>
      <p class="text-xs font-semibold text-navy-500">
        {{ settings.neighborhood }} · {{ settings.city }}/{{ settings.state }}
      </p>
    </div>
    <div class="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
        <AppIcon
          name="party"
          :size="20"
        />
      </span>
      <p class="mt-3 text-[10px] font-extrabold uppercase tracking-widest text-navy-400">
        Endereço
      </p>
      <p class="mt-1 text-sm font-extrabold text-navy-900">
        {{ settings.address }}
      </p>
      <a
        :href="mapLink"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-spider-600 hover:text-spider-800"
      >
        Abrir no Google Maps
        <AppIcon
          name="arrow-up-right"
          :size="13"
        />
      </a>
    </div>
  </div>
</template>
