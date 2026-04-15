export interface MuscleGroup {
  id: string
  label: string
}

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
}

export interface SetRow {
  reps: number
  weight: number
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  sets: SetRow[]
  supersetGroupId?: string
  description?: string
  photoIds?: string[]
}

export interface Workout {
  id: number
  date: string
  muscleGroups: string[]
  entries: ExerciseEntry[]
  description?: string
  photoIds?: string[]
}

export interface PhotoRecord {
  id: string
  blob: Blob
  thumbnail: Blob
  createdAt: string
}

export interface UserSettings {
  key: string
  value: string
}
