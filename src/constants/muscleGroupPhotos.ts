// Filename → URL helper
function mgPhoto(name: string) {
  return `/api/mg-photo?name=${encodeURIComponent(name)}`
}

// Одно фото на группу мышц
export const MUSCLE_GROUP_PHOTO: Record<string, string> = {
  chest:     mgPhoto('грудь.jpg'),
  shoulders: mgPhoto('плечи.jpg'),
  legs:      mgPhoto('ноги.jpg'),
  core:      mgPhoto('пресс.avif'),
}

export function getMuscleGroupPhoto(id: string): string | null {
  return MUSCLE_GROUP_PHOTO[id] ?? null
}
