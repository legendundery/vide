<template>
  <div class="img-preview">
    <img v-if="payload?.url" :src="payload.url" :alt="payload.filename" />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ payload:any }>();
</script>
<style scoped>
.img-preview { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
img { max-width:100%; max-height:100%; object-fit:contain; background:#000; }
</style>
