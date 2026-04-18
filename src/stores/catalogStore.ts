import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise, MuscleGroup } from '@/types'
import { getAllExercises, getAllMuscleGroups, saveExercise, saveMuscleGroup } from '@/db'

export const useCatalogStore = defineStore('catalog', () => {
  const exercises = ref<Exercise[]>([])
  const muscleGroups = ref<MuscleGroup[]>([])

  async function load() {
    exercises.value = await getAllExercises()
    muscleGroups.value = await getAllMuscleGroups()
  }

  async function addMuscleGroup(group: MuscleGroup) {
    await saveMuscleGroup(group)
    muscleGroups.value.push(group)
  }

  async function addExercise(exercise: Exercise) {
    await saveExercise(exercise)
    exercises.value.push(exercise)
  }

  function getExerciseById(id: string) {
    return exercises.value.find((e) => e.id === id)
  }

  function getExercisesForMuscleGroups(mgIds: string[]): Exercise[] {
    if (mgIds.length === 0) return exercises.value
    return exercises.value.filter((e) => e.muscleGroups.some((mg) => mgIds.includes(mg)))
  }

  return { exercises, muscleGroups, load, addMuscleGroup, addExercise, getExerciseById, getExercisesForMuscleGroups }
})
