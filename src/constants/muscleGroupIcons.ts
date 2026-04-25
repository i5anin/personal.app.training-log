export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  chest:       '🏋️',
  back:        '🦴',
  lats:        '🦴',
  traps:       '🦴',
  'lower-back':'🦴',
  shoulders:   '🤷',
  'rear-delts':'🤷',
  arms:        '💪',
  biceps:      '💪',
  triceps:     '💪',
  forearms:    '💪',
  legs:        '🦵',
  quadriceps:  '🦵',
  hamstrings:  '🦵',
  glutes:      '🍑',
  икры:        '🦵',
  core:        '⭕',
  obliques:    '⭕',
  cardio:      '🏃',
}

export const MUSCLE_GROUP_IMAGES: Record<string, string> = {
  chest:       '/icons/chest.png',
  back:        '/icons/back.png',
  lats:        '/icons/back.png',
  traps:       '/icons/traps.avif',
  'lower-back':'/icons/back.png',
  shoulders:   '/icons/shoulders.png',
  'rear-delts':'/icons/shoulders.png',
  arms:        '/icons/arms.png',
  biceps:      '/icons/arms.png',
  triceps:     '/icons/arms.png',
  forearms:    '/icons/arms.png',
  legs:        '/icons/legs.png',
  quadriceps:  '/icons/legs.png',
  hamstrings:  '/icons/legs.png',
  glutes:      '/icons/legs.png',
  икры:        '/icons/икры.png',
  core:        '/icons/core.png',
  obliques:    '/icons/obliques.jpg',
}

export function getMuscleGroupIcon(id: string): string {
  return MUSCLE_GROUP_ICONS[id] ?? '🏋️'
}

export function getMuscleGroupImage(id: string): string | null {
  return MUSCLE_GROUP_IMAGES[id] ?? null
}
