export interface WorkoutType {
  id: string
  label: string
  emoji: string
}

export const WORKOUT_TYPES: WorkoutType[] = [
  { id: 'strength',      label: 'Силовая',          emoji: '🏋️' },
  { id: 'hypertrophy',   label: 'Гипертрофия',       emoji: '💪' },
  { id: 'powerlifting',  label: 'Пауэрлифтинг',      emoji: '🥇' },
  { id: 'cardio',        label: 'Кардио',             emoji: '🏃' },
  { id: 'hiit',          label: 'HIIT',               emoji: '⚡' },
  { id: 'functional',    label: 'Функциональная',     emoji: '🤸' },
  { id: 'circuit',       label: 'Круговая',           emoji: '🔄' },
  { id: 'stretching',    label: 'Растяжка',           emoji: '🧘' },
  { id: 'recovery',      label: 'Восстановительная',  emoji: '🛌' },
  { id: 'crossfit',      label: 'Кроссфит',           emoji: '🎯' },
]
