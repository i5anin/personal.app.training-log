<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import MgIcon from '@/components/MgIcon.vue'
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-vue-next'
import type { Exercise, MuscleGroup } from '@/types'

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()
const tab = ref<'exercises' | 'groups'>('exercises')

// ─── helpers ────────────────────────────────────────────
function slug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
}

// Подсчитываем сколько раз упражнение / группа использовались
const exerciseUsage = computed(() => {
  const m = new Map<string, number>()
  for (const w of workoutStore.workouts) {
    for (const e of (w.entries || [])) {
      m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1)
    }
  }
  return m
})

const groupUsage = computed(() => {
  const m = new Map<string, number>()
  for (const w of workoutStore.workouts) {
    for (const id of (w.muscleGroups || [])) {
      m.set(id, (m.get(id) ?? 0) + 1)
    }
  }
  return m
})

// ─── Упражнения ─────────────────────────────────────────
const exSearch = ref('')
const exFilterMg = ref('all')

const filteredExercises = computed(() => {
  const q = exSearch.value.trim().toLowerCase()
  return [...catalogStore.exercises]
    .filter((e) => exFilterMg.value === 'all' || e.muscleGroups.includes(exFilterMg.value))
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
    .sort((a, b) => (exerciseUsage.value.get(b.id) ?? 0) - (exerciseUsage.value.get(a.id) ?? 0)
                 || a.name.localeCompare(b.name))
})

async function updateExName(ex: Exercise, name: string) {
  if (!name.trim() || name === ex.name) return
  await catalogStore.addExercise({ ...ex, name: name.trim() })
}

async function toggleExMg(ex: Exercise, mgId: string) {
  const has = ex.muscleGroups.includes(mgId)
  const next = has ? ex.muscleGroups.filter((m) => m !== mgId) : [...ex.muscleGroups, mgId]
  if (next.length === 0) return // нельзя совсем без группы
  await catalogStore.addExercise({ ...ex, muscleGroups: next })
}

async function deleteEx(ex: Exercise) {
  const used = exerciseUsage.value.get(ex.id) ?? 0
  const msg = used > 0
    ? `Упражнение "${ex.name}" использовано в ${used} тренировках. Удалить?`
    : `Удалить "${ex.name}"?`
  if (!confirm(msg)) return
  await catalogStore.removeExercise(ex.id)
}

const expandedExId = ref<string | null>(null)
function toggleExpand(id: string) {
  expandedExId.value = expandedExId.value === id ? null : id
}

const newExName = ref('')
const newExMgs = ref<string[]>([])
async function addEx() {
  const name = newExName.value.trim()
  if (!name || newExMgs.value.length === 0) return
  const id = slug(name)
  if (!id || catalogStore.exercises.some((e) => e.id === id)) {
    alert('Упражнение с таким именем уже существует')
    return
  }
  await catalogStore.addExercise({ id, name, muscleGroups: [...newExMgs.value] })
  newExName.value = ''
  newExMgs.value = []
}

// ─── Группы ─────────────────────────────────────────────
async function updateGroupLabel(g: MuscleGroup, label: string) {
  if (!label.trim() || label === g.label) return
  await catalogStore.addMuscleGroup({ ...g, label: label.trim() })
}

async function deleteGroup(g: MuscleGroup) {
  const used = groupUsage.value.get(g.id) ?? 0
  const exUsed = catalogStore.exercises.filter((e) => e.muscleGroups.includes(g.id)).length
  const parts: string[] = []
  if (used > 0) parts.push(`${used} тренировок`)
  if (exUsed > 0) parts.push(`${exUsed} упражнений`)
  const msg = parts.length
    ? `Группа "${g.label}" используется в ${parts.join(' и ')}. Удалить?`
    : `Удалить "${g.label}"?`
  if (!confirm(msg)) return
  await catalogStore.removeMuscleGroup(g.id)
}

const newGroupLabel = ref('')
const newGroupId = ref('')
async function addGroup() {
  const label = newGroupLabel.value.trim()
  const id = newGroupId.value.trim() || slug(label)
  if (!label || !id) return
  if (catalogStore.muscleGroups.some((g) => g.id === id)) {
    alert('Группа с таким id уже существует')
    return
  }
  await catalogStore.addMuscleGroup({ id, label })
  newGroupLabel.value = ''
  newGroupId.value = ''
}
</script>

