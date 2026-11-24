<script setup lang="ts">
import type { FinanceMonthlyPoint } from '#shared/types'
import { formatMonthShort } from '#shared/utils/format'
import { formatCentsBRL, formatCentsCompactBRL } from '#shared/utils/money'

const props = defineProps<{
  points: FinanceMonthlyPoint[]
  contractedCents: number
}>()

const width = 640
const height = 260
const padding = { top: 18, right: 16, bottom: 36, left: 62 }
const plotWidth = width - padding.left - padding.right
const plotHeight = height - padding.top - padding.bottom

const maxValue = computed(() => {
  const values = props.points.flatMap(point => [point.cumulativePlannedCents, point.cumulativePaidCents])
  return Math.max(1, props.contractedCents, ...values)
})

function x(index: number): number {
  if (props.points.length <= 1) return padding.left + plotWidth / 2
  return padding.left + (index / (props.points.length - 1)) * plotWidth
}

function y(value: number): number {
  return padding.top + plotHeight - (value / maxValue.value) * plotHeight
}

function polyline(values: number[]): string {
  return values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
}

const plannedPoints = computed(() => polyline(props.points.map(point => point.cumulativePlannedCents)))
const paidPoints = computed(() => polyline(props.points.map(point => point.cumulativePaidCents)))
const paidArea = computed(() => {
  if (!props.points.length) return ''
  const baseline = padding.top + plotHeight
  return `${x(0)},${baseline} ${paidPoints.value} ${x(props.points.length - 1)},${baseline}`
})

const gridLines = computed(() => [0, 0.25, 0.5, 0.75, 1].map(fraction => ({
  value: maxValue.value * fraction,
  y: y(maxValue.value * fraction),
})))

const xLabelStep = computed(() => Math.max(1, Math.ceil(props.points.length / 7)))

const aria = computed(() => {
  const last = props.points[props.points.length - 1]
  if (!last) return 'Sem dados de pagamentos'
  return `Evolução dos pagamentos. Planejado acumulado: ${formatCentsBRL(last.cumulativePlannedCents)}. Pago acumulado: ${formatCentsBRL(last.cumulativePaidCents)}.`
})
</script>

<template>
  <div>
    <div
      v-if="points.length"
      class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-navy-500"
    >
      <span class="inline-flex items-center gap-1.5">
        <span
          class="h-2 w-4 rounded-full bg-navy-500"
          aria-hidden="true"
        /> Planejado
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span
          class="h-2 w-4 rounded-full bg-emerald-500"
          aria-hidden="true"
        /> Pago
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span
          class="h-0.5 w-4 border-t-2 border-dashed border-spider-400"
          aria-hidden="true"
        /> Contratado
      </span>
    </div>

    <div
      v-if="points.length"
      class="scrollbar-thin overflow-x-auto pb-1"
    >
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="h-auto w-full min-w-[640px] sm:min-w-0"
        role="img"
        :aria-label="aria"
      >
        <g>
          <line
            v-for="line in gridLines"
            :key="line.y"
            :x1="padding.left"
            :x2="width - padding.right"
            :y1="line.y"
            :y2="line.y"
            stroke="#e0e9f7"
            stroke-width="1"
          />
          <text
            v-for="line in gridLines"
            :key="`label-${line.y}`"
            :x="padding.left - 8"
            :y="line.y"
            text-anchor="end"
            dominant-baseline="middle"
            fill="#5f8cc8"
            font-size="10"
            font-weight="700"
          >
            {{ formatCentsCompactBRL(line.value) }}
          </text>
        </g>

        <line
          v-if="contractedCents > 0"
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="y(contractedCents)"
          :y2="y(contractedCents)"
          stroke="#f65c6c"
          stroke-width="1.5"
          stroke-dasharray="2 5"
        />

        <polygon
          :points="paidArea"
          fill="#10b981"
          opacity="0.08"
        />
        <polyline
          :points="plannedPoints"
          fill="none"
          stroke="#3d6dae"
          stroke-width="2"
          stroke-dasharray="6 4"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <polyline
          :points="paidPoints"
          fill="none"
          stroke="#10b981"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <g
          v-for="(point, index) in points"
          :key="point.month"
        >
          <circle
            :cx="x(index)"
            :cy="y(point.cumulativePaidCents)"
            r="3.5"
            fill="#10b981"
            stroke="#fff"
            stroke-width="1.5"
          >
            <title>{{ formatMonthShort(point.month) }}: pago {{ formatCentsBRL(point.cumulativePaidCents) }}, planejado {{ formatCentsBRL(point.cumulativePlannedCents) }}</title>
          </circle>
          <text
            v-if="index % xLabelStep === 0 || index === points.length - 1"
            :x="x(index)"
            :y="height - 12"
            :text-anchor="index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'"
            fill="#5f8cc8"
            font-size="10"
            font-weight="700"
          >
            {{ formatMonthShort(point.month) }}
          </text>
        </g>
      </svg>
    </div>

    <p
      v-else
      class="rounded-2xl border-2 border-dashed border-navy-200 p-6 text-center text-sm font-semibold text-navy-400"
    >
      Cadastre parcelas para acompanhar a evolução dos pagamentos.
    </p>
  </div>
</template>
