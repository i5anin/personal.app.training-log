<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()
const router = useRouter()

onMounted(async () => {
  await catalogStore.load()
  await workoutStore.load()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1 @click="router.push('/')">💪 Gym+</h1>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 12px;
}

.app-header {
  padding: 12px 0;
  border-bottom: 2px solid #333;
  margin-bottom: 16px;
}

.app-header h1 {
  margin: 0;
  font-size: 1.4rem;
  cursor: pointer;
}
</style>
