<script setup lang="ts">
import { ref } from 'vue'
import { nanoid } from 'nanoid'
import { savePhoto, getPhoto, deletePhoto } from '@/db'

const props = defineProps<{ photoIds: string[] }>()
const emit = defineEmits<{ update: [ids: string[]] }>()

const previews = ref<Map<string, string>>(new Map())

async function loadPreviews() {
  for (const id of props.photoIds) {
    if (!previews.value.has(id)) {
      const rec = await getPhoto(id)
      if (rec) {
        previews.value.set(id, URL.createObjectURL(rec.thumbnail))
      }
    }
  }
}
loadPreviews()

async function onFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const newIds: string[] = [...props.photoIds]

  for (const file of files) {
    const id = nanoid()
    const { full, thumb } = await resizeImage(file)
    await savePhoto({ id, blob: full, thumbnail: thumb, createdAt: new Date().toISOString() })
    newIds.push(id)
    previews.value.set(id, URL.createObjectURL(thumb))
  }

  emit('update', newIds)
}

async function removePhoto(id: string) {
  await deletePhoto(id)
  const url = previews.value.get(id)
  if (url) URL.revokeObjectURL(url)
  previews.value.delete(id)
  emit('update', props.photoIds.filter((pid) => pid !== id))
}

function resizeImage(file: File): Promise<{ full: Blob; thumb: Blob }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const full = drawToBlob(img, 1920)
      const thumb = drawToBlob(img, 200)
      Promise.all([full, thumb]).then(([f, t]) => resolve({ full: f, thumb: t }))
    }
    img.src = URL.createObjectURL(file)
  })
}

function drawToBlob(img: HTMLImageElement, maxSize: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  let w = img.width, h = img.height
  if (w > maxSize || h > maxSize) {
    if (w > h) { h = (h / w) * maxSize; w = maxSize }
    else { w = (w / h) * maxSize; h = maxSize }
  }
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85))
}
</script>

<template>
  <div class="photo-attach">
    <div class="photo-previews" v-if="photoIds.length">
      <div v-for="id in photoIds" :key="id" class="photo-thumb">
        <img v-if="previews.get(id)" :src="previews.get(id)" />
        <button class="photo-remove" @click="removePhoto(id)">✕</button>
      </div>
    </div>
    <label class="photo-btn">
      📷
      <input type="file" accept="image/*" multiple @change="onFileSelect" hidden />
    </label>
  </div>
</template>

<style scoped>
.photo-attach {
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-previews {
  display: flex;
  gap: 4px;
}

.photo-thumb {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: -2px;
  right: -2px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: none;
  font-size: 0.6rem;
  cursor: pointer;
  padding: 0 3px;
  border-radius: 50%;
}

.photo-btn {
  cursor: pointer;
  font-size: 1.1rem;
  padding: 2px 4px;
}
</style>
