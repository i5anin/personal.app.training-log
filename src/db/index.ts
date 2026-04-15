import { openDB, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, MuscleGroup, PhotoRecord } from '@/types'
import { defaultMuscleGroups, defaultExercises } from './seed'

const DB_NAME = 'gym-plus-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' })
        workoutStore.createIndex('date', 'date')

        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' })
        exerciseStore.createIndex('muscleGroups', 'muscleGroups', { multiEntry: true })

        db.createObjectStore('muscleGroups', { keyPath: 'id' })
        db.createObjectStore('photos', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

export async function initDB() {
  const db = await getDB()

  const existingGroups = await db.getAll('muscleGroups')
  if (existingGroups.length === 0) {
    const tx = db.transaction('muscleGroups', 'readwrite')
    for (const mg of defaultMuscleGroups) {
      await tx.store.put(mg)
    }
    await tx.done
  }

  const existingExercises = await db.getAll('exercises')
  if (existingExercises.length === 0) {
    const tx = db.transaction('exercises', 'readwrite')
    for (const ex of defaultExercises) {
      await tx.store.put(ex)
    }
    await tx.done
  }
}

// Workouts
export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDB()
  return db.getAll('workouts')
}

export async function getWorkout(id: number): Promise<Workout | undefined> {
  const db = await getDB()
  return db.get('workouts', id)
}

export async function getNextWorkoutId(): Promise<number> {
  const db = await getDB()
  const all = await db.getAllKeys('workouts')
  if (all.length === 0) return 1
  return (Math.max(...(all as number[])) + 1)
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const db = await getDB()
  await db.put('workouts', workout)
}

export async function deleteWorkout(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('workouts', id)
}

// Exercises
export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAll('exercises')
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const db = await getDB()
  await db.put('exercises', exercise)
}

// Muscle Groups
export async function getAllMuscleGroups(): Promise<MuscleGroup[]> {
  const db = await getDB()
  return db.getAll('muscleGroups')
}

// Photos
export async function savePhoto(photo: PhotoRecord): Promise<void> {
  const db = await getDB()
  await db.put('photos', photo)
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDB()
  return db.get('photos', id)
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('photos', id)
}

// Export/Import
export async function exportAll() {
  const db = await getDB()
  return {
    version: 1,
    workouts: await db.getAll('workouts'),
    exercises: await db.getAll('exercises'),
    muscleGroups: await db.getAll('muscleGroups'),
  }
}

export async function importAll(data: { workouts: Workout[]; exercises: Exercise[]; muscleGroups: MuscleGroup[] }) {
  const db = await getDB()

  const tx1 = db.transaction('muscleGroups', 'readwrite')
  await tx1.store.clear()
  for (const mg of data.muscleGroups) await tx1.store.put(mg)
  await tx1.done

  const tx2 = db.transaction('exercises', 'readwrite')
  await tx2.store.clear()
  for (const ex of data.exercises) await tx2.store.put(ex)
  await tx2.done

  const tx3 = db.transaction('workouts', 'readwrite')
  await tx3.store.clear()
  for (const w of data.workouts) await tx3.store.put(w)
  await tx3.done
}
