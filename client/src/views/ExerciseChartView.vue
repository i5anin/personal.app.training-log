<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
dayjs.locale('ru')

const route  = useRoute()
const router = useRouter()
const workoutStore  = useWorkoutStore()
const catalogStore  = useCatalogStore()

const exerciseId = computed(() => route.params.id as string)
const exercise   = computed(() => catalogStore.getExerciseById(exerciseId.value))

// --- Формулы нагрузки ---
// 1RM Эпли
function epley(w: number, r: number) {
  if (!w || !r) return 0
  return r === 1 ? w : w * (1 + r / 30)
}
// Tonnage (объёмная нагрузка) за упражнение: сумма weight × reps
function tonnage(sets: any[]) {
  return sets.reduce((s: number, x: any) => s + (x.weight ?? 0) * (x.reps ?? 0), 0)
}

// --- Точки данных ---
interface DataPoint {
  date: string
  workoutId: number
  maxWeight: number
  avgWeight: number
  maxReps: number
  max1RM: number
  tonnage: number
}

const points = computed<DataPoint[]>(() => {
  const pts: DataPoint[] = []
  const sorted = [...workoutStore.workouts].sort((a, b) => a.id - b.id)
  for (const w of sorted) {
    const entry = w.entries?.find((e: any) => e.exerciseId === exerciseId.value)
    if (!entry?.sets?.length) continue
    const mainSets = entry.sets.filter((s: any) => !s.isBurnout && !s.isWarmup)
    if (!mainSets.length) continue
    const weights = mainSets.map((s: any) => s.weight ?? 0).filter((x: number) => x > 0)
    if (!weights.length) continue
    pts.push({
      date: w.date,
      workoutId: w.id,
      maxWeight: Math.max(...weights),
      avgWeight: Math.round(weights.reduce((a: number, b: number) => a + b, 0) / weights.length * 10) / 10,
      maxReps: Math.max(...mainSets.map((s: any) => s.reps ?? 0)),
      max1RM: Math.round(Math.max(...mainSets.map((s: any) => epley(s.weight, s.reps)))),
      tonnage: Math.round(tonnage(mainSets)),
    })
  }
  return pts
})

// --- SVG chart helpers ---
const W = 600, H = 200, PAD = { t: 16, r: 16, b: 32, l: 48 }
const chartW = W - PAD.l - PAD.r
const chartH = H - PAD.t - PAD.b

type ChartKey = 'maxWeight' | 'avgWeight' | 'max1RM' | 'tonnage'

const activeMetric = computed({
  get: () => (route.query.m as ChartKey) || 'max1RM',
  set: (v) => router.replace({ query: { m: v } })
})

const metricLabels: Record<ChartKey, string> = {
  maxWeight: 'Макс. вес',
  avgWeight: 'Ср. вес',
  max1RM:    '1ПМ (Эпли)',
  tonnage:   'Объём кг',
}

const values = computed(() => points.value.map(p => p[activeMetric.value]))

const minV = computed(() => Math.min(...values.value) * 0.9)
const maxV = computed(() => Math.max(...values.value) * 1.05 || 1)

function scaleX(i: number) {
  return PAD.l + (points.value.length < 2 ? chartW / 2 : i / (points.value.length - 1) * chartW)
}
function scaleY(v: number) {
  return PAD.t + chartH - (v - minV.value) / (maxV.value - minV.value) * chartH
}

const polyline = computed(() =>
  values.value.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')
)

const yTicks = computed(() => {
  const n = 4
  return Array.from({ length: n + 1 }, (_, i) => {
    const v = minV.value + (maxV.value - minV.value) * (i / n)
    return { y: scaleY(v), label: Math.round(v) }
  })
})
</script>

