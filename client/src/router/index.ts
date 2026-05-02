import { createRouter, createWebHashHistory } from 'vue-router'
import WorkoutListView from '@/views/WorkoutListView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'list', component: WorkoutListView },
    { path: '/workout/new', name: 'new-workout', component: () => import('@/views/WorkoutEditorView.vue') },
    { path: '/workout/:id', name: 'edit-workout', component: () => import('@/views/WorkoutEditorView.vue') },
    { path: '/exercise/:id/chart', name: 'exercise-chart', component: () => import('@/views/ExerciseChartView.vue') },
  ],
})

export default router
