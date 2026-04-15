<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import type { Workout, ExerciseEntry } from '@/types'
import { getWorkout, getNextWorkoutId, saveWorkout } from '@/db'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import ExerciseEntryCard from '@/components/ExerciseEntryCard.vue'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()

const workout = ref<Workout>({
  id: 0,
  date: new Date().toISOString().slice(0, 10),
  muscleGroups: [],
  entries: [],
  description: '',
})

const isNew = computed(() => route.name === 'new-workout')
const saving = ref(false)

onMounted(async () => {
  if (route.name === 'edit-workout') {
    const id = Number(route.params.id)
    const existing = await getWorkout(id)
    if (existing) {
      workout.value = JSON.parse(JSON.stringify(existing))
    } else {
      router.replace('/')
    }
  } else {
    workout.value.id = await getNextWorkoutId()

    // Duplicate from another workout
    const fromId = Number(route.query.from)
    if (fromId) {
      const source = await getWorkout(fromId)
      if (source) {
        workout.value.muscleGroups = [...source.muscleGroups]
        workout.value.entries = source.entries.map((e) => ({
          ...e,
          id: nanoid(),
          sets: e.sets.map((s) => ({ ...s })),
          photoIds: undefined,
          description: undefined,
        }))
      }
    }
  }
})

function toggleMuscleGroup(id: string) {
  const idx = workout.value.muscleGroups.indexOf(id)
  if (idx >= 0) workout.value.muscleGroups.splice(idx, 1)
  else workout.value.muscleGroups.push(id)
}

function addEntry() {
  workout.value.entries.push({
    id: nanoid(),
    exerciseId: '',
    sets: [{ reps: 15, weight: 0 }],
  })
}

function addSuperset() {
  const groupId = nanoid(8)
  workout.value.entries.push(
    { id: nanoid(), exerciseId: '', sets: [{ reps: 15, weight: 0 }], supersetGroupId: groupId },
    { id: nanoid(), exerciseId: '', sets: [{ reps: 15, weight: 0 }], supersetGroupId: groupId },
  )
}

function updateEntry(index: number, entry: ExerciseEntry) {
  workout.value.entries[index] = entry
}

function removeEntry(index: number) {
  workout.value.entries.splice(index, 1)
}

function getSupersetLabel(entry: ExerciseEntry, index: number): string | undefined {
  if (!entry.supersetGroupId) return undefined
  const groupEntries = workout.value.entries.filter((e) => e.supersetGroupId === entry.supersetGroupId)
  const pos = groupEntries.indexOf(entry) + 1
  return `Суперсет ${pos}/${groupEntries.length}`
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await saveWorkout(JSON.parse(JSON.stringify(workout.value)))
    await workoutStore.load()
    router.push('/')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="editor">
    <div class="editor-top">
      <button class="btn btn-back" @click="router.push('/')">← Назад</button>
      <h2 v-if="isNew">Тренировка #{{ workout.id }}</h2>
      <h2 v-else>Редактировать #{{ workout.id }}</h2>
    </div>

    <!-- Date -->
    <div class="field-row">
      <label>Дата</label>
      <input type="date" v-model="workout.date" class="date-input" />
    </div>

    <!-- Muscle Groups -->
    <div class="field-row">
      <label>Мышцы</label>
      <div class="mg-chips">
        <button
          v-for="mg in catalogStore.muscleGroups"
          :key="mg.id"
          class="chip"
          :class="{ active: workout.muscleGroups.includes(mg.id) }"
          @click="toggleMuscleGroup(mg.id)"
        >
          {{ mg.label }}
        </button>
      </div>
    </div>

    <!-- Description -->
    <div class="field-row">
      <input
        v-model="workout.description"
        placeholder="Описание тренировки..."
        class="desc-input"
      />
    </div>

    <!-- Entries -->
    <div class="entries">
      <ExerciseEntryCard
        v-for="(entry, i) in workout.entries"
        :key="entry.id"
        :entry="entry"
        :muscleGroups="workout.muscleGroups"
        :supersetLabel="getSupersetLabel(entry, i)"
        @update="updateEntry(i, $event)"
        @remove="removeEntry(i)"
      />
    </div>

    <div class="add-buttons">
      <button class="btn" @click="addEntry">+ Упражнение</button>
      <button class="btn" @click="addSuperset">+ Суперсет</button>
    </div>

    <button class="btn btn-save" @click="save" :disabled="saving">
      {{ saving ? 'Сохраняю...' : '💾 Сохранить' }}
    </button>
  </div>
</template>

<style scoped>
.editor {
  padding-bottom: 40px;
}

.editor-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-top h2 {
  margin: 0;
  font-size: 1.1rem;
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

.btn-back {
  padding: 4px 12px;
  font-size: 0.85rem;
}

.btn-save {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: #2a7a4a;
  border-color: #2a7a4a;
  font-size: 1rem;
  font-weight: bold;
}

.btn-save:hover {
  background: #3a8a5a;
}

.btn-save:disabled {
  opacity: 0.5;
}

.field-row {
  margin-bottom: 10px;
}

.field-row label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 4px;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.95rem;
}

.desc-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.mg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 4px 12px;
  border: 1px solid #444;
  border-radius: 16px;
  background: #2a2a2a;
  color: #ccc;
  cursor: pointer;
  font-size: 0.85rem;
}

.chip:hover {
  border-color: #5a8;
}

.chip.active {
  background: #2a7a4a;
  border-color: #2a7a4a;
  color: #fff;
}

.entries {
  margin: 12px 0;
}

.add-buttons {
  display: flex;
  gap: 8px;
}
</style>
