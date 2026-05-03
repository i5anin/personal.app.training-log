<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import type { ExerciseEntry, SetRow } from '@/types'
import ExerciseSelector from './ExerciseSelector.vue'
import SetCell from './SetCell.vue'
import PhotoAttach from './PhotoAttach.vue'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Trash2, Clock, CornerDownRight, Plus } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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

const workoutStore = useWorkoutStore()

// Авто-заполнение из последней тренировки при выборе упражнения
watch(() => props.entry.exerciseId, (newId) => {
  if (!newId) return
  const allEmpty = props.entry.sets.every(s => !s.weight && !s.reps)
  if (!allEmpty) return // уже заполнено — не перезаписываем
  for (const w of workoutStore.workouts) {
    const found = w.entries?.find((e: ExerciseEntry) => e.exerciseId === newId)
    if (found?.sets?.length) {
      emit('update', { ...props.entry, sets: found.sets.map((s: SetRow) => ({ ...s })) })
      return
    }
  }
})

// Для фокуса на последнем добавленном set
const setCellRefs = ref<Record<number, { focusWeight?: () => void }>>({})
function registerSetCell(idx: number, el: any) {
  if (el) setCellRefs.value[idx] = el
}

// Enter в последнем set → добавляем новый подход с теми же значениями
function onNextSet(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  const newSet: SetRow = { reps: col.main.reps, weight: col.main.weight }
  const newSets = [...props.entry.sets, newSet]
  emit('update', { ...props.entry, sets: newSets })
  // Фокус на новый подход после рендера
  nextTick(() => {
    const lastIdx = newSets.length - 1
    const cellEl = document.querySelector<HTMLInputElement>(
      `.entry-card [data-set-idx="${lastIdx}"] input[type=number]`
    )
    cellEl?.focus(); cellEl?.select()
  })
}

// Максимальный 1RM по формуле Эпли — только рабочие подходы (не разминка, не добивка)
const maxOneRM = computed(() => {
  let best = 0
  for (const s of props.entry.sets) {
    if (s.isWarmup || s.isBurnout || !s.weight || !s.reps) continue
    const orm = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30)
    if (orm > best) best = orm
  }
  return best > 0 ? Math.round(best) : null
})

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

function toggleWarmupCol(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  const sets = [...props.entry.sets]
  const willBeWarmup = !sets[col.mainIdx].isWarmup

  // Индексы колонки (основной + добивки), по возрастанию
  const indices = [col.mainIdx, ...col.burnouts.map((b) => b.idx)].sort((a, b) => a - b)

  // Вырезаем колонку, помечая isWarmup
  const extracted = indices.map((i) => ({ ...sets[i], isWarmup: willBeWarmup }))
  for (let i = indices.length - 1; i >= 0; i--) sets.splice(indices[i], 1)

  // Вставляем сразу после последней разминки —
  // делает колонку либо последней разминкой, либо первой рабочей
  let insertAt = 0
  for (let i = 0; i < sets.length; i++) {
    if (sets[i].isWarmup) insertAt = i + 1
  }
  sets.splice(insertAt, 0, ...extracted)

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

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m < 60) return sec > 0 ? `${m}м ${sec}с` : `${m}м`
  const h = Math.floor(m / 60)
  return `${h}ч ${m % 60}м`
}

