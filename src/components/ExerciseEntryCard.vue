<script setup lang="ts">
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ExerciseEntry, SetRow } from '@/types'
import ExerciseSelector from './ExerciseSelector.vue'
import SetCell from './SetCell.vue'
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

// Группируем подходы: каждый столбец = основной сет + N добивок после него
interface BurnoutEntry { set: SetRow; idx: number }
interface SetCol {
  main: SetRow
  mainIdx: number
  burnouts: BurnoutEntry[]
}

const setColumns = computed<SetCol[]>(() => {
  const cols: SetCol[] = []
  const sets = props.entry.sets
  let i = 0
  while (i < sets.length) {
    const s = sets[i]
    if (!s.isBurnout) {
      const col: SetCol = { main: s, mainIdx: i, burnouts: [] }
      i++
      while (i < sets.length && sets[i].isBurnout) {
        col.burnouts.push({ set: sets[i], idx: i })
        i++
      }
      cols.push(col)
    } else {
      cols.push({ main: s, mainIdx: i, burnouts: [] })
      i++
    }
  }
  return cols
})

const maxBurnouts = computed(() => Math.max(0, ...setColumns.value.map(c => c.burnouts.length)))
const hasBurnouts  = computed(() => maxBurnouts.value > 0)

function updateSet(index: number, set: SetRow) {
  const sets = [...props.entry.sets]
  sets[index] = set
  emit('update', { ...props.entry, sets })
}

function removeSet(index: number) {
  const sets = props.entry.sets.filter((_, i) => i !== index)
  emit('update', { ...props.entry, sets })
}

function addSet() {
  const last = props.entry.sets.filter(s => !s.isBurnout).at(-1)
  const newSet: SetRow = last ? { reps: last.reps, weight: last.weight } : { reps: 15, weight: 0 }
  emit('update', { ...props.entry, sets: [...props.entry.sets, newSet] })
}

function addBurnout() {
  // Добивка добавляется после последнего основного сета
  const sets = [...props.entry.sets]
  const lastMainIdx = [...sets].map((s, i) => (!s.isBurnout ? i : -1)).filter(i => i >= 0).at(-1) ?? sets.length - 1
  const lastMain = sets[lastMainIdx]
  const newBurnout: SetRow = lastMain
    ? { reps: lastMain.reps, weight: Math.round(lastMain.weight * 0.7 * 2) / 2, isBurnout: true }
    : { reps: 15, weight: 0, isBurnout: true }
  // Вставляем сразу после последнего основного
  sets.splice(lastMainIdx + 1, 0, newBurnout)
  emit('update', { ...props.entry, sets })
}

function addBurnoutToCol(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  // Вставляем после последней добивки этого столбца (или после основного, если добивок нет)
  const ref = col.burnouts.at(-1) ?? { set: col.main, idx: col.mainIdx }
  const nb: SetRow = {
    reps: ref.set.reps,
    weight: Math.round(ref.set.weight * 0.7 * 2) / 2,
    isBurnout: true,
  }
  const sets = [...props.entry.sets]
  sets.splice(ref.idx + 1, 0, nb)
  emit('update', { ...props.entry, sets })
}

function updateExercise(id: string) { emit('update', { ...props.entry, exerciseId: id }) }
function setBarWeight(w: number) {
  const cur = props.entry.barWeight ?? 0
  emit('update', { ...props.entry, barWeight: cur === w ? 0 : w })
}
function updateDescription(val: string) { emit('update', { ...props.entry, description: val || undefined }) }
function updatePhotos(ids: string[]) { emit('update', { ...props.entry, photoIds: ids.length ? ids : undefined }) }
</script>

