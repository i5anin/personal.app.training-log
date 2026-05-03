<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import WorkoutListView from '@/views/WorkoutListView.vue'
import StatsView from '@/views/StatsView.vue'
import CatalogView from '@/views/CatalogView.vue'

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()
const activePanel = ref<'workouts' | 'stats' | 'catalog'>('workouts')

// ── Resizable панель ──
const MIN_W = 240, MAX_W = 900
const panelWidth = ref(Number(localStorage.getItem('gym.panelWidth')) || 320)
watch(panelWidth, (w) => localStorage.setItem('gym.panelWidth', String(w)))

let dragging = false
function startDrag(e: MouseEvent) {
  dragging = true
  e.preventDefault()
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag, { once: true })
}
function onDrag(e: MouseEvent) {
  if (!dragging) return
  panelWidth.value = Math.max(MIN_W, Math.min(MAX_W, e.clientX))
}
function stopDrag() {
  dragging = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onDrag)
}

onMounted(async () => {
  await catalogStore.load()
  await workoutStore.load()
})
</script>

<template>
  <div class="app-layout">
    <!-- Левая панель: список -->
    <aside
      class="panel-list"
      :class="{ 'panel-full': activePanel === 'catalog' }"
      :style="activePanel !== 'catalog' ? { width: panelWidth + 'px' } : {}"
    >
      <div class="panel-list-header">
        <span class="logo">💪 Gym+</span>
        <div class="panel-tabs">
          <button class="ptab" :class="{ active: activePanel === 'workouts' }" @click="activePanel = 'workouts'" title="Тренировки">📋</button>
          <button class="ptab" :class="{ active: activePanel === 'stats' }" @click="activePanel = 'stats'" title="Прогресс">📊</button>
          <button class="ptab" :class="{ active: activePanel === 'catalog' }" @click="activePanel = 'catalog'" title="Каталог">📚</button>
        </div>
      </div>
      <div class="panel-list-body">
        <WorkoutListView v-if="activePanel === 'workouts'" />
        <StatsView v-else-if="activePanel === 'stats'" />
        <CatalogView v-else />
      </div>
    </aside>

    <!-- Resize handle (везде кроме каталога) -->
    <div
      v-if="activePanel !== 'catalog'"
      class="resize-handle"
      @mousedown="startDrag"
      title="Тяни чтобы изменить ширину"
    ></div>

    <!-- Правая панель: редактор / графики (везде кроме каталога) -->
    <main v-if="activePanel !== 'catalog'" class="panel-editor">
      <RouterView v-if="$route.name !== 'list'" />
      <div v-else class="editor-empty">
        <div class="editor-empty-inner">
          <div class="editor-empty-icon">{{ activePanel === 'stats' ? '📊' : '🏋️' }}</div>
          <div v-if="activePanel === 'stats'">Выберите упражнение чтобы увидеть график</div>
          <div v-else>Выберите тренировку или создайте новую</div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #121212;
  color: #eee;
  font-family: system-ui, -apple-system, sans-serif;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
}

/* ─── Левая панель ─── */
.panel-list {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #161616;
}

/* В режимах каталога/прогресса панель растягивается на всё окно */
.panel-list.panel-full {
  flex: 1;
  width: 100%;
}
.panel-list.panel-full .panel-list-body {
  display: flex;
  justify-content: center;
}
.panel-list.panel-full .panel-list-body > * {
  width: 100%;
  max-width: 1100px;
}

/* ─── Resize handle ─── */
.resize-handle {
  flex-shrink: 0;
  width: 4px;
  background: #2a2a2a;
  cursor: col-resize;
  transition: background 0.15s;
  position: relative;
}
.resize-handle:hover { background: #5a8; }
.resize-handle:active { background: #5a8; }
.resize-handle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  right: -3px;
  bottom: 0;
}

.panel-list-header {
  flex-shrink: 0;
  padding: 10px 12px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.logo {
  font-size: 1.1rem;
  font-weight: bold;
}

.panel-tabs {
  display: flex;
  gap: 4px;
}

.ptab {
  width: 32px;
  height: 28px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #555;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.ptab:hover { border-color: #5a8; color: #ccc; }
.ptab.active { border-color: #5a8; background: #1a2a22; color: #5a8; }

.panel-list-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ─── Правая панель ─── */
.panel-editor {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  min-width: 0;
}

.editor-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-empty-inner {
  text-align: center;
  color: #444;
}

.editor-empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
  .app-layout {
    flex-direction: column;
  }

  .panel-list {
    width: 100% !important;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #2a2a2a;
  }

  .resize-handle { display: none; }

  .panel-editor {
    padding: 12px 14px;
  }
}
</style>
