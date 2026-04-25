<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SetRow } from '@/types'
import { useWorkoutStore } from '@/stores/workoutStore'
import { suggestReps, suggestWeight } from '@/suggestions'

const props = defineProps<{
  modelValue: SetRow
  exerciseId: string
  index: number
  barWeight?: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: SetRow]
  remove: []
}>()

const workoutStore = useWorkoutStore()
const weightSugg = computed(() => suggestWeight(props.exerciseId, workoutStore.workouts))
const repsSugg = computed(() => suggestReps(props.exerciseId, workoutStore.workouts))

// --- Weight combobox ---
const weightOpen = ref(false)
const weightQuery = ref('')

const filteredWeights = computed(() => {
  const q = weightQuery.value
  if (!q) return weightSugg.value.all
  return weightSugg.value.all.filter((w) => String(w).includes(q))
})

function onWeightFocus() {
  weightQuery.value = props.modelValue.weight ? String(props.modelValue.weight) : ''
  weightOpen.value = true
}

function onWeightInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  weightQuery.value = val
  weightOpen.value = true
  emit('update:modelValue', { ...props.modelValue, weight: parseFloat(val) || 0 })
}

function onWeightBlur() {
  setTimeout(() => { weightOpen.value = false }, 150)
}

function pickWeight(w: number) {
  weightQuery.value = String(w)
  weightOpen.value = false
  emit('update:modelValue', { ...props.modelValue, weight: w })
}

// --- Reps combobox ---
const repsOpen = ref(false)
const repsQuery = ref('')

const filteredReps = computed(() => {
  const q = repsQuery.value
  if (!q) return repsSugg.value
  return repsSugg.value.filter((r) => String(r).includes(q))
})

function onRepsFocus() {
  repsQuery.value = props.modelValue.reps ? String(props.modelValue.reps) : ''
  repsOpen.value = true
}

function onRepsInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  repsQuery.value = val
  repsOpen.value = true
  emit('update:modelValue', { ...props.modelValue, reps: parseFloat(val) || 0 })
}

function onRepsBlur() {
  setTimeout(() => { repsOpen.value = false }, 150)
}

function pickReps(r: number) {
  repsQuery.value = String(r)
  repsOpen.value = false
  emit('update:modelValue', { ...props.modelValue, reps: r })
}
</script>

<template>
  <div class="set-wrapper" :class="{ burnout: modelValue.isBurnout }">
    <div v-if="modelValue.isBurnout" class="burnout-marker">↳</div>

    <span class="set-num">{{ index + 1 }}</span>

    <!-- Weight combobox -->
    <div class="combo">
      <input
        type="number"
        :value="modelValue.weight || ''"
        :placeholder="weightSugg.last ? String(weightSugg.last) : '0'"
        class="num-input"
        @input="onWeightInput"
        @focus="onWeightFocus"
        @blur="onWeightBlur"
      />
      <span class="label">кг</span>
      <span v-if="barWeight && modelValue.weight" class="real-weight">={{ modelValue.weight + barWeight }}</span>
      <div class="dropdown" v-if="weightOpen && filteredWeights.length > 0">
        <button
          v-for="w in filteredWeights"
          :key="w"
          class="dd-item"
          :class="{ active: modelValue.weight === w }"
          @mousedown.prevent="pickWeight(w)"
        >{{ w }}</button>
      </div>
    </div>

    <!-- Reps combobox -->
    <div class="combo">
      <input
        type="number"
        :value="modelValue.reps || ''"
        placeholder="15"
        class="num-input"
        @input="onRepsInput"
        @focus="onRepsFocus"
        @blur="onRepsBlur"
      />
      <span class="label">повт</span>
      <div class="dropdown" v-if="repsOpen && filteredReps.length > 0">
        <button
          v-for="r in filteredReps"
          :key="r"
          class="dd-item"
          :class="{ active: modelValue.reps === r }"
          @mousedown.prevent="pickReps(r)"
        >{{ r }}</button>
      </div>
    </div>

    <button class="remove-btn" @click="emit('remove')">✕</button>
  </div>
</template>

<style scoped>
/* Карточка подхода — вертикальный столбец */
.set-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #1e1e1e;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  padding: 6px 8px;
  flex-shrink: 0;
  min-width: 64px;
}

.set-wrapper.burnout {
  border-color: #c84;
  background: #1e1800;
}

.burnout-marker {
  color: #c84;
  font-size: 0.65rem;
  line-height: 1;
}

.set-num {
  color: #5a8;
  font-size: 0.72rem;
  font-weight: bold;
}

.combo {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.num-input {
  width: 52px;
  padding: 4px 4px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #121212;
  color: #eee;
  font-size: 0.95rem;
  text-align: center;
}

.num-input::-webkit-inner-spin-button,
.num-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.num-input:focus {
  outline: none;
  border-color: #5a8;
}

.label {
  color: #555;
  font-size: 0.65rem;
}

.real-weight {
  color: #c8a;
  font-size: 0.65rem;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
  line-height: 1;
  margin-top: 2px;
}

.remove-btn:hover {
  color: #a33;
}

.dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 72px;
  background: #222;
  border: 1px solid #555;
  border-radius: 6px;
  z-index: 200;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6);
}

.dd-item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid #333;
  color: #ccc;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
}

.dd-item:last-child {
  border-bottom: none;
}

.dd-item:hover {
  background: #2a3a4a;
  color: #fff;
}

.dd-item.active {
  background: #2a5a8a;
  color: #fff;
}
</style>