<template>
  <div class="catalog-view">
    <!-- ── Вкладки ── -->
    <div class="cat-tabs">
      <button class="ctab" :class="{ active: tab === 'exercises' }" @click="tab = 'exercises'">
        Упражнения <span class="cnt">{{ catalogStore.exercises.length }}</span>
      </button>
      <button class="ctab" :class="{ active: tab === 'groups' }" @click="tab = 'groups'">
        Группы <span class="cnt">{{ catalogStore.muscleGroups.length }}</span>
      </button>
    </div>

    <!-- ─── Упражнения ─── -->
    <div v-if="tab === 'exercises'" class="ex-tab">
      <!-- Добавить -->
      <div class="add-form">
        <input
          v-model="newExName"
          placeholder="Новое упражнение..."
          class="add-input"
          @keydown.enter="addEx"
        />
        <button class="btn-add" @click="addEx" :disabled="!newExName.trim() || newExMgs.length === 0"><Plus class="size-4" /></button>
      </div>
      <div class="add-mgs">
        <button
          v-for="mg in catalogStore.muscleGroups" :key="mg.id"
          class="mg-pill" :class="{ active: newExMgs.includes(mg.id) }"
          @click="newExMgs.includes(mg.id)
            ? newExMgs = newExMgs.filter(x => x !== mg.id)
            : newExMgs.push(mg.id)"
        ><MgIcon :id="mg.id" :size="14" /> {{ mg.label }}</button>
      </div>

      <!-- Поиск / фильтр -->
      <div class="filter-row">
        <input v-model="exSearch" placeholder="Поиск..." class="filter-input" />
        <select v-model="exFilterMg" class="filter-select">
          <option value="all">Все группы</option>
          <option v-for="mg in catalogStore.muscleGroups" :key="mg.id" :value="mg.id">
            {{ mg.label }}
          </option>
        </select>
      </div>

      <!-- Список -->
      <div class="ex-list">
        <div v-for="ex in filteredExercises" :key="ex.id"
          class="ex-item" :class="{ expanded: expandedExId === ex.id }">
          <!-- Свёрнутая строка -->
          <div class="ex-row">
            <input
              class="ex-name-input"
              :value="ex.name"
              @click.stop
              @blur="updateExName(ex, ($event.target as HTMLInputElement).value)"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
            />
            <button
              class="ex-mgs-btn"
              :title="ex.muscleGroups.map(id => catalogStore.muscleGroups.find(m=>m.id===id)?.label ?? id).join(', ')"
              @click="toggleExpand(ex.id)"
            >
              <MgIcon v-for="id in ex.muscleGroups" :key="id" :id="id" :size="18" />
              <component :is="expandedExId === ex.id ? ChevronUp : ChevronDown" class="size-3 text-muted-foreground" />
            </button>
            <span class="ex-usage" :title="`Использовано в ${exerciseUsage.get(ex.id) ?? 0} тренировках`">
              {{ exerciseUsage.get(ex.id) ?? 0 }}×
            </span>
            <button class="del-btn" title="Удалить" @click="deleteEx(ex)"><X class="size-3.5" /></button>
          </div>
          <!-- Раскрытая часть: переключатели групп -->
          <div v-if="expandedExId === ex.id" class="ex-edit">
            <button
              v-for="mg in catalogStore.muscleGroups" :key="mg.id"
              class="mg-pill"
              :class="{ active: ex.muscleGroups.includes(mg.id) }"
              @click="toggleExMg(ex, mg.id)"
            ><MgIcon :id="mg.id" :size="14" /> {{ mg.label }}</button>
          </div>
        </div>
        <div v-if="!filteredExercises.length" class="empty">Ничего не найдено</div>
      </div>
    </div>

    <!-- ─── Группы ─── -->
    <div v-else class="mg-tab">
      <!-- Добавить -->
      <div class="add-form">
        <input v-model="newGroupLabel" placeholder="Название (Грудь)" class="add-input" />
        <input v-model="newGroupId" placeholder="id (chest)" class="add-input add-id" />
        <button class="btn-add" @click="addGroup" :disabled="!newGroupLabel.trim()"><Plus class="size-4" /></button>
      </div>

      <!-- Список -->
      <div class="mg-list">
        <div v-for="g in catalogStore.muscleGroups" :key="g.id" class="mg-item" :title="'id: ' + g.id">
          <MgIcon :id="g.id" :size="22" />
          <input
            class="mg-label-input"
            :value="g.label"
            @blur="updateGroupLabel(g, ($event.target as HTMLInputElement).value)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <span class="mg-usage" :title="`${groupUsage.get(g.id) ?? 0} тренировок`">
            {{ groupUsage.get(g.id) ?? 0 }}×
          </span>
          <button class="del-btn" title="Удалить" @click="deleteGroup(g)">✕</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.catalog-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}