<template>
  <div class="chart-view">
    <div class="chart-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <h2 class="chart-title">{{ exercise?.name ?? exerciseId }}</h2>
    </div>

    <div v-if="points.length < 2" class="no-data">
      Недостаточно данных — нужно минимум 2 тренировки с этим упражнением
    </div>

    <template v-else>
      <!-- Metric selector -->
      <div class="metric-tabs">
        <button
          v-for="(label, key) in metricLabels" :key="key"
          class="mtab" :class="{ active: activeMetric === key }"
          @click="activeMetric = key as ChartKey"
        >{{ label }}</button>
      </div>

      <!-- SVG line chart -->
      <div class="svg-wrap">
        <svg :viewBox="`0 0 ${W} ${H}`" class="chart-svg">
          <!-- Grid lines -->
          <line
            v-for="t in yTicks" :key="t.label"
            :x1="PAD.l" :y1="t.y" :x2="W - PAD.r" :y2="t.y"
            stroke="#2a2a2a" stroke-width="1"
          />
          <!-- Y labels -->
          <text
            v-for="t in yTicks" :key="'l' + t.label"
            :x="PAD.l - 6" :y="t.y + 4"
            text-anchor="end" class="axis-label"
          >{{ t.label }}</text>

          <!-- Area fill -->
          <polygon
            v-if="values.length >= 2"
            :points="values.map((v,i) => `${scaleX(i)},${scaleY(v)}`).join(' ')
              + ` ${scaleX(values.length-1)},${H - PAD.b} ${scaleX(0)},${H - PAD.b}`"
            fill="rgba(90,170,136,0.10)"
          />

          <!-- Line -->
          <polyline
            :points="polyline"
            fill="none" stroke="#5a8" stroke-width="2" stroke-linejoin="round"
          />

          <!-- Dots + X labels -->
          <g v-for="(p, i) in points" :key="p.workoutId">
            <circle
              :cx="scaleX(i)" :cy="scaleY(values[i])"
              r="4" fill="#5a8" stroke="#121212" stroke-width="1.5"
            />
            <title>#{{ p.workoutId }} {{ dayjs(p.date).format('DD.MM.YY') }} — {{ values[i] }}</title>
            <!-- X tick every N points -->
            <text
              v-if="points.length <= 12 || i % Math.ceil(points.length / 8) === 0"
              :x="scaleX(i)" :y="H - PAD.b + 14"
              text-anchor="middle" class="axis-label"
            >{{ dayjs(p.date).format('DD.MM') }}</text>
          </g>
        </svg>
      </div>

      <!-- Summary cards -->
      <div class="summary-row">
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.maxWeight)) }} кг</span>
          <span class="slbl">Макс. вес</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.max1RM)) }} кг</span>
          <span class="slbl">Лучший 1ПМ</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.round(points.map(p => p.avgWeight).reduce((a,b) => a+b, 0) / points.length) }} кг</span>
          <span class="slbl">Ср. вес</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.tonnage)) }} кг</span>
          <span class="slbl">Макс. объём</span>
        </div>
        <div class="scard">
          <span class="sval">{{ points.length }}</span>
          <span class="slbl">Тренировок</span>
        </div>
      </div>

      <!-- Table -->
      <table class="data-table">
        <thead>
          <tr>
            <th>Дата</th><th>#</th><th>Макс. вес</th><th>Ср. вес</th>
            <th>Макс. повт.</th><th>1ПМ</th><th>Объём</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in [...points].reverse()" :key="p.workoutId"
            class="data-row" @click="router.push({ name: 'edit-workout', params: { id: p.workoutId } })">
            <td>{{ dayjs(p.date).format('dd DD.MM.YY') }}</td>
            <td class="td-id">#{{ p.workoutId }}</td>
            <td>{{ p.maxWeight }} кг</td>
            <td>{{ p.avgWeight }} кг</td>
            <td>{{ p.maxReps }}</td>
            <td class="td-orm">{{ p.max1RM }} кг</td>
            <td>{{ p.tonnage }} кг</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.chart-view {
  padding: 16px;
  max-width: 760px;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.back-btn {
  background: none;
  border: 1px solid #444;
  border-radius: 5px;
  color: #aaa;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.85rem;
}
.back-btn:hover { border-color: #5a8; color: #5a8; }

.chart-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #eee;
  margin: 0;
}

.no-data {
  color: #555;
  padding: 40px 0;
  text-align: center;
  font-size: 0.9rem;
}

.metric-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.mtab {
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 5px;
  background: #1a1a1a;
  color: #777;
  cursor: pointer;
  font-size: 0.8rem;
}
.mtab:hover { border-color: #5a8; color: #5a8; }
.mtab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }

.svg-wrap {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.chart-svg {
  width: 100%;
  display: block;
}

.axis-label {
  font-size: 9px;
  fill: #555;
  font-family: system-ui, sans-serif;
}

.summary-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.scard {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.sval {
  font-size: 1rem;
  font-weight: bold;
  color: #5a8;
}

.slbl {
  font-size: 0.65rem;
  color: #555;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.data-table th {
  color: #555;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-bottom: 1px solid #2a2a2a;
  white-space: nowrap;
}

.data-row {
  cursor: pointer;
  border-bottom: 1px solid #1e1e1e;
}
.data-row:hover { background: #1a1a1a; }

.data-row td {
  padding: 5px 8px;
  color: #aaa;
  white-space: nowrap;
}

.td-id { color: #5a8; font-weight: bold; }
.td-orm { color: #c8a; font-weight: 600; }
</style>
