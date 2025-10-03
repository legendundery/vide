<template>
  <div class="pdf-preview">
    <iframe v-if="payload?.url" :src="payload.url" frameborder="0" />
    <div v-else>无 PDF 内容</div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ payload:any }>();
</script>
<style scoped>
.pdf-preview { width:100%; height:100%; }
iframe { width:100%; height:100%; background:#222; }
</style>
