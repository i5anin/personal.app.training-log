import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise, MuscleGroup } from '@/types'
import {
  getAllExercises, getAllMuscleGroups,
  saveExercise, saveMuscleGroup,
  deleteExercise, deleteMuscleGroup,
} from '@/db'

export const useCatalogStore = defineStore('catalog', () => {
  const exercises = ref<Exercise[]>([])
  const muscleGroups = ref<MuscleGroup[]>([])

  async function load() {
    exercises.value = await getAllExercises()
    muscleGroups.value = await getAllMuscleGroups()
  }

  async function addMuscleGroup(group: MuscleGroup) {
    await saveMuscleGroup(group)
    const idx = muscleGroups.value.findIndex((g) => g.id === group.id)
    if (idx >= 0) muscleGroups.value[idx] = group
    else muscleGroups.value.push(group)
  }

  async function removeMuscleGroup(id: string) {
    await deleteMuscleGroup(id)
    muscleGroups.value = muscleGroups.value.filter((g) => g.id !== id)
  }

  async function addExercise(exercise: Exercise) {
    await saveExercise(exercise)
    const idx = exercises.value.findIndex((e) => e.id === exercise.id)
    if (idx >= 0) exercises.value[idx] = exercise
    else exercises.value.push(exercise)
  }

  async function removeExercise(id: string) {
    await deleteExercise(id)
    exercises.value = exercises.value.filter((e) => e.id !== id)
  }

  function getExerciseById(id: string) {
    return exercises.value.find((e) => e.id === id)
  }

  function getExercisesForMuscleGroups(mgIds: string[]): Exercise[] {
    if (mgIds.length === 0) return exercises.value
    return exercises.value.filter((e) => e.muscleGroups.some((mg) => mgIds.includes(mg)))
  }

  return {
    exercises, muscleGroups, load,
    addMuscleGroup, removeMuscleGroup,
    addExercise, removeExercise,
    getExerciseById, getExercisesForMuscleGroups,
  }
})
