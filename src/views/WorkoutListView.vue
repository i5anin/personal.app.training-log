<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { deleteWorkout, exportAll, importAll } from '@/db'
import { getMuscleGroupIcon } from '@/constants/muscleGroupIcons'
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
    const mgLabels = w.muscleGroups
      .map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || '')
      .join(' ')
    const exNames = w.entries
      .map((e) => catalogStore.getExerciseById(e.exerciseId)?.name || '')
      .join(' ')
    return `${w.date} ${mgLabels} ${exNames} #${w.id}`.toLowerCase().includes(q)
  })
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mgLabels(ids: string[]) {
  return ids.map((id) => {
    const label = catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || id
    return `${getMuscleGroupIcon(id)} ${label}`
  }).join('  ')
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
        + Тренировка
      </button>
      <button class="btn btn-sm" @click="doExport">📤</button>
      <button class="btn btn-sm" @click="doImport">📥</button>
    </div>

    <div v-if="filtered.length === 0" class="empty">
      Нет тренировок
    </div>

    <div
      v-for="w in filtered"
      :key="w.id"
      class="workout-card"
      :class="{ active: w.id === activeId }"
      @click="router.push({ name: 'edit-workout', params: { id: w.id } })"
    >
      <div class="card-header">
        <span class="workout-id">#{{ w.id }}</span>
        <span class="workout-date">{{ formatDate(w.date) }}</span>
      </div>
      <div class="card-muscles" v-if="w.muscleGroups.length">{{ mgLabels(w.muscleGroups) }}</div>
      <div class="card-footer">
        <span class="card-exercises">
          {{ w.entries.length }} упр.
          <span v-if="w.entries.reduce((s, e) => s + e.sets.length, 0)">
            · {{ w.entries.reduce((s, e) => s + e.sets.length, 0) }} подх.
          </span>
        </span>
        <div class="card-actions" @click.stop>
          <button class="btn btn-xs" title="Дублировать" @click="duplicate(w.id)">📋</button>
          <button class="btn btn-xs btn-danger" title="Удалить" @click="remove(w.id)">✕</button>
        </div>
      </div>
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

/* Скроллируемый список */
.workout-card {
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  border-radius: 7px;
  padding: 9px 10px;
  margin-bottom: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s;
}

.workout-card:hover {
  border-color: #4a7a6a;
}

.workout-card.active {
  border-color: #5a8;
  background: #1a2a22;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.workout-id {
  font-weight: bold;
  color: #5a8;
  font-size: 0.95rem;
}

.workout-date {
  color: #777;
  font-size: 0.75rem;
}

.card-muscles {
  font-size: 0.82rem;
  color: #bbb;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-exercises {
  font-size: 0.78rem;
  color: #666;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.btn {
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
</style>
