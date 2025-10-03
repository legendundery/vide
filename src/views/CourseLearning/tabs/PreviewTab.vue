<template>
  <div class="preview-tab" v-if="!payload">未找到预览数据</div>
  <div v-else class="preview-tab">
    <component :is="componentType" v-bind="componentProps" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import TextPreview from './previewParts/TextPreview.vue';
import ImagePreview from './previewParts/ImagePreview.vue';
import PdfPreview from './previewParts/PdfPreview.vue';
import OfficePreview from './previewParts/OfficePreview.vue';

// 约定：tab.code 中存放 JSON 字符串 { url, mime, filename, original, size }
// DraggableBlocks 渲染此组件时需传入 :tab 对象或者我们走全局 Map；这里采用 props 方式

const props = defineProps<{ tab?: any }>();

const payload = computed(()=>{
  if(!props.tab) return null;
  try {
    if(props.tab.previewRaw) return props.tab.previewRaw;
    if(props.tab.code) return JSON.parse(props.tab.code);
  } catch(_){}
  return null;
});

const componentType = computed(()=>{
  const mime = payload.value?.mime || '';
  if(mime.startsWith('image/')) return ImagePreview;
  if(mime === 'application/pdf') return PdfPreview;
  if(mime === 'application/vnd.ms-powerpoint' || mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return OfficePreview;
  if(mime.startsWith('text/') || mime === 'application/json') return TextPreview;
  return TextPreview; // fallback 文本提示
});

const componentProps = computed(()=>({ payload: payload.value }));
</script>
<style scoped>
.preview-tab { width:100%; height:100%; overflow:auto; padding:8px; }
</style>
