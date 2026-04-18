<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SetRow } from '@/types'
import { useWorkoutStore } from '@/stores/workoutStore'
import { suggestReps, suggestWeight } from '@/suggestions'

const props = defineProps<{
  modelValue: SetRow
  exerciseId: string
  index: number
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
    <div class="set-row">
      <span class="set-num">{{ index + 1 }}.</span>

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

      <span class="x">×</span>

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
  </div>
</template>

<style scoped>
.set-wrapper {
  margin-bottom: 4px;
}

.set-wrapper.burnout {
  margin-left: 20px;
  border-left: 2px solid #c84;
  padding-left: 8px;
}

.burnout-marker {
  color: #c84;
  font-size: 0.7rem;
  margin-bottom: -2px;
}

.set-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.set-num {
  color: #888;
  font-size: 0.8rem;
  width: 20px;
}

.combo {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
}

.num-input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #1a1a1a;
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
  color: #888;
  font-size: 0.75rem;
}

.x {
  color: #666;
}

.remove-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 0.85rem;
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
