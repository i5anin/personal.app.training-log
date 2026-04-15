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
const showChips = ref(false)

const repsSuggestions = computed(() => suggestReps(props.exerciseId, workoutStore.workouts))
const weightSugg = computed(() => suggestWeight(props.exerciseId, workoutStore.workouts))

function update(field: keyof SetRow, val: string) {
  const num = parseFloat(val) || 0
  emit('update:modelValue', { ...props.modelValue, [field]: num })
}

function applyReps(r: number) {
  emit('update:modelValue', { ...props.modelValue, reps: r })
}

function applyWeight(w: number) {
  emit('update:modelValue', { ...props.modelValue, weight: w })
}

function toggleChips() {
  showChips.value = !showChips.value
}
</script>

<template>
  <div class="set-wrapper" :class="{ burnout: modelValue.isBurnout }">
    <div v-if="modelValue.isBurnout" class="burnout-marker">↳</div>
    <div class="set-row">
      <span class="set-num" @click="toggleChips">{{ index + 1 }}.</span>
      <div class="field">
        <input
          type="number"
          :value="modelValue.weight || ''"
          @input="update('weight', ($event.target as HTMLInputElement).value)"
          :placeholder="weightSugg.last ? String(weightSugg.last) : '0'"
          class="num-input"
          @focus="showChips = true; !modelValue.weight && weightSugg.last > 0 && applyWeight(weightSugg.last)"
        />
        <span class="label">кг</span>
      </div>
      <span class="x">×</span>
      <div class="field">
        <input
          type="number"
          :value="modelValue.reps || ''"
          @input="update('reps', ($event.target as HTMLInputElement).value)"
          placeholder="15"
          class="num-input"
          @focus="showChips = true"
        />
        <span class="label">повт</span>
      </div>
      <button class="remove-btn" @click="emit('remove')">✕</button>
    </div>

    <div class="chips-row" v-if="showChips">
      <!-- Weight chips -->
      <div class="chips" v-if="weightSugg.all.length > 0">
        <span class="chips-label">кг:</span>
        <button
          v-for="w in weightSugg.all.slice(0, 5)"
          :key="'w' + w"
          class="chip chip-weight"
          :class="{ active: modelValue.weight === w }"
          @click="applyWeight(w)"
        >
          {{ w }}
        </button>
      </div>
      <!-- Reps chips -->
      <div class="chips">
        <span class="chips-label">повт:</span>
        <button
          v-for="r in repsSuggestions.slice(0, 5)"
          :key="'r' + r"
          class="chip"
          :class="{ active: modelValue.reps === r }"
          @click="applyReps(r)"
        >
          {{ r }}
        </button>
      </div>
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
  cursor: pointer;
}

.set-num:hover {
  color: #5a8;
}

.field {
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

.num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
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

.chips-row {
  margin: 2px 0 6px 26px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chips {
  display: flex;
  gap: 4px;
  align-items: center;
}

.chips-label {
  color: #666;
  font-size: 0.7rem;
  width: 30px;
}

.chip {
  padding: 2px 10px;
  border: 1px solid #444;
  border-radius: 12px;
  background: #2a2a2a;
  color: #ccc;
  cursor: pointer;
  font-size: 0.8rem;
}

.chip:hover, .chip.active {
  background: #2a7a4a;
  border-color: #2a7a4a;
  color: #fff;
}

.chip-weight:hover, .chip-weight.active {
  background: #4a6a9a;
  border-color: #4a6a9a;
}
</style>
