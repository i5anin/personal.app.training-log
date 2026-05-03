<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { deleteWorkout, exportAll, importAll } from '@/db'
import { getMuscleGroupIcon, getMuscleGroupImage } from '@/constants/muscleGroupIcons'
import { Upload, Download, Clock, Copy, X, Plus } from 'lucide-vue-next'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
dayjs.locale('ru')

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()
const search = ref('')

const activeId = computed(() => route.params.id ? Number(route.params.id) : null)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return workoutStore.workouts
  return workoutStore.workouts.filter((w) => {
    const mgLabels = (w.muscleGroups || [])
      .map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || '')
      .join(' ')
    const exNames = (w.entries || [])
      .map((e) => catalogStore.getExerciseById(e.exerciseId)?.name || '')
      .join(' ')
    return `${w.date} ${mgLabels} ${exNames} #${w.id}`.toLowerCase().includes(q)
  })
})

function formatDate(iso: string) {
  return dayjs(iso).format('dd DD.MM.YY')
}

function gapDays(isoA: string, isoB: string): number {
  return Math.abs(dayjs(isoB).diff(dayjs(isoA), 'day'))
}

function mgLabels(ids: string[]) {
  return (ids || []).map((id) => {
    const label = catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || id
    return `${getMuscleGroupIcon(id)} ${label}`
  }).join('  ')
}

function mgIcons(ids: string[]) {
  return (ids || []).map((id) => getMuscleGroupIcon(id)).join(' ')
}

function mgTooltip(ids: string[]) {
  return (ids || []).map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || id).join(', ')
}

async function duplicate(workoutId: number) {
  router.push({ name: 'new-workout', query: { from: workoutId } })
}

async function remove(id: number) {
  if (!confirm('Удалить тренировку #' + id + '?')) return
  await deleteWorkout(id)
  await workoutStore.load()
  if (activeId.value === id) router.push('/')
}

async function doExport() {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gym-plus-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}м`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}ч ${rm}м` : `${h}ч`
}

async function doImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    if (!confirm(`Импортировать ${data.workouts?.length || 0} тренировок? Текущие данные будут заменены.`)) return
    await importAll(data)
    await catalogStore.load()
    await workoutStore.load()
  }
  input.click()
}
</script>

<template>
  <div class="list-view">
    <!-- Поиск + кнопка -->
    <div class="top-bar">
      <input v-model="search" placeholder="Поиск..." class="search-input" />
    </div>
    <div class="actions-bar">
      <button class="btn btn-primary btn-new" @click="router.push({ name: 'new-workout' })">
        <Plus class="size-4" /> Тренировка
      </button>
      <button class="btn btn-sm" title="Экспорт" @click="doExport"><Upload class="size-4" /></button>
      <button class="btn btn-sm" title="Импорт" @click="doImport"><Download class="size-4" /></button>
    </div>

    <div v-if="filtered.length === 0" class="empty">Нет тренировок</div>

    <div class="table-wrap" v-else>
      <table class="wt">
        <thead>
          <tr>
            <th class="th-id">#</th>
            <th class="th-date">Дата</th>
            <th class="th-mg">Мышцы</th>
            <th class="th-ex">Упр.</th>
            <th class="th-time"><Clock class="size-3.5 inline" /></th>
            <th class="th-act"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(w, i) in filtered"
            :key="w.id"
            class="wrow"
            :class="{ active: w.id === activeId }"
            @click="router.push({ name: 'edit-workout', params: { id: w.id } })"
          >
            <td class="td-id">#{{ w.id }}</td>
            <td class="td-date">
              <div>{{ formatDate(w.date) }}</div>
              <div class="td-gap" v-if="i < filtered.length - 1">
                +{{ gapDays(filtered[i + 1]!.date, w.date) }}д
              </div>
            </td>
            <td class="td-mg" :title="mgTooltip(w.muscleGroups)">
              <span v-for="id in (w.muscleGroups || [])" :key="id" class="mg-icon-wrap">
                <img v-if="getMuscleGroupImage(id)" :src="getMuscleGroupImage(id)!" :alt="id" class="mg-icon-img" />
                <span v-else>{{ getMuscleGroupIcon(id) }}</span>
              </span>
            </td>
            <td class="td-ex">
              {{ (w.entries || []).length }}<span class="td-sets" v-if="(w.entries || []).reduce((s,e)=>s+(e.sets||[]).length,0)"> / {{ (w.entries || []).reduce((s,e)=>s+(e.sets||[]).length,0) }}</span>
            </td>
            <td class="td-time">
              <span v-if="w.totalEditMs && w.totalEditMs > 0" class="time-badge">{{ fmtDuration(w.totalEditMs) }}</span>
              <span v-else class="time-none">—</span>
            </td>
            <td class="td-act" @click.stop>
              <button class="act-btn act-dup" title="Дублировать" @click="duplicate(w.id)"><Copy class="size-3.5" /></button>
              <button class="act-btn act-del" title="Удалить" @click="remove(w.id)"><X class="size-3.5" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 10px;
}

.top-bar {
  margin-bottom: 6px;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.actions-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.btn-new {
  flex: 1;
}

.empty {
  text-align: center;
  color: #555;
  padding: 30px 0;
  font-size: 0.85rem;
}

.table-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.wt {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.wt thead th {
  position: sticky;
  top: 0;
  background: #161616;
  color: #555;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 4px 6px;
  border-bottom: 1px solid #2a2a2a;
  white-space: nowrap;
}

.wrow {
  cursor: pointer;
  border-bottom: 1px solid #1e1e1e;
  transition: background 0.1s;
}

.wrow:hover { background: #1e1e1e; }
.wrow.active { background: #1a2a22; }
.wrow.active .td-id { color: #5a8; }

.wt td {
  padding: 5px 4px;
  vertical-align: middle;
}

.td-id {
  font-weight: bold;
  color: #5a8;
  white-space: nowrap;
  width: 36px;
}

.td-date {
  white-space: nowrap;
  color: #888;
  font-size: 0.74rem;
  width: 82px;
}

.td-gap {
  font-size: 0.65rem;
  color: #444;
  margin-top: 1px;
}

.td-mg {
  white-space: nowrap;
  width: 60px;
}

.mg-icon-wrap {
  display: inline-block;
  margin-right: 2px;
}

.mg-icon-img {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
  vertical-align: middle;
}

.td-ex {
  color: #888;
  white-space: nowrap;
  text-align: center;
  width: 36px;
}

.td-sets {
  color: #555;
  font-size: 0.72rem;
}

.td-time {
  text-align: right;
  white-space: nowrap;
  width: 52px;
}

.time-badge {
  color: #5a8;
  font-size: 0.75rem;
  font-weight: 600;
}

.time-none {
  color: #333;
  font-size: 0.75rem;
}

.td-act {
  text-align: right;
  white-space: nowrap;
  width: 56px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #252525;
  color: #eee;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn:hover {
  background: #333;
}

.btn-primary {
  background: #2a7a4a;
  border-color: #2a7a4a;
  color: #fff;
}

.btn-primary:hover {
  background: #3a8a5a;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.85rem;
}

.btn-xs {
  padding: 2px 7px;
  font-size: 0.78rem;
}

.btn-danger:hover {
  background: #7a2222;
  border-color: #7a2222;
}

/* Action icons in table */
.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 3px 5px;
  line-height: 1;
  color: #555;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}
.act-btn:hover { background: #2a2a2a; }
.act-dup:hover { color: #5a8; }
.act-del:hover { color: #d55; }
</style>
