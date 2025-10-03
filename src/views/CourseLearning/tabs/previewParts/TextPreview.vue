<template>
  <div class="text-preview">
    <div v-if="loading" class="loading">加载中...</div>
    <pre v-else>{{ content }}</pre>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{ payload:any }>();
const content = ref('');
const loading = ref(false);

async function load(){
  if(!props.payload?.url){ content.value = '无内容'; return; }
  if(props.payload.mime === 'application/json'){ // 直接 fetch json
    loading.value = true;
    try { const r = await fetch(props.payload.url); const j = await r.json(); content.value = JSON.stringify(j, null, 2); } catch(e){ content.value = '加载失败'; } finally { loading.value = false; }
    return;
  }
  if(props.payload.mime.startsWith('text/')){
    loading.value = true;
    try { const r = await fetch(props.payload.url); content.value = await r.text(); } catch(e){ content.value = '加载失败'; } finally { loading.value = false; }
    return;
  }
  content.value = `暂不支持该类型预览: ${props.payload.mime}`;
}

onMounted(load);
watch(()=> props.payload?.url, load);
</script>
<style scoped>
.text-preview { height:100%; }
pre { background:#111; color:#f5f5f5; padding:12px; border-radius:4px; font-size:13px; line-height:1.45; overflow:auto; }
.loading { color:#666; }
</style>