function createdAtLabel(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
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

      <!-- Заметка -->
      <input
        :value="entry.description || ''"
        @input="updateDescription(($event.target as HTMLInputElement).value)"
        placeholder="Заметка..."
        class="note-input"
      />

      <!-- Фото -->
      <PhotoAttach :photoIds="entry.photoIds || []" @update="updatePhotos" />

      <!-- Вес штанги -->
      <div class="bar-row">
        <span class="bar-label">Штанга:</span>
        <button v-for="w in [12, 20]" :key="w" class="bar-btn"
          :class="{ active: entry.barWeight === w }" @click="setBarWeight(w)">{{ w }}</button>
      </div>

      <Tooltip v-if="entry.totalEditMs != null && entry.totalEditMs > 0">
        <TooltipTrigger as-child>
          <span class="entry-time">
            <Clock class="size-3" />{{ formatMs(entry.totalEditMs) }}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {{ entry.createdAt ? 'Создано: ' + createdAtLabel(entry.createdAt) : 'Время редактирования' }}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button class="remove-entry" @click="emit('remove')"><Trash2 class="size-4" /></button>
        </TooltipTrigger>
        <TooltipContent>Удалить упражнение</TooltipContent>
      </Tooltip>
    </div>

    <!-- Таблица подходов -->
    <div class="sets-wrap">
      <table class="sets-table">
        <tbody>
          <!-- Основные подходы: метка «Р/N» слева внутри ячейки -->
          <tr class="main-row">
            <td v-for="(col, ci) in setColumns" :key="ci" class="td-main" :data-set-idx="col.mainIdx">
              <div class="cell-with-label">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="col-toggle"
                      :class="{ 'is-warmup': col.main.isWarmup }"
                      @click="toggleWarmupCol(ci)"
                    >
                      {{ col.main.isWarmup ? 'Р' : ci + 1 - setColumns.slice(0, ci).filter(c => c.main.isWarmup).length }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {{ col.main.isWarmup ? 'Сделать рабочим' : 'Сделать разминкой' }}
                  </TooltipContent>
                </Tooltip>
                <SetCell
                  :modelValue="col.main"
                  :exerciseId="entry.exerciseId"
                  :barWeight="entry.barWeight ?? 0"
                  @update:modelValue="updateSet(col.mainIdx, $event)"
                  @remove="removeSet(col.mainIdx)"
                  @next-set="onNextSet(ci)"
                />
              </div>
            </td>
            <td class="td-add-col">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button class="add-col-btn" @click="addSet"><Plus class="size-4" /></button>
                </TooltipTrigger>
                <TooltipContent>Добавить подход</TooltipContent>
              </Tooltip>
            </td>
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
                @click="addBurnoutToCol(ci)"><CornerDownRight class="size-3" /></button>
            </td>
            <td></td>
          </tr>
          <!-- Последняя строка: ↳ только для колонок, уже полностью заполненных -->
          <tr class="burnout-hint-row">
            <td v-for="(col, ci) in setColumns" :key="ci" class="td-burnout td-hint">
              <button
                v-if="col.burnouts.length === maxBurnouts"
                class="add-burnout-here"
                @click="addBurnoutToCol(ci)"><CornerDownRight class="size-3" /></button>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
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
  gap: 10px;
  margin-bottom: 8px;
}

.entry-num {
  font-size: 0.8rem;
  font-weight: bold;
  color: #5a8;
  flex-shrink: 0;
  min-width: 18px;
}

.ex-selector-wrap { flex: 2; min-width: 200px; }

.superset-badge {
  font-size: 0.7rem;
  color: #5a8;
  font-weight: bold;
  white-space: nowrap;
}

.orm-head {
  font-size: 0.68rem;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: default;
  padding: 1px 4px;
  border: 1px solid #333;
  border-radius: 3px;
}

.entry-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #5a8;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: default;
  padding: 2px 6px;
  border: 1px solid #1f3a2a;
  border-radius: 4px;
  background: #0f1a14;
}

.remove-entry {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #555;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}
.remove-entry:hover { color: #d55; background: #2a1a1a; }

/* Штанга — компактный блок в шапке */
.bar-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}
.bar-label { font-size: 0.7rem; color: #666; }
.bar-btn {
  padding: 1px 7px;
  border: 1px solid #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 0.72rem;
  line-height: 1.3;
}
.bar-btn:hover { border-color: #888; color: #ccc; }
.bar-btn.active { border-color: #c8a; background: #3a2a1a; color: #c8a; }

/* Таблица */
.sets-wrap { margin-bottom: 4px; }

.sets-table {
  border-collapse: collapse;
  width: auto;
}

.cell-with-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.col-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #5a8;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.col-toggle:hover {
  border-color: #2a4a3a;
  background: rgba(90, 170, 136, 0.08);
}
.col-toggle.is-warmup {
  color: #6ab4e8;
  border-color: #2a4a6a;
  background: rgba(74, 138, 184, 0.12);
}
.col-toggle.is-warmup:hover {
  background: rgba(74, 138, 184, 0.20);
}

.td-add-col { width: 32px; padding: 0 4px; vertical-align: middle; }

.add-col-btn {
  background: none;
  border: 1px dashed #3a3a3a;
  border-radius: 6px;
  color: #555;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.add-col-btn:hover {
  border-color: #5a8;
  color: #5a8;
  background: rgba(90, 170, 136, 0.08);
}

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

/* Заметка в шапке */
.note-input {
  flex: 1;
  min-width: 100px;
  padding: 4px 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #151515;
  color: #ccc;
  font-size: 0.8rem;
}
</style>
