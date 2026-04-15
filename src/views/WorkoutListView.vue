<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { deleteWorkout, exportAll, importAll } from '@/db'

const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()
const search = ref('')

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
  return ids.map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || id).join(', ')
}

async function duplicate(workoutId: number) {
  router.push({ name: 'new-workout', query: { from: workoutId } })
}

async function remove(id: number) {
  if (!confirm('Удалить тренировку #' + id + '?')) return
  await deleteWorkout(id)
  await workoutStore.load()
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
    <div class="top-bar">
      <input v-model="search" placeholder="Поиск..." class="search-input" />
      <button class="btn btn-primary" @click="router.push({ name: 'new-workout' })">+ Тренировка</button>
    </div>

    <div class="actions-bar">
      <button class="btn btn-sm" @click="doExport">📤 Экспорт</button>
      <button class="btn btn-sm" @click="doImport">📥 Импорт</button>
    </div>

    <div v-if="filtered.length === 0" class="empty">
      Нет тренировок. Нажмите "+ Тренировка" чтобы начать.
    </div>

    <div v-for="w in filtered" :key="w.id" class="workout-card" @click="router.push({ name: 'edit-workout', params: { id: w.id } })">
      <div class="card-header">
        <span class="workout-id">#{{ w.id }}</span>
        <span class="workout-date">{{ formatDate(w.date) }}</span>
      </div>
      <div class="card-muscles" v-if="w.muscleGroups.length">{{ mgLabels(w.muscleGroups) }}</div>
      <div class="card-exercises">
        {{ w.entries.length }} упр.
        <span v-if="w.entries.reduce((s, e) => s + e.sets.length, 0)">
          · {{ w.entries.reduce((s, e) => s + e.sets.length, 0) }} подходов
        </span>
      </div>
      <div class="card-actions" @click.stop>
        <button class="btn btn-xs" @click="duplicate(w.id)">📋</button>
        <button class="btn btn-xs btn-danger" @click="remove(w.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.95rem;
}

.actions-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.empty {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.workout-card {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
}

.workout-card:hover {
  border-color: #5a8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.workout-id {
  font-weight: bold;
  color: #5a8;
}

.workout-date {
  color: #aaa;
  font-size: 0.85rem;
}

.card-muscles {
  font-size: 0.9rem;
  color: #ccc;
  margin-bottom: 2px;
}

.card-exercises {
  font-size: 0.85rem;
  color: #888;
}

.card-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 4px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #eee;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn:hover {
  background: #3a3a3a;
}

.btn-primary {
  background: #2a7a4a;
  border-color: #2a7a4a;
}

.btn-primary:hover {
  background: #3a8a5a;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.8rem;
}

.btn-xs {
  padding: 2px 8px;
  font-size: 0.8rem;
}

.btn-danger:hover {
  background: #a33;
}
</style>
