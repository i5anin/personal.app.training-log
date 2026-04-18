export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  chest:     '🏋️',
  back:      '🦴',
  shoulders: '🤷',
  arms:      '💪',
  legs:      '🦵',
  core:      '⭕',
  cardio:    '🏃',
  // пользовательские группы — дефолтная иконка
}

export function getMuscleGroupIcon(id: string): string {
  return MUSCLE_GROUP_ICONS[id] ?? '🏋️'
}