/* ── Вкладки ── */
.cat-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ctab {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.ctab:hover { border-color: #5a8; color: #ccc; }
.ctab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }
.cnt {
  font-size: 0.7rem;
  color: #555;
  background: #0a0a0a;
  border-radius: 9px;
  padding: 0 6px;
  min-width: 20px;
  text-align: center;
}
.ctab.active .cnt { color: #5a8; }

/* ── Форма добавления ── */
.add-form {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.add-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.85rem;
}
.add-input:focus { outline: none; border-color: #5a8; }
.add-id { max-width: 90px; }
.btn-add {
  padding: 0 14px;
  border: 1px solid #2a7a4a;
  border-radius: 6px;
  background: #1a3a2a;
  color: #5a8;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}
.btn-add:hover:not(:disabled) { background: #2a5a3a; }
.btn-add:disabled { opacity: 0.3; cursor: not-allowed; }

.add-mgs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

/* ── Фильтр ── */
.filter-row {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.filter-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #111;
  color: #eee;
  font-size: 0.8rem;
}
.filter-select {
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #111;
  color: #ccc;
  font-size: 0.8rem;
  max-width: 110px;
}

/* ── Список упражнений ── */
.ex-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ex-item {
  border-radius: 6px;
  background: #161616;
  border: 1px solid #1f1f1f;
  overflow: hidden;
}
.ex-item:hover { background: #1a1a1a; }
.ex-item.expanded {
  background: #1a1a1a;
  border-color: #2a3a32;
}

.ex-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
}

.ex-name-input {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #eee;
  font-size: 0.85rem;
}
.ex-name-input:hover { border-color: #2a2a2a; background: #0a0a0a; }
.ex-name-input:focus { outline: none; border-color: #5a8; background: #0a0a0a; }

.ex-mgs-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 3px 6px;
  color: #888;
  font-size: 0.85rem;
  max-width: 130px;
  overflow: hidden;
}
.ex-mgs-btn:hover { border-color: #2a2a2a; background: #0a0a0a; }
.ex-item.expanded .ex-mgs-btn { border-color: #5a8; color: #5a8; }

.expand-arrow {
  color: #555;
  font-size: 0.65rem;
  margin-left: 2px;
}

.ex-edit {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 6px 8px 8px;
  border-top: 1px solid #2a2a2a;
  background: #111;
}

.ex-usage {
  font-size: 0.65rem;
  color: #444;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
}

/* ── Pill для группы мышц ── */
.mg-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 5px;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.72rem;
  white-space: nowrap;
}
.mg-pill:hover { border-color: #5a8; color: #5a8; }
.mg-pill.active { border-color: #5a8; background: #1a2a22; color: #5a8; }

/* ── Список групп ── */
.mg-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #161616;
  border: 1px solid #1f1f1f;
}
.mg-item:hover { background: #1a1a1a; }

.mg-label-input {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #eee;
  font-size: 0.88rem;
}
.mg-label-input:hover { border-color: #2a2a2a; background: #0a0a0a; }
.mg-label-input:focus { outline: none; border-color: #5a8; background: #0a0a0a; }

.mg-usage {
  font-size: 0.65rem;
  color: #444;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
}

/* ── Удалить ── */
.del-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 4px;
  flex-shrink: 0;
}
.del-btn:hover { color: #a55; }

.empty {
  text-align: center;
  color: #444;
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>