<template>
  <div class="entry-card" :class="{ 'in-superset': supersetLabel }">

    <!-- Заголовок -->
    <div class="entry-header">
      <span v-if="index !== undefined" class="entry-num">{{ index + 1 }}.</span>
      <div class="ex-selector-wrap">
        <ExerciseSelector
          :modelValue="entry.exerciseId"
          @update:modelValue="updateExercise"
          :muscleGroups="muscleGroups"
        />
      </div>
      <span v-if="supersetLabel" class="superset-badge">{{ supersetLabel }}</span>
      <button class="remove-entry" @click="emit('remove')">🗑</button>
    </div>

    <!-- Вес штанги -->
    <div class="bar-row">
      <span class="bar-label">Штанга:</span>
      <button v-for="w in [12, 20]" :key="w" class="bar-btn"
        :class="{ active: entry.barWeight === w }" @click="setBarWeight(w)">{{ w }} кг</button>
      <span v-if="entry.barWeight" class="bar-hint">+ {{ entry.barWeight }} кг</span>
    </div>

    <!-- Таблица подходов -->
    <div class="sets-wrap">
      <table class="sets-table">
        <thead>
          <tr>
            <th v-for="(col, ci) in setColumns" :key="ci" class="th-num">{{ ci + 1 }}</th>
            <th class="th-add">
              <button class="add-col-btn" @click="addSet" title="+ подход">+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Основные подходы -->
          <tr class="main-row">
            <td v-for="(col, ci) in setColumns" :key="ci" class="td-main">
              <SetCell
                :modelValue="col.main"
                :exerciseId="entry.exerciseId"
                :barWeight="entry.barWeight ?? 0"
                @update:modelValue="updateSet(col.mainIdx, $event)"
                @remove="removeSet(col.mainIdx)"
              />
            </td>
            <td></td>
          </tr>

          <!-- Строки добивок -->
          <tr v-for="ri in maxBurnouts" :key="'b' + ri" class="burnout-row">
            <td v-for="(col, ci) in setColumns" :key="ci"
              class="td-burnout" :class="{ filled: !!col.burnouts[ri - 1] }">
              <!-- Данные добивки -->
              <SetCell
                v-if="col.burnouts[ri - 1]"
                :modelValue="col.burnouts[ri - 1].set"
                :exerciseId="entry.exerciseId"
                :barWeight="entry.barWeight ?? 0"
                @update:modelValue="updateSet(col.burnouts[ri - 1].idx, $event)"
                @remove="removeSet(col.burnouts[ri - 1].idx)"
              />
              <!-- ↳ кнопка в пустой ячейке — сюда добавится добивка -->
              <button
                v-else-if="ri - 1 === col.burnouts.length"
                class="add-burnout-here td-hint"
                @click="addBurnoutToCol(ci)">↳</button>
            </td>
            <td></td>
          </tr>
          <!-- Последняя строка: ↳ только для колонок, уже полностью заполненных -->
          <tr class="burnout-hint-row">
            <td v-for="(col, ci) in setColumns" :key="ci" class="td-burnout td-hint">
              <button
                v-if="col.burnouts.length === maxBurnouts"
                class="add-burnout-here"
                @click="addBurnoutToCol(ci)">↳</button>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="table-actions">
        <button class="btn btn-add" @click="addSet">+ подход</button>
      </div>
    </div>

    <!-- Заметка + фото -->
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
  padding: 7px 10px;
  margin-bottom: 6px;
}

.in-superset { border-left: 3px solid #5a8; }

.entry-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.entry-num {
  font-size: 0.8rem;
  font-weight: bold;
  color: #5a8;
  flex-shrink: 0;
  min-width: 18px;
}

.ex-selector-wrap { flex: 1; }

.superset-badge {
  font-size: 0.7rem;
  color: #5a8;
  font-weight: bold;
  white-space: nowrap;
}

.remove-entry {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  flex-shrink: 0;
}

/* Штанга */
.bar-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}
.bar-label { font-size: 0.72rem; color: #555; }
.bar-btn {
  padding: 2px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #222;
  color: #888;
  cursor: pointer;
  font-size: 0.75rem;
}
.bar-btn:hover { border-color: #888; color: #ccc; }
.bar-btn.active { border-color: #c8a; background: #3a2a1a; color: #c8a; }
.bar-hint { font-size: 0.7rem; color: #c8a; }

/* Таблица */
.sets-wrap { margin-bottom: 4px; }

.sets-table {
  border-collapse: collapse;
  width: auto;
}

.th-num {
  font-size: 0.7rem;
  color: #5a8;
  font-weight: bold;
  text-align: center;
  padding: 1px 4px 3px;
  min-width: 0;
}

.th-add { width: 24px; padding: 0 2px; }

.add-col-btn {
  background: none;
  border: 1px dashed #444;
  border-radius: 4px;
  color: #555;
  cursor: pointer;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  line-height: 1;
}
.add-col-btn:hover { border-color: #5a8; color: #5a8; }

/* Основные ячейки */
.td-main {
  padding: 1px 3px;
  vertical-align: middle;
  white-space: nowrap;
}

/* Добивки */
.td-burnout {
  padding: 1px 3px;
  vertical-align: middle;
  white-space: nowrap;
}

.td-burnout.filled {
  background: #1e1400;
  border-top: 1px solid #3a2a00;
}

.add-burnout-here {
  background: none;
  border: 1px dashed #4a3a00;
  border-radius: 4px;
  color: #5a4a00;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 6px;
  width: 100%;
}
.add-burnout-here:hover { border-color: #c84; color: #c84; }

.td-hint { opacity: 0.25; transition: opacity 0.15s; }
.td-hint:hover { opacity: 1; }

/* Кнопки под таблицей */
.table-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.btn-add {
  padding: 3px 12px;
  border: 1px dashed #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-add:hover { border-color: #5a8; color: #5a8; }
.btn-burnout { border-color: #c84; color: #c84; }
.btn-burnout:hover { border-color: #da5 !important; color: #da5 !important; }

/* Заметка */
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
