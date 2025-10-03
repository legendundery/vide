<template>
  <div class="materials-tab">
    <div v-if="loading" class="loading"><n-skeleton text :repeat="5" /></div>
    <div v-else>
      <div v-if="!materials.length" class="empty">暂无资料</div>
      <n-table v-else size="small" :single-line="false">
        <thead>
          <tr><th>文件名</th><th>类型</th><th>大小</th><th style="width:150px">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in materials" :key="m.filename">
            <td>{{ m.original || m.filename }}</td>
            <td>{{ m.mime }}</td>
            <td>{{ formatSize(m.size) }}</td>
            <td class="ops">
              <n-button size="tiny" tertiary tag="a" :href="m.url" target="_blank" download>下载</n-button>
              <n-button v-if="canPreview(m)" size="tiny" @click="preview(m)" secondary>预览</n-button>
            </td>
          </tr>
        </tbody>
      </n-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getLessonDetail } from '../../../api/courses';
import { useMessage, NTable, NButton, NSkeleton } from 'naive-ui';
import { LayOutStore } from '../../../stores/LayOutStore';

const route = useRoute();
const message = useMessage();
const materials = ref<any[]>([]);
const loading = ref(true);
const layoutStore = LayOutStore();

const previewable = [
  'image/jpeg','image/png','image/webp','text/plain','application/json','text/markdown','application/pdf',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

function canPreview(m:any){ return previewable.includes(m.mime); }

function formatSize(size?:number){
  if(!size && size!==0) return '';
  if(size < 1024) return size+'B';
  if(size < 1024*1024) return (size/1024).toFixed(1)+'KB';
  return (size/1024/1024).toFixed(1)+'MB';
}

function preview(m:any){
  // 调用 store 的 openPreviewTab
  if(typeof layoutStore.openPreviewTab === 'function'){
    layoutStore.openPreviewTab(m);
  } else {
    message.warning('预览功能未初始化');
  }
}

async function fetchMaterials(){
  loading.value = true;
  try {
    const courseId = route.params.courseId as any;
    const lessonId = route.params.lessonId as any;
    if(courseId && lessonId){
      const r = await getLessonDetail(courseId, lessonId);
      let arr:any[] = [];
      if(r.data?.materials_json){
        try { arr = typeof r.data.materials_json === 'string'? JSON.parse(r.data.materials_json): r.data.materials_json; } catch(_){}
      }
      materials.value = arr;
    }
  } finally { loading.value = false; }
}

onMounted(fetchMaterials);
watch(()=> [route.params.courseId, route.params.lessonId], fetchMaterials);
</script>
<style scoped>
.materials-tab { padding:8px; width:100%; height:100%; overflow:auto; }
.empty { color:#888; font-size:13px; padding:16px 0; }
.ops { display:flex; gap:6px; }
.loading { padding:12px; }
</style>
