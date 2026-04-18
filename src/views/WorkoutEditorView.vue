<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import type { Workout, ExerciseEntry } from '@/types'
import { getWorkout, getNextWorkoutId, saveWorkout } from '@/db'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import ExerciseEntryCard from '@/components/ExerciseEntryCard.vue'
import MuscleGroupSelect from '@/components/MuscleGroupSelect.vue'
import MuscleGroupPhotos from '@/components/MuscleGroupPhotos.vue'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()

const loading = ref(false)
const saving = ref(false)

const isNew = computed(() => route.name === 'new-workout')

const emptyWorkout = (): Workout => ({
  id: 0,
  date: new Date().toISOString().slice(0, 10),
  muscleGroups: [],
  entries: [],
  description: '',
  primaryType: '',
  secondaryType: '',
})

const workout = ref<Workout>(emptyWorkout())

async function loadWorkout() {
  loading.value = true
  workout.value = emptyWorkout()
  try {
    if (route.name === 'edit-workout') {
      const id = Number(route.params.id)
      const existing = await getWorkout(id)
      if (existing) {
        workout.value = JSON.parse(JSON.stringify(existing))
        // Совместимость: если старые данные без primaryType — берём из muscleGroups
        if (!workout.value.primaryType && workout.value.muscleGroups.length > 0) {
          workout.value.primaryType = workout.value.muscleGroups[0]
        }
        if (!workout.value.secondaryType && workout.value.muscleGroups.length > 1) {
          workout.value.secondaryType = workout.value.muscleGroups[1]
        }
      } else {
        router.replace('/')
      }
    } else {
      workout.value.id = await getNextWorkoutId()
      const fromId = Number(route.query.from)
      if (fromId) {
        const source = await getWorkout(fromId)
        if (source) {
          workout.value.primaryType = source.primaryType || source.muscleGroups[0] || ''
          workout.value.secondaryType = source.secondaryType || source.muscleGroups[1] || ''
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
    syncMuscleGroups()
  } finally {
    loading.value = false
  }
}

watch(() => [route.name, route.params.id], loadWorkout, { immediate: true })

// Синхронизируем массив muscleGroups из двух селектов
function syncMuscleGroups() {
  const groups: string[] = []
  if (workout.value.primaryType) groups.push(workout.value.primaryType)
  if (workout.value.secondaryType && workout.value.secondaryType !== workout.value.primaryType) {
    groups.push(workout.value.secondaryType)
  }
  workout.value.muscleGroups = groups
}

watch(() => [workout.value.primaryType, workout.value.secondaryType], syncMuscleGroups)

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

function getSupersetLabel(entry: ExerciseEntry): string | undefined {
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
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="editor-layout" v-if="!loading">

    <!-- Левая колонка: форма + упражнения -->
    <div class="col-main">
      <div class="editor-top">
        <div class="id-heading">
          <span class="id-label">{{ isNew ? 'Новая тренировка' : 'Тренировка' }} #</span>
          <input
            type="number"
            class="id-input"
            v-model.number="workout.id"
            min="1"
            title="Номер тренировки"
          />
        </div>
      </div>

      <div class="form-grid">
        <!-- Дата -->
        <div class="field-row">
          <label>Дата</label>
          <input type="date" v-model="workout.date" class="date-input" />
        </div>

        <!-- Группы мышц -->
        <div class="field-row types-row">
          <MuscleGroupSelect
            :modelValue="workout.primaryType ?? ''"
            @update:modelValue="workout.primaryType = $event"
            label="Основная группа"
          />
          <MuscleGroupSelect
            :modelValue="workout.secondaryType ?? ''"
            @update:modelValue="workout.secondaryType = $event"
            label="Дополнительная группа"
            :disabledId="workout.primaryType ?? ''"
          />
        </div>

        <!-- Описание -->
        <div class="field-row">
          <input
            v-model="workout.description"
            placeholder="Описание тренировки..."
            class="desc-input"
          />
        </div>
      </div>

      <!-- Упражнения -->
      <div class="entries">
        <ExerciseEntryCard
          v-for="(entry, i) in workout.entries"
          :key="entry.id"
          :entry="entry"
          :index="i"
          :muscleGroups="workout.muscleGroups"
          :supersetLabel="getSupersetLabel(entry)"
          @update="updateEntry(i, $event)"
          @remove="removeEntry(i)"
        />
      </div>

      <div class="add-buttons">
        <button class="btn" @click="addEntry">+ Упражнение</button>
        <button class="btn" @click="addSuperset">+ Суперсет</button>
      </div>
    </div>

    <!-- Правая колонка: фото мышц (sticky) -->
    <div class="col-photos">
      <MuscleGroupPhotos
        :primaryType="workout.primaryType || ''"
        :secondaryType="workout.secondaryType || ''"
      />
    </div>

  </div>

  <div class="save-bar" v-if="!loading">
    <button class="btn btn-save" @click="save" :disabled="saving">
      {{ saving ? 'Сохраняю...' : '💾 Сохранить' }}
    </button>
  </div>

  <div class="loading" v-else>Загрузка...</div>
</template>

<style scoped>
.editor-layout {
  container-type: inline-size;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 70px;
}

.col-main {
  flex: 1;
  min-width: 0;
}

/* Фото справа только когда панель шире 560px */
.col-photos {
  display: none;
  width: 150px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

@container (min-width: 560px) {
  .col-photos {
    display: block;
  }
}

.loading {
  color: #666;
  padding: 40px;
  text-align: center;
}

.editor-top {
  margin-bottom: 20px;
}

.id-heading {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 1.3rem;
  font-weight: bold;
}

.id-label {
  white-space: nowrap;
  color: #ccc;
}

.id-input {
  width: 72px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed #555;
  color: #eee;
  font-size: 1.3rem;
  font-weight: bold;
  font-family: inherit;
  padding: 0 2px;
  -moz-appearance: textfield;
}

.id-input::-webkit-outer-spin-button,
.id-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.id-input:focus {
  outline: none;
  border-bottom-color: #5a8;
}

.form-grid {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 0.78rem;
  color: #666;
}

.types-row {
  flex-direction: row;
  gap: 12px;
}

.date-input,
.desc-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
}

.date-input:focus,
.desc-input:focus {
  outline: none;
  border-color: #5a8;
}

.date-input {
  width: auto;
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
  background: #333;
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
  cursor: default;
}

.entries {
  margin: 0 0 12px;
}

.add-buttons {
  display: flex;
  gap: 8px;
}

.save-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 280px; /* ширина левой панели */
  padding: 10px 24px;
  background: #121212;
  border-top: 1px solid #2a2a2a;
  z-index: 50;
}

.btn-save {
  width: 100%;
  max-width: 720px;
  padding: 11px;
  background: #2a7a4a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-save:hover {
  background: #3a8a5a;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
