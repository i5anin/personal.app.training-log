<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupIcon } from '@/constants/muscleGroupIcons'
import SparkCell from '@/components/SparkCell.vue'

const ENTRIES_GOAL = 245
const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()

// ─── Прогресс ───────────────────────────────────────────
const totalEntries = computed(() => workoutStore.workouts.length)

const workoutRange = computed(() => {
  if (!workoutStore.workouts.length) return ''
  const ids = workoutStore.workouts.map((w) => w.id)
  const mn = Math.min(...ids), mx = Math.max(...ids)
  return mn === mx ? `#${mn}` : `#${mn}–#${mx}`
})

const avgEditMs = computed((): number | null => {
  const times = workoutStore.workouts
    .map((w) => w.totalEditMs)
    .filter((ms): ms is number => typeof ms === 'number' && ms > 500)
  if (!times.length) return null
  const sorted = [...times].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? Infinity
  const clean = times.filter((ms) => ms <= median * 3)
  return clean.length ? clean.reduce((s, ms) => s + ms, 0) / clean.length : null
})

const remaining = computed(() => Math.max(0, ENTRIES_GOAL - totalEntries.value))
const etaMs = computed(() => avgEditMs.value ? remaining.value * avgEditMs.value : null)
const progressPct = computed(() => Math.min(100, (totalEntries.value / ENTRIES_GOAL) * 100))

