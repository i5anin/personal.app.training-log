<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupIcon } from '@/constants/muscleGroupIcons'

const props = defineProps<{
  modelValue: string
  label: string
  disabledId?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const catalogStore = useCatalogStore()

const ADD_ID = '__add__'
const adding = ref(false)
const newName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function onSelectChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val === ADD_ID) {
    ;(e.target as HTMLSelectElement).value = props.modelValue // вернуть обратно
    adding.value = true
    setTimeout(() => inputRef.value?.focus(), 50)
  } else {
    emit('update:modelValue', val)
  }
}

async function confirm() {
  const name = newName.value.trim()
  if (!name) return cancel()
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
  await catalogStore.addMuscleGroup({ id, label: name })
  emit('update:modelValue', id)
  newName.value = ''
  adding.value = false
}

function cancel() {
  newName.value = ''
  adding.value = false
}
</script>

<template>
  <div class="mg-select-wrap">
    <label class="mg-label">{{ label }}</label>

    <template v-if="!adding">
      <select class="type-select" :value="modelValue" @change="onSelectChange">
        <option value="">— не выбрано —</option>
        <option
          v-for="mg in catalogStore.muscleGroups"
          :key="mg.id"
          :value="mg.id"
          :disabled="mg.id === disabledId"
        >{{ getMuscleGroupIcon(mg.id) }} {{ mg.label }}</option>
        <option :value="ADD_ID">＋ Добавить группу...</option>
      </select>
    </template>

    <template v-else>
      <div class="add-row">
        <input
          ref="inputRef"
          v-model="newName"
          class="add-input"
          placeholder="Название, напр. Икры"
          @keydown.enter.prevent="confirm"
          @keydown.escape.prevent="cancel"
        />
        <button class="btn-confirm" @click="confirm">✓</button>
        <button class="btn-cancel" @click="cancel">✕</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mg-select-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mg-label {
  font-size: 0.78rem;
  color: #666;
}

.type-select {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
}

.type-select:focus {
  outline: none;
  border-color: #5a8;
}

.add-row {
  display: flex;
  gap: 4px;
}

.add-input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid #5a8;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
}

.add-input:focus {
  outline: none;
}

.btn-confirm,
.btn-cancel {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.btn-confirm {
  background: #2a7a4a;
  color: #fff;
}

.btn-confirm:hover {
  background: #3a8a5a;
}

.btn-cancel {
  background: #3a2a2a;
  color: #aaa;
}

.btn-cancel:hover {
  background: #5a3a3a;
}
</style>
