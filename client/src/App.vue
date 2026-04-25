<script setup lang="ts">
import { onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import WorkoutListView from '@/views/WorkoutListView.vue'

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()

onMounted(async () => {
  await catalogStore.load()
  await workoutStore.load()
})
</script>

<template>
  <div class="app-layout">
    <!-- Левая панель: список -->
    <aside class="panel-list">
      <div class="panel-list-header">
        <span class="logo">💪 Gym+</span>
      </div>
      <div class="panel-list-body">
        <WorkoutListView />
      </div>
    </aside>

    <!-- Правая панель: редактор -->
    <main class="panel-editor">
      <RouterView v-if="$route.name !== 'list'" />
      <div v-else class="editor-empty">
        <div class="editor-empty-inner">
          <div class="editor-empty-icon">🏋️</div>
          <div>Выберите тренировку или создайте новую</div>
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
  width: 320px;
  min-width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  background: #161616;
}

.panel-list-header {
  flex-shrink: 0;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #2a2a2a;
}

.logo {
  font-size: 1.1rem;
  font-weight: bold;
}

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
    width: 100%;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #2a2a2a;
  }

  .panel-editor {
    padding: 12px 14px;
  }
}
</style>
