<script setup lang="ts">
import { computed } from 'vue'
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

const repsSuggestions = computed(() => suggestReps(props.exerciseId, workoutStore.workouts))
const weightSugg = computed(() => suggestWeight(props.exerciseId, workoutStore.workouts))

function update(field: keyof SetRow, val: string) {
  const num = parseFloat(val) || 0
  emit('update:modelValue', { ...props.modelValue, [field]: num })
}

function applyReps(r: number) {
  emit('update:modelValue', { ...props.modelValue, reps: r })
}

function applyWeight() {
  if (weightSugg.value.last > 0) {
    emit('update:modelValue', { ...props.modelValue, weight: weightSugg.value.last })
  }
}
</script>

<template>
  <div class="set-row">
    <span class="set-num">{{ index + 1 }}.</span>
    <div class="field">
      <input
        type="number"
        :value="modelValue.reps || ''"
        @input="update('reps', ($event.target as HTMLInputElement).value)"
        placeholder="15"
        class="num-input"
      />
      <span class="label">повт</span>
    </div>
    <span class="x">×</span>
    <div class="field">
      <input
        type="number"
        :value="modelValue.weight || ''"
        @input="update('weight', ($event.target as HTMLInputElement).value)"
        :placeholder="weightSugg.last ? String(weightSugg.last) : '0'"
        class="num-input"
        @focus="!modelValue.weight && applyWeight()"
      />
      <span class="label">кг</span>
    </div>
    <button class="remove-btn" @click="emit('remove')">✕</button>
  </div>
  <div class="chips" v-if="index === 0 && repsSuggestions.length > 0">
    <button
      v-for="r in repsSuggestions.slice(0, 5)"
      :key="r"
      class="chip"
      :class="{ active: modelValue.reps === r }"
      @click="applyReps(r)"
    >
      {{ r }}
    </button>
  </div>
</template>

<style scoped>
.set-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.set-num {
  color: #888;
  font-size: 0.8rem;
  width: 20px;
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

.chips {
  display: flex;
  gap: 4px;
  margin: 2px 0 6px 26px;
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
</style>
