<script setup lang="ts">
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ExerciseEntry, SetRow } from '@/types'
import ExerciseSelector from './ExerciseSelector.vue'
import SetRowInput from './SetRowInput.vue'
import PhotoAttach from './PhotoAttach.vue'

const props = defineProps<{
  entry: ExerciseEntry
  muscleGroups: string[]
  supersetLabel?: string
}>()
const emit = defineEmits<{
  update: [entry: ExerciseEntry]
  remove: []
}>()

function updateExercise(id: string) {
  emit('update', { ...props.entry, exerciseId: id })
}

function updateSet(index: number, set: SetRow) {
  const sets = [...props.entry.sets]
  sets[index] = set
  emit('update', { ...props.entry, sets })
}

function addSet() {
  const lastSet = props.entry.sets[props.entry.sets.length - 1]
  const newSet: SetRow = lastSet ? { reps: lastSet.reps, weight: lastSet.weight } : { reps: 15, weight: 0 }
  emit('update', { ...props.entry, sets: [...props.entry.sets, newSet] })
}

function addBurnout() {
  const lastSet = props.entry.sets[props.entry.sets.length - 1]
  const newSet: SetRow = lastSet
    ? { reps: lastSet.reps, weight: Math.round(lastSet.weight * 0.7 * 2) / 2, isBurnout: true }
    : { reps: 15, weight: 0, isBurnout: true }
  emit('update', { ...props.entry, sets: [...props.entry.sets, newSet] })
}

function removeSet(index: number) {
  const sets = props.entry.sets.filter((_, i) => i !== index)
  emit('update', { ...props.entry, sets })
}

function updateDescription(val: string) {
  emit('update', { ...props.entry, description: val || undefined })
}

function updatePhotos(ids: string[]) {
  emit('update', { ...props.entry, photoIds: ids.length ? ids : undefined })
}
</script>

<template>
  <div class="entry-card" :class="{ 'in-superset': supersetLabel }">
    <div v-if="supersetLabel" class="superset-badge">{{ supersetLabel }}</div>
    <div class="entry-header">
      <ExerciseSelector
        :modelValue="entry.exerciseId"
        @update:modelValue="updateExercise"
        :muscleGroups="muscleGroups"
      />
      <button class="remove-entry" @click="emit('remove')">🗑</button>
    </div>

    <div class="sets">
      <SetRowInput
        v-for="(set, i) in entry.sets"
        :key="i"
        :modelValue="set"
        @update:modelValue="updateSet(i, $event)"
        @remove="removeSet(i)"
        :exerciseId="entry.exerciseId"
        :index="i"
      />
      <div class="set-buttons">
        <button class="btn btn-add-set" @click="addSet">+ подход</button>
        <button class="btn btn-add-set btn-burnout" @click="addBurnout">+ добивка</button>
      </div>
    </div>

    <div class="extras">
      <input
        :value="entry.description || ''"
        @input="updateDescription(($event.target as HTMLInputElement).value)"
        placeholder="Заметка..."
        class="note-input"
      />
      <PhotoAttach :photoIds="entry.photoIds || []" @update="updatePhotos" />
    </div>
  </div>
</template>

<style scoped>
.entry-card {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.in-superset {
  border-left: 3px solid #5a8;
}

.superset-badge {
  font-size: 0.7rem;
  color: #5a8;
  margin-bottom: 4px;
  font-weight: bold;
}

.entry-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.entry-header > :first-child {
  flex: 1;
}

.remove-entry {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.sets {
  margin-bottom: 6px;
}

.btn-add-set {
  padding: 3px 12px;
  border: 1px dashed #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 4px;
}

.btn-add-set:hover {
  border-color: #5a8;
  color: #5a8;
}

.set-buttons {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.btn-burnout {
  border-color: #c84;
  color: #c84;
}

.btn-burnout:hover {
  border-color: #da5 !important;
  color: #da5 !important;
}

.extras {
  display: flex;
  gap: 8px;
  align-items: center;
}

.note-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #151515;
  color: #ccc;
  font-size: 0.8rem;
}
</style>
