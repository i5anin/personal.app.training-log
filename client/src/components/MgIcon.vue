<script setup lang="ts">
import { computed } from 'vue'
import { getMuscleGroupIcon, getMuscleGroupImage } from '@/constants/muscleGroupIcons'

const props = withDefaults(defineProps<{
  id: string
  size?: number
}>(), { size: 18 })

const img = computed(() => getMuscleGroupImage(props.id))
const emoji = computed(() => getMuscleGroupIcon(props.id))
</script>

<template>
  <img
    v-if="img"
    :src="img"
    :alt="id"
    class="mg-icon"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
  <span v-else class="mg-icon-emoji" :style="{ fontSize: size * 0.85 + 'px' }">{{ emoji }}</span>
</template>

<style scoped>
.mg-icon {
  display: inline-block;
  object-fit: cover;
  border-radius: 3px;
  vertical-align: middle;
  flex-shrink: 0;
}
.mg-icon-emoji {
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
}
</style>
