<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SetRow } from '@/types'
import { useWorkoutStore } from '@/stores/workoutStore'
import { suggestReps, suggestWeight } from '@/suggestions'

const props = defineProps<{
  modelValue: SetRow
  exerciseId: string
  barWeight?: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: SetRow]
  remove: []
  'next-set': []
}>()

const workoutStore = useWorkoutStore()
const weightSugg = computed(() => suggestWeight(props.exerciseId, workoutStore.workouts))
const repsSugg  = computed(() => suggestReps(props.exerciseId, workoutStore.workouts))

// 1RM по формуле Эпли: w × (1 + r/30), при r=1 → само значение
const oneRM = computed(() => {
  const w = props.modelValue.weight
  const r = props.modelValue.reps
  if (!w || !r) return null
  if (r === 1) return w
  return Math.round(w * (1 + r / 30))
})

// Refs for focus management
const weightInputRef = ref<HTMLInputElement>()
const repsInputRef   = ref<HTMLInputElement>()

// Weight combobox
const weightOpen  = ref(false)
const weightQuery = ref('')
const filteredWeights = computed(() => {
  const q = weightQuery.value
  return q ? weightSugg.value.all.filter(w => String(w).includes(q)) : weightSugg.value.all
})
function onWeightFocus() { weightQuery.value = props.modelValue.weight ? String(props.modelValue.weight) : ''; weightOpen.value = true }
function onWeightInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  weightQuery.value = v; weightOpen.value = true
  emit('update:modelValue', { ...props.modelValue, weight: parseFloat(v) || 0 })
}
function onWeightBlur() { setTimeout(() => { weightOpen.value = false }, 150) }
function pickWeight(w: number) { weightQuery.value = String(w); weightOpen.value = false; emit('update:modelValue', { ...props.modelValue, weight: w }) }
function onWeightEnter() {
  weightOpen.value = false
  repsInputRef.value?.focus()
  repsInputRef.value?.select()
}

// Reps combobox
const repsOpen  = ref(false)
const repsQuery = ref('')
const filteredReps = computed(() => {
  const q = repsQuery.value
  return q ? repsSugg.value.filter(r => String(r).includes(q)) : repsSugg.value
})
function onRepsFocus() { repsQuery.value = props.modelValue.reps ? String(props.modelValue.reps) : ''; repsOpen.value = true }
function onRepsInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  repsQuery.value = v; repsOpen.value = true
  emit('update:modelValue', { ...props.modelValue, reps: parseFloat(v) || 0 })
}
function onRepsBlur() { setTimeout(() => { repsOpen.value = false }, 150) }
function pickReps(r: number) { repsQuery.value = String(r); repsOpen.value = false; emit('update:modelValue', { ...props.modelValue, reps: r }) }
function onRepsEnter() {
  repsOpen.value = false
  emit('next-set')
}
</script>

<template>
  <div class="set-cell" :class="{ burnout: modelValue.isBurnout, warmup: modelValue.isWarmup }">
    <!-- Разминка-тоггл -->
    <button
      class="warmup-btn"
      :class="{ active: modelValue.isWarmup }"
      title="Разминка"
      @click="emit('update:modelValue', { ...modelValue, isWarmup: !modelValue.isWarmup })"
    >Р</button>
    <!-- weight -->
    <div class="combo">
      <input
        ref="weightInputRef"
        type="number"
        :value="modelValue.weight || ''"
        :placeholder="weightSugg.last ? String(weightSugg.last) : '0'"
        class="cell-input"
        @input="onWeightInput"
        @focus="onWeightFocus"
        @blur="onWeightBlur"
        @keydown.enter.prevent="onWeightEnter"
      />
      <div class="dropdown" v-if="weightOpen && filteredWeights.length">
        <button v-for="w in filteredWeights" :key="w" class="dd-item"
          :class="{ active: modelValue.weight === w }"
          @mousedown.prevent="pickWeight(w)">{{ w }}</button>
      </div>
    </div>

    <span class="sep">×</span>

    <!-- reps -->
    <div class="combo">
      <input
        ref="repsInputRef"
        type="number"
        :value="modelValue.reps || ''"
        placeholder="15"
        class="cell-input"
        @input="onRepsInput"
        @focus="onRepsFocus"
        @blur="onRepsBlur"
        @keydown.enter.prevent="onRepsEnter"
      />
      <div class="dropdown" v-if="repsOpen && filteredReps.length">
        <button v-for="r in filteredReps" :key="r" class="dd-item"
          :class="{ active: modelValue.reps === r }"
          @mousedown.prevent="pickReps(r)">{{ r }}</button>
      </div>
    </div>

    <span v-if="barWeight && modelValue.weight" class="real-w">={{ modelValue.weight + barWeight }}</span>
    <button class="rm" @click="emit('remove')">✕</button>
  </div>
</template>

<style scoped>
.set-cell {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px;
  border-radius: 4px;
  position: relative;
}

.set-cell.burnout {
  background: #2a1e00;
}

.set-cell.warmup {
  background: #0e1e2a;
}

.warmup-btn {
  background: none;
  border: 1px solid #2a3a4a;
  border-radius: 3px;
  color: #334455;
  cursor: pointer;
  font-size: 0.62rem;
  font-weight: bold;
  padding: 0 3px;
  line-height: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: color 0.1s, border-color 0.1s, background 0.1s;
}
.warmup-btn:hover { border-color: #4a8ab8; color: #4a8ab8; }
.warmup-btn.active { border-color: #4a8ab8; background: #1a3a5a; color: #6ab4e8; }

.combo {
  position: relative;
}

.cell-input {
  width: 42px;
  padding: 2px 3px;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  background: #121212;
  color: #eee;
  font-size: 0.88rem;
  text-align: center;
}

.cell-input::-webkit-inner-spin-button,
.cell-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.cell-input:focus { outline: none; border-color: #5a8; }

.sep { color: #555; font-size: 0.8rem; }

.real-w {
  color: #c8a;
  font-size: 0.65rem;
  white-space: nowrap;
}

.orm-badge {
  color: #888;
  font-size: 0.62rem;
  white-space: nowrap;
  cursor: default;
  padding: 0 1px;
}

.rm {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  padding: 0 2px;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.rm:hover { color: #a33; }

.dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 60px;
  background: #222;
  border: 1px solid #555;
  border-radius: 6px;
  z-index: 300;
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6);
}

.dd-item {
  display: block;
  width: 100%;
  padding: 5px 10px;
  background: none;
  border: none;
  border-bottom: 1px solid #333;
  color: #ccc;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
}
.dd-item:last-child { border-bottom: none; }
.dd-item:hover { background: #2a3a4a; color: #fff; }
.dd-item.active { background: #2a5a8a; color: #fff; }
</style>
