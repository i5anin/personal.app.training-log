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
  index?: number
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

function setBarWeight(w: number) {
  const cur = props.entry.barWeight ?? 0
  emit('update', { ...props.entry, barWeight: cur === w ? 0 : w })
}

function updatePhotos(ids: string[]) {
  emit('update', { ...props.entry, photoIds: ids.length ? ids : undefined })
}
</script>

<template>
  <div class="entry-card" :class="{ 'in-superset': supersetLabel }">
    <div class="entry-header-top">
      <span v-if="index !== undefined" class="entry-num">{{ index + 1 }}.</span>
      <span v-if="supersetLabel" class="superset-badge">{{ supersetLabel }}</span>
    </div>
    <div class="entry-header">
      <ExerciseSelector
        :modelValue="entry.exerciseId"
        @update:modelValue="updateExercise"
        :muscleGroups="muscleGroups"
      />
      <button class="remove-entry" @click="emit('remove')">🗑</button>
    </div>

    <!-- Вес штанги -->
    <div class="bar-row">
      <span class="bar-label">Штанга:</span>
      <button
        v-for="w in [12, 20]"
        :key="w"
        class="bar-btn"
        :class="{ active: entry.barWeight === w }"
        @click="setBarWeight(w)"
      >{{ w }} кг</button>
      <span v-if="entry.barWeight" class="bar-hint">+ {{ entry.barWeight }} кг к весу</span>
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
        :barWeight="entry.barWeight ?? 0"
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

.entry-header-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.entry-num {
  font-size: 0.75rem;
  font-weight: bold;
  color: #5a8;
  background: #1a2a22;
  border: 1px solid #3a6a4a;
  border-radius: 4px;
  padding: 1px 6px;
  line-height: 1.4;
}

.in-superset {
  border-left: 3px solid #5a8;
}

.superset-badge {
  font-size: 0.7rem;
  color: #5a8;
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

.bar-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
}

.bar-label {
  font-size: 0.72rem;
  color: #555;
}

.bar-btn {
  padding: 2px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #222;
  color: #888;
  cursor: pointer;
  font-size: 0.75rem;
}

.bar-btn:hover {
  border-color: #888;
  color: #ccc;
}

.bar-btn.active {
  border-color: #c8a;
  background: #3a2a1a;
  color: #c8a;
}

.bar-hint {
  font-size: 0.7rem;
  color: #c8a;
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
