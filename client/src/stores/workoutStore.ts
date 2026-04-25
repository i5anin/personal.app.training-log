import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Workout } from '@/types'
import { getAllWorkouts } from '@/db'

export const useWorkoutStore = defineStore('workouts', () => {
  const workouts = ref<Workout[]>([])

  async function load() {
    workouts.value = await getAllWorkouts()
    workouts.value.sort((a, b) => b.id - a.id)
  }

  return { workouts, load }
})
