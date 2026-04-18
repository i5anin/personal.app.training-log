<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { suggestExercises } from '@/suggestions'

const props = defineProps<{
  modelValue: string
  muscleGroups: string[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()
const query = ref('')
const isOpen = ref(false)
const inputEl = ref<HTMLInputElement>()

const selectedName = computed(() => {
  const ex = catalogStore.getExerciseById(props.modelValue)
  return ex?.name || ''
})

const suggestions = computed(() => {
  const ids = suggestExercises(
    [],
    props.muscleGroups,
    catalogStore.exercises,
    workoutStore.workouts,
    query.value,
  )
  return ids.slice(0, 15).map((id) => catalogStore.getExerciseById(id)!).filter(Boolean)
})

function select(id: string) {
  emit('update:modelValue', id)
  query.value = ''
  isOpen.value = false
}

function onFocus() {
  isOpen.value = true
  query.value = ''
}

function onBlur() {
  setTimeout(() => { isOpen.value = false }, 200)
}

function addCustom() {
  if (!query.value.trim()) return
  const id = query.value.trim().toLowerCase().replace(/\s+/g, '-')
  const name = query.value.trim()
  catalogStore.addExercise({ id, name, muscleGroups: props.muscleGroups.length ? [...props.muscleGroups] : ['chest'] })
  emit('update:modelValue', id)
  query.value = ''
  isOpen.value = false
}
</script>

<template>
  <div class="exercise-selector">
    <input
      ref="inputEl"
      :value="isOpen ? query : selectedName"
      :placeholder="selectedName || 'Упражнение...'"
      @input="query = ($event.target as HTMLInputElement).value"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter.prevent="suggestions.length && suggestions[0] ? select(suggestions[0].id) : addCustom()"
      class="ex-input"
    />
    <div v-if="isOpen" class="dropdown">
      <div
        v-for="ex in suggestions"
        :key="ex.id"
        class="dropdown-item"
        @mousedown.prevent="select(ex.id)"
      >
        <span class="ex-name">{{ ex.name }}</span>
        <span class="ex-groups">{{
          ex.muscleGroups
            .map(id => catalogStore.muscleGroups.find(mg => mg.id === id)?.label ?? id)
            .join(', ')
        }}</span>
      </div>
      <div v-if="query && suggestions.length === 0" class="dropdown-item add-new" @mousedown.prevent="addCustom()">
        + Добавить "{{ query }}"
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-selector {
  position: relative;
}

.ex-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #222;
  border: 1px solid #444;
  border-radius: 6px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-item {
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background: #333;
}

.ex-name {
  color: #eee;
}

.ex-groups {
  color: #888;
  font-size: 0.75rem;
}

.add-new {
  color: #5a8;
  font-style: italic;
}
</style>