function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}м`
  const h = Math.floor(m / 60), rm = m % 60
  return rm ? `${h}ч ${rm}м` : `${h}ч`
}

// ─── Упражнения ──────────────────────────────────────────
type MG = 'all' | string
const filterMg = ref<MG>('all')

function epley(w: number, r: number) {
  if (!w || !r) return 0
  return r === 1 ? w : w * (1 + r / 30)
}

interface ExStat {
  exerciseId: string
  name: string
  muscleGroups: string[]
  count: number
  best1RM: number
  lastDate: string
  pts1RM: number[]   // max1RM per workout, chronological
  ptsVol: number[]   // tonnage per workout
}

const exStats = computed<ExStat[]>(() => {
  const sorted = [...workoutStore.workouts].sort((a, b) => a.id - b.id)
  const map = new Map<string, ExStat>()

  for (const w of sorted) {
    for (const entry of (w.entries || [])) {
      const sets = (entry.sets || []).filter((s: any) => !s.isBurnout && !s.isWarmup)
      const weights = sets.map((s: any) => s.weight ?? 0).filter((x: number) => x > 0)
      if (!weights.length) continue

      const max1RM = Math.round(Math.max(...sets.map((s: any) => epley(s.weight, s.reps))))
      if (!max1RM) continue

      const ex = catalogStore.getExerciseById(entry.exerciseId)
      if (!ex) continue

      if (!map.has(entry.exerciseId)) {
        map.set(entry.exerciseId, {
          exerciseId: entry.exerciseId,
          name: ex.name,
          muscleGroups: ex.muscleGroups,
          count: 0,
          best1RM: 0,
          lastDate: w.date,
          pts1RM: [],
          ptsVol: [],
        })
      }
      const stat = map.get(entry.exerciseId)!
      stat.count++
      stat.best1RM = Math.max(stat.best1RM, max1RM)
      stat.lastDate = w.date
      stat.pts1RM.push(max1RM)
      stat.ptsVol.push(sets.reduce((s: number, x: any) => s + (x.weight ?? 0) * (x.reps ?? 0), 0))
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || b.best1RM - a.best1RM)
})

const filteredStats = computed(() => {
  if (filterMg.value === 'all') return exStats.value
  return exStats.value.filter((s) => s.muscleGroups.includes(filterMg.value))
})

// все группы мышц которые есть в данных
const activeMgs = computed(() => {
  const seen = new Set<string>()
  for (const s of exStats.value) s.muscleGroups.forEach((m) => seen.add(m))
  return [...seen]
})

const SW = 88, SH = 30

// ─── Активная метрика ─────────────────────────────────────
const metric = ref<'1rm' | 'vol'>('1rm')
</script>

<template>
  <div class="stats-view">

    <!-- ─── Прогресс ─── -->
    <div class="progress-panel">
      <div class="progress-header">
        <span class="progress-label">Записи</span>
        <span class="progress-fraction">{{ totalEntries }} / {{ ENTRIES_GOAL }}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" />
      </div>
      <div class="progress-cells">
        <div class="pcell">
          <span class="pcell-val">{{ totalEntries }}</span>
          <span class="pcell-lbl">добавлено</span>
        </div>
        <div class="pcell" v-if="workoutRange">
          <span class="pcell-val">тр. {{ workoutRange }}</span>
          <span class="pcell-lbl">тренировки</span>
        </div>
        <div class="pcell">
          <span class="pcell-val">{{ remaining }}</span>
          <span class="pcell-lbl">осталось</span>
        </div>
        <div class="pcell">
          <span class="pcell-val">{{ avgEditMs ? '~' + fmtDuration(avgEditMs) : '—' }}</span>
          <span class="pcell-lbl">сред./тр.</span>
        </div>
        <div class="pcell pcell-eta">
          <span class="pcell-val">{{ etaMs ? '~' + fmtDuration(etaMs) : '—' }}</span>
          <span class="pcell-lbl">ETA</span>
        </div>
      </div>
    </div>

    <!-- ─── Метрика + фильтр ─── -->
    <div class="toolbar">
      <div class="metric-tabs">
        <button class="mtab" :class="{ active: metric === '1rm' }" @click="metric = '1rm'">1ПМ</button>
        <button class="mtab" :class="{ active: metric === 'vol' }" @click="metric = 'vol'">Объём</button>
      </div>
      <div class="mg-filter">
        <button
          class="mgf" :class="{ active: filterMg === 'all' }"
          @click="filterMg = 'all'"
        >Все</button>
        <button
          v-for="mg in activeMgs" :key="mg"
          class="mgf" :class="{ active: filterMg === mg }"
          @click="filterMg = filterMg === mg ? 'all' : mg"
          :title="catalogStore.muscleGroups.find(m => m.id === mg)?.label ?? mg"
        >{{ getMuscleGroupIcon(mg) }}</button>
      </div>
    </div>

    <!-- ─── Список упражнений ─── -->
    <div class="ex-list">
      <div v-if="filteredStats.length === 0" class="no-ex">Нет данных</div>

      <div
        v-for="s in filteredStats"
        :key="s.exerciseId"
        class="ex-row"
        @click="router.push({ name: 'exercise-chart', params: { id: s.exerciseId } })"
      >
        <!-- Левая часть: название + мета -->
        <div class="ex-left">
          <div class="ex-name">{{ s.name }}</div>
          <div class="ex-meta">
            <span class="ex-1rm">{{ metric === '1rm' ? s.best1RM + ' кг' : Math.round(s.ptsVol.reduce((a,b)=>Math.max(a,b),0)) + ' кг' }}</span>
            <span class="ex-cnt">{{ s.count }} тр.</span>
            <span class="ex-mgs">{{ s.muscleGroups.map(m => getMuscleGroupIcon(m)).join('') }}</span>
          </div>
        </div>

        <!-- Спарклайн -->
        <SparkCell :pts="metric === '1rm' ? s.pts1RM : s.ptsVol" :sw="SW" :sh="SH" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}

/* ── Прогресс ── */
.progress-panel {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 8px 10px;
  flex-shrink: 0;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}
.progress-label { font-size: 0.72rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
.progress-fraction { font-size: 0.8rem; color: #5a8; font-weight: bold; }
.progress-track { height: 4px; background: #2a2a2a; border-radius: 2px; overflow: hidden; margin-bottom: 7px; }
.progress-fill { height: 100%; background: #5a8; border-radius: 2px; transition: width 0.3s; }
.progress-cells { display: flex; gap: 5px; flex-wrap: wrap; }
.pcell {
  background: #111;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  padding: 3px 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 42px;
}
.pcell-val { font-size: 0.78rem; font-weight: bold; color: #ccc; line-height: 1.2; }
.pcell-lbl { font-size: 0.6rem; color: #555; line-height: 1.2; }
.pcell-eta .pcell-val { color: #5a8; }

/* ── Тулбар ── */
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.metric-tabs { display: flex; gap: 4px; }
.mtab {
  padding: 3px 9px;
  border: 1px solid #333;
  border-radius: 5px;
  background: #1a1a1a;
  color: #666;
  cursor: pointer;
  font-size: 0.75rem;
}
.mtab:hover { border-color: #5a8; color: #5a8; }
.mtab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }

.mg-filter { display: flex; gap: 3px; flex-wrap: wrap; }
.mgf {
  padding: 2px 6px;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
}
.mgf:hover { border-color: #5a8; }
.mgf.active { border-color: #5a8; background: #1a2a22; }

/* ── Список упражнений ── */
.ex-list { display: flex; flex-direction: column; gap: 2px; }

.no-ex { text-align: center; color: #444; padding: 20px 0; font-size: 0.85rem; }

.ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.ex-row:hover {
  background: #1a1a1a;
  border-color: #2a2a2a;
}

.ex-left {
  flex: 1;
  min-width: 0;
}
.ex-name {
  font-size: 0.82rem;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.ex-meta {
  display: flex;
  gap: 7px;
  align-items: center;
}
.ex-1rm {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5a8;
}
.ex-cnt {
  font-size: 0.68rem;
  color: #555;
}
.ex-mgs {
  font-size: 0.72rem;
  color: #444;
}

</style>
