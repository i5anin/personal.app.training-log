import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dirname, '..', 'data')
const PHOTOS_DIR = join(DATA_DIR, 'photos')

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true })
mkdirSync(PHOTOS_DIR, { recursive: true })

// --- JSON file helpers ---
function readJSON<T>(filename: string, fallback: T): T {
  const path = join(DATA_DIR, filename)
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function writeJSON(filename: string, data: unknown) {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8')
}

// --- Seed defaults if files don't exist ---
const defaultMuscleGroups = [
  { id: 'chest', label: 'Грудь' },
  { id: 'back', label: 'Спина' },
  { id: 'shoulders', label: 'Плечи' },
  { id: 'arms', label: 'Руки' },
  { id: 'legs', label: 'Ноги' },
  { id: 'core', label: 'Пресс' },
  { id: 'cardio', label: 'Кардио' },
]

const defaultExercises = [
  { id: 'bench-press', name: 'Жим лежа', muscleGroups: ['chest'] },
  { id: 'incline-bench-press', name: 'Жим лежа наклонный', muscleGroups: ['chest', 'shoulders'] },
  { id: 'dumbbell-fly', name: 'Разводка гантелей', muscleGroups: ['chest'] },
  { id: 'chest-press-machine', name: 'Жим в тренажере', muscleGroups: ['chest'] },
  { id: 'push-ups', name: 'Отжимания', muscleGroups: ['chest', 'arms'] },
  { id: 'cable-crossover', name: 'Кроссовер', muscleGroups: ['chest'] },
  { id: 'dips', name: 'Брусья', muscleGroups: ['chest', 'arms'] },
  { id: 'pull-ups', name: 'Подтягивания', muscleGroups: ['back', 'arms'] },
  { id: 'lat-pulldown', name: 'Тяга верхнего блока', muscleGroups: ['back'] },
  { id: 'barbell-row', name: 'Тяга штанги в наклоне', muscleGroups: ['back'] },
  { id: 'dumbbell-row', name: 'Тяга гантели в наклоне', muscleGroups: ['back'] },
  { id: 'cable-row', name: 'Тяга нижнего блока', muscleGroups: ['back'] },
  { id: 'deadlift', name: 'Становая тяга', muscleGroups: ['back', 'legs'] },
  { id: 'hyperextension', name: 'Гиперэкстензия', muscleGroups: ['back', 'core'] },
  { id: 't-bar-row', name: 'Тяга Т-грифа', muscleGroups: ['back'] },
  { id: 'overhead-press', name: 'Жим стоя', muscleGroups: ['shoulders'] },
  { id: 'dumbbell-shoulder-press', name: 'Жим гантелей сидя', muscleGroups: ['shoulders'] },
  { id: 'lateral-raise', name: 'Махи в стороны', muscleGroups: ['shoulders'] },
  { id: 'front-raise', name: 'Махи перед собой', muscleGroups: ['shoulders'] },
  { id: 'rear-delt-fly', name: 'Разводка на заднюю дельту', muscleGroups: ['shoulders'] },
  { id: 'face-pull', name: 'Фейс-пул', muscleGroups: ['shoulders', 'back'] },
  { id: 'shrugs', name: 'Шраги', muscleGroups: ['shoulders'] },
  { id: 'bicep-curl', name: 'Сгибания на бицепс', muscleGroups: ['arms'] },
  { id: 'hammer-curl', name: 'Молотки', muscleGroups: ['arms'] },
  { id: 'tricep-pushdown', name: 'Разгибания на трицепс', muscleGroups: ['arms'] },
  { id: 'overhead-tricep', name: 'Французский жим', muscleGroups: ['arms'] },
  { id: 'preacher-curl', name: 'Сгибания на скамье Скотта', muscleGroups: ['arms'] },
  { id: 'barbell-curl', name: 'Сгибания со штангой', muscleGroups: ['arms'] },
  { id: 'squat', name: 'Приседания', muscleGroups: ['legs'] },
  { id: 'leg-press', name: 'Жим ногами', muscleGroups: ['legs'] },
  { id: 'lunges', name: 'Выпады', muscleGroups: ['legs'] },
  { id: 'leg-extension', name: 'Разгибания ног', muscleGroups: ['legs'] },
  { id: 'leg-curl', name: 'Сгибания ног', muscleGroups: ['legs'] },
  { id: 'calf-raise', name: 'Подъемы на носки', muscleGroups: ['legs'] },
  { id: 'romanian-deadlift', name: 'Румынская тяга', muscleGroups: ['legs', 'back'] },
  { id: 'hack-squat', name: 'Гакк-приседания', muscleGroups: ['legs'] },
  { id: 'bulgarian-split-squat', name: 'Болгарские выпады', muscleGroups: ['legs'] },
  { id: 'hip-thrust', name: 'Ягодичный мост', muscleGroups: ['legs'] },
  { id: 'crunch', name: 'Скручивания', muscleGroups: ['core'] },
  { id: 'plank', name: 'Планка', muscleGroups: ['core'] },
  { id: 'leg-raise-core', name: 'Подъемы ног', muscleGroups: ['core'] },
  { id: 'russian-twist', name: 'Русские скручивания', muscleGroups: ['core'] },
  { id: 'cable-crunch', name: 'Скручивания на блоке', muscleGroups: ['core'] },
  { id: 'treadmill', name: 'Беговая дорожка', muscleGroups: ['cardio'] },
  { id: 'elliptical', name: 'Эллипс', muscleGroups: ['cardio'] },
  { id: 'bike', name: 'Велотренажер', muscleGroups: ['cardio'] },
  { id: 'rowing', name: 'Гребной тренажер', muscleGroups: ['cardio', 'back'] },
  { id: 'jump-rope', name: 'Скакалка', muscleGroups: ['cardio', 'legs'] },
]

if (!existsSync(join(DATA_DIR, 'muscleGroups.json'))) {
  writeJSON('muscleGroups.json', defaultMuscleGroups)
}
if (!existsSync(join(DATA_DIR, 'exercises.json'))) {
  writeJSON('exercises.json', defaultExercises)
}
if (!existsSync(join(DATA_DIR, 'workouts.json'))) {
  writeJSON('workouts.json', [])
}

// --- Server ---
const app = Fastify({ logger: false })
await app.register(cors)
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

// Workouts
app.get('/api/workouts', async () => {
  return readJSON('workouts.json', [])
})

app.get<{ Params: { id: string } }>('/api/workouts/:id', async (req) => {
  const workouts = readJSON<any[]>('workouts.json', [])
  return workouts.find((w) => w.id === Number(req.params.id)) ?? null
})

app.post('/api/workouts', async (req) => {
  const workouts = readJSON<any[]>('workouts.json', [])
  const workout = req.body as any
  const existing = workouts.findIndex((w) => w.id === workout.id)
  if (existing >= 0) {
    workouts[existing] = workout
  } else {
    workouts.push(workout)
  }
  writeJSON('workouts.json', workouts)
  return { ok: true }
})

app.delete<{ Params: { id: string } }>('/api/workouts/:id', async (req) => {
  let workouts = readJSON<any[]>('workouts.json', [])
  workouts = workouts.filter((w) => w.id !== Number(req.params.id))
  writeJSON('workouts.json', workouts)
  return { ok: true }
})

app.get('/api/workouts/next-id', async () => {
  const workouts = readJSON<any[]>('workouts.json', [])
  if (workouts.length === 0) return { id: 1 }
  return { id: Math.max(...workouts.map((w) => w.id)) + 1 }
})

// Exercises
app.get('/api/exercises', async () => {
  return readJSON('exercises.json', [])
})

app.post('/api/exercises', async (req) => {
  const exercises = readJSON<any[]>('exercises.json', [])
  const exercise = req.body as any
  const existing = exercises.findIndex((e) => e.id === exercise.id)
  if (existing >= 0) {
    exercises[existing] = exercise
  } else {
    exercises.push(exercise)
  }
  writeJSON('exercises.json', exercises)
  return { ok: true }
})

// Muscle Groups
app.get('/api/muscle-groups', async () => {
  return readJSON('muscleGroups.json', [])
})

// Photos
app.post('/api/photos', async (req) => {
  const file = await req.file()
  if (!file) return { error: 'No file' }
  const id = file.fields?.id ? (file.fields.id as any).value : Date.now().toString()
  const buffer = await file.toBuffer()
  writeFileSync(join(PHOTOS_DIR, `${id}.jpg`), buffer)
  return { id }
})

app.get<{ Params: { id: string } }>('/api/photos/:id', async (req, reply) => {
  const path = join(PHOTOS_DIR, `${req.params.id}.jpg`)
  if (!existsSync(path)) {
    reply.code(404)
    return { error: 'Not found' }
  }
  const buffer = readFileSync(path)
  reply.type('image/jpeg').send(buffer)
})

app.delete<{ Params: { id: string } }>('/api/photos/:id', async (req) => {
  const path = join(PHOTOS_DIR, `${req.params.id}.jpg`)
  if (existsSync(path)) unlinkSync(path)
  return { ok: true }
})

// Export / Import
app.get('/api/export', async () => {
  return {
    version: 1,
    workouts: readJSON('workouts.json', []),
    exercises: readJSON('exercises.json', []),
    muscleGroups: readJSON('muscleGroups.json', []),
  }
})

app.post('/api/import', async (req) => {
  const data = req.body as any
  if (data.workouts) writeJSON('workouts.json', data.workouts)
  if (data.exercises) writeJSON('exercises.json', data.exercises)
  if (data.muscleGroups) writeJSON('muscleGroups.json', data.muscleGroups)
  return { ok: true }
})

// Start
app.listen({ port: 3777, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`🏋️ Gym+ API running at ${address}`)
})
