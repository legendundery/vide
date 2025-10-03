<template>
  <div class="lesson-create">
    <div class="header-bar">
      <n-button tertiary @click="goBack">返回课程管理</n-button>
      <div class="title">
        {{ isEdit ? ('编辑课时 #'+ lessonId +' (课程 #'+ courseId +')') : ('新建课时 (课程 #'+ courseId +')') }}
      </div>
  <n-button type="primary" @click="submitLesson" :loading="submitting" :disabled="isRecording || submitting">{{ isEdit? '保存修改':'提交' }}</n-button>
    </div>
    <div class="main-split">
      <div class="left-pane">
        <n-tabs type="line" v-model:value="leftTab">
          <n-tab-pane name="video" tab="视频录制" display-directive="show">
            <!-- 编辑模式下已有视频展示 -->
            <div v-if="isEdit && existingVideoUrl && !preVideoMeta" class="existing-video-box">
              <n-alert type="info" title="已上传视频">
                <video :src="existingVideoUrl" controls preload="metadata" style="max-width:100%; border:1px solid #ccc; border-radius:4px; background:#000" />
                <div class="ex-tips">重新录制并预上传可替换（当前编辑暂未实现替换保存，只作预览）</div>
              </n-alert>
            </div>
            <VideoVue ref="recorderRef" @upload="onRecordedUpload" @video-pre-uploaded="onVideoPreUploaded" />
            <div v-if="preVideoMeta" class="pre-video-preview">
              <n-alert type="success" title="视频已预上传" closable @close="resetPreVideo">
                <div>文件名: {{ preVideoMeta.filename }} ({{ formatSize(preVideoMeta.size) }})</div>
                <div>URL: <a :href="preVideoMeta.video_url" target="_blank">{{ preVideoMeta.video_url }}</a></div>
                <div>时长: {{ formatDuration(preVideoMeta.duration) }}</div>
              </n-alert>
            </div>
          </n-tab-pane>
          <n-tab-pane name="materials" tab="课件资料" display-directive="show">
            <div v-if="isEdit && existingMaterials.length && !materialsPreUploaded" class="existing-materials-box">
              <n-alert type="info" title="已上传资料">
                <ul class="existing-materials-list">
                  <li v-for="m in existingMaterials" :key="m.filename" :class="{'to-remove': removedExistingMaterials.has(m.filename)}">
                    <a :href="m.url" target="_blank">{{ m.original || m.filename }}</a>
                    <span class="meta">{{ formatSize(m.size) }} · {{ m.mime }}</span>
                    <n-button size="tiny" tertiary type="error" @click="toggleRemoveExisting(m)">
                      {{ removedExistingMaterials.has(m.filename)? '撤销':'删除' }}
                    </n-button>
                  </li>
                </ul>
              </n-alert>
            </div>
            <div class="materials-actions">
              <n-space>
                <n-upload
                  multiple
                  :default-upload="false"
                  :file-list="materialFileList"
                  :on-before-upload="beforeMaterialUpload"
                  @change="onMaterialsChange"
                  :disabled="materialsPreUploaded || uploadingMaterials"
                >
                  <n-button :disabled="materialsPreUploaded || uploadingMaterials">选择资料文件</n-button>
                </n-upload>
                <n-button
                  type="primary"
                  secondary
                  :loading="uploadingMaterials"
                  :disabled="!materialFileList.length || materialsPreUploaded || uploadingMaterials"
                  @click="preUploadMaterials"
                >{{ materialsPreUploaded ? '已预上传' : '预上传资料' }}</n-button>
                <n-button quaternary v-if="materialsPreUploaded" @click="resetPreMaterials">重置</n-button>
              </n-space>
            </div>
            <ul class="material-list" v-if="materialFileList.length && !materialsPreUploaded">
              <li v-for="f in materialFileList" :key="f.id">{{ f.name }} ({{ formatSize(f.file?.size) }})</li>
            </ul>
            <div v-if="!materialFileList.length && !materialsPreUploaded" class="materials-hint">未选择资料文件（可选）</div>
            <div v-if="materialsPreUploaded" class="materials-pre-json">
              <n-alert type="success" title="资料已预上传" closable @close="resetPreMaterials">
                <div class="json-preview">
                  <pre>{{ JSON.stringify(preMaterialsJson, null, 2) }}</pre>
                </div>
              </n-alert>
            </div>
          </n-tab-pane>
        </n-tabs>
        <div class="text-sections">
          <n-form :model="form">
            <n-form-item label="课时标题"><n-input v-model:value="form.title" /></n-form-item>
            <n-form-item label="排序序号"><n-input-number v-model:value="form.sort_order" :min="0" /></n-form-item>
            <n-form-item label="课程介绍">
              <n-input v-model:value="form.intro_text" type="textarea" rows="5" />
            </n-form-item>
            <n-form-item label="课后任务">
              <n-input v-model:value="form.homework_text" type="textarea" rows="5" />
            </n-form-item>
          </n-form>
        </div>
      </div>
      <div class="right-pane">
        <div class="code-pane-split">
          <div class="code-pane-top">
            <DraggableBlocks :BlockId="codingLeafId" />
          </div>
          <div class="code-pane-bottom">
            <DraggableBlocks BlockId="rd" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NTabs, NTabPane, NButton, NForm, NFormItem, NInput, NInputNumber, NUpload, useMessage, NAlert, NSpace } from 'naive-ui';
import VideoVue from '../../components/Video/videoVue.vue';
import DraggableBlocks from '../../components/DragLayOut/DraggableBlocks.vue';
import { updateLesson, uploadRecordedVideo, uploadMaterialsOnly } from '../../api/courses';
import { CodingStore } from '../../stores/CodingStore';
import { LayOutStore } from '../../stores/LayOutStore';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const recorderRef = ref<any>(null);
const isRecording = ref(false);
const recordedFile = ref<File|null>(null);
const preVideoMeta = ref<any>(null);
const leftTab = ref('video');
const submitting = ref(false);
const form = ref({
  title: '',
  sort_order: 0,
  intro_text: '',
  homework_text: ''
});

const courseId = route.query.course_id || route.params.courseId || route.params.course_id; // 入口携带
const lessonId = route.params.lessonId as any;
const isEdit = !!lessonId;

// 预上传资料状态
const uploadingMaterials = ref(false);
const materialsPreUploaded = ref(false);
const preMaterialsJson = ref<any[]>([]); // 预上传返回的 items
// 编辑模式下已有资源
const existingVideoUrl = ref<string>('');
const existingMaterials = ref<any[]>([]);
const removedExistingMaterials = ref<Set<string>>(new Set());

function toggleRemoveExisting(m:any){
  const set = removedExistingMaterials.value;
  if(set.has(m.filename)) set.delete(m.filename); else set.add(m.filename);
  // 触发视图更新：重新赋值引用（Vue3对于 Set 内部变更不总是追踪）
  removedExistingMaterials.value = new Set(set);
}
// 这里假设右侧使用包含 CodeEditor 的 leaf id: 需由实际 layout 决定, 先写死 'ru'
const codingLeafId = 'ru';
const codingStore = CodingStore();
const layoutStore = LayOutStore();

// ================= 实时时间线采集 =================
// 需求：录制课程时，每 0.25s 记录一次(若有变化)；以及每次 keydown / click 强制捕获
// 结构：[{ t: <秒>, leafId, tabs:[{label,path, code,input,output}], reason }]
const timelineRt = ref<any[]>([]);
const SNAP_INTERVAL = 250; // ms
let timelineStart = performance.now();
let timelineTimer: number | undefined;
let lastSignature = '';

function nowSeconds(){ return parseFloat(((performance.now() - timelineStart)/1000).toFixed(3)); }

function buildTabsSnapshot(){
  const leaf = layoutStore.Leafs.find(l=> l.id === codingLeafId);
  if(!leaf) return [] as any[];
  return leaf.pages
    .filter(p=> ['CodeEditor','CodeInput','CodeOutput'].includes(p.path))
    .map(p=> ({
      label: p.Tabs,
      path: p.path,
      code: (p as any)?.code || (p.path==='CodeEditor'? codingStore.code: ''),
      input: p.path==='CodeInput'? codingStore.input : '',
      output: p.path==='CodeOutput'? codingStore.output : ((p as any)?.output || ''),
    }));
}

function snapshot(reason:string){
  const tabs = buildTabsSnapshot();
  if(!tabs.length) return;
  // 生成签名，避免重复存储
  const sig = tabs.map(t=> t.path+':'+(t.code||t.input||t.output||'')).join('|');
  if(reason === 'interval' && sig === lastSignature) return; // 周期性且无变化则跳过
  lastSignature = sig;
  timelineRt.value.push({ t: nowSeconds(), leafId: codingLeafId, tabs, reason });
}

function intervalLoop(){
  // 不再依赖 isRecording，始终采集；仍可在未来增加“启用设备后才采集”逻辑
  snapshot('interval');
}

function handleKey(){ snapshot('keydown'); }
function handleClick(){ snapshot('click'); }

function startTimelineCapture(){
  timelineStart = performance.now();
  timelineRt.value = [];
  lastSignature = '';
  snapshot('start');
  timelineTimer = window.setInterval(intervalLoop, SNAP_INTERVAL);
  window.addEventListener('keydown', handleKey, true);
  window.addEventListener('click', handleClick, true);
}
function stopTimelineCapture(){
  if(timelineTimer) clearInterval(timelineTimer);
  window.removeEventListener('keydown', handleKey, true);
  window.removeEventListener('click', handleClick, true);
  snapshot('end');
}

// 录制组件上传事件回调 (模板引用)
function onRecordedUpload(file:any){
  recordedFile.value = file;
  message.success('已获取录制文件，可随提交一起上传');
}
function onVideoPreUploaded(meta:any){
  preVideoMeta.value = meta;
  message.success('视频已预上传');
}
function resetPreVideo(){
  preVideoMeta.value = null;
  // 若用户关闭预上传展示，可重新录制并再预上传
}

function releaseMedia(){
  try { recorderRef.value?.stopCapture && recorderRef.value.stopCapture(); } catch(_){}}
function goBack(){ releaseMedia(); router.back(); }

// 兼容方法：如果实时时间线为空（极端情况），构造一个初始快照
function buildCodeTimelineFallback(){
  const tabs = buildTabsSnapshot();
  if(!tabs.length) return [];
  return [{ t: 0, leafId: codingLeafId, tabs, reason:'single' }];
}

const materialFileList = ref<any[]>([]);

const allowMaterialTypes = [
  'application/pdf','application/zip','application/x-zip-compressed','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp'
];

function beforeMaterialUpload(data:any){
  const file = data.file.file as File;
  if(file.size > 100 * 1024 * 1024){
    message.error(`${file.name} 超过 100MB 限制`);
    return false;
  }
  if(!allowMaterialTypes.includes(file.type)){
    message.error(`${file.name} 类型不允许: ${file.type}`);
    return false;
  }
  return true;
}
function onMaterialsChange(e:any){ materialFileList.value = e.fileList; }

function formatSize(size?:number){
  if(!size && size!==0) return '';
  if(size < 1024) return size + ' B';
  if(size < 1024*1024) return (size/1024).toFixed(1)+' KB';
  return (size/1024/1024).toFixed(1)+' MB';
}
function formatDuration(sec?:number){
  if(!sec && sec!==0) return '';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return m+':' + String(s).padStart(2,'0');
}

async function preUploadMaterials(){
  if(!materialFileList.value.length) return;
  uploadingMaterials.value = true;
  try {
    const files = materialFileList.value.map(f=> f.file).filter(Boolean) as File[];
    const resp = await uploadMaterialsOnly(files);
    preMaterialsJson.value = resp.data.items || [];
    materialsPreUploaded.value = true;
    message.success('资料预上传成功');
  } catch(e:any){
    console.error(e);
    message.error(e?.response?.data?.error || '资料预上传失败');
  } finally { uploadingMaterials.value = false; }
}
function resetPreMaterials(){
  materialsPreUploaded.value = false;
  preMaterialsJson.value = [];
  // 不清空原文件列表，允许重新预上传或随课时直接上传
}

// 修改提交逻辑：发送 selectedMaterialIds / 或预上传 JSON
async function submitLesson(){
  if(!form.value.title){ return message.error('请填写标题'); }
  submitting.value = true;
  try {
  // 若还未采集到任何时间线（异常或未开始录制），补一个快照
  const timelineData = timelineRt.value.length ? timelineRt.value : buildCodeTimelineFallback();
    const videoFile = recordedFile.value 
      ? recordedFile.value 
      : (recorderRef.value?.recordedBlob 
          ? new File([recorderRef.value.recordedBlob], `${form.value.title}.mp4`, { type: 'video/mp4' }) 
          : undefined);

    if(!isEdit && !videoFile && !preVideoMeta.value?.filename){
      submitting.value = false;
      return message.error('未获取到录制视频或未预上传，请先录制/预上传');
    }

    if(!isEdit){
      const materials = materialFileList.value.map(f=> f.file).filter(Boolean) as File[];
      const payload:any = {
        course_id: courseId as any,
        title: form.value.title,
        sort_order: form.value.sort_order,
        intro_text: form.value.intro_text,
        homework_text: form.value.homework_text,
  code_timeline_json: JSON.stringify(timelineData),
      };
      if(preVideoMeta.value?.filename){
        payload.pre_video_filename = preVideoMeta.value.filename;
      } else if(videoFile){
        payload.video_file = videoFile;
      }
      if(materialsPreUploaded.value){
        payload.pre_materials_json = preMaterialsJson.value;
      } else if(materials.length){
        payload.materials = materials;
      }
      await uploadRecordedVideo(payload);
      message.success('创建成功');
      goBack();
    } else {
      // 编辑模式：构造更新 payload
      const payload:any = {
        title: form.value.title,
        sort_order: form.value.sort_order,
        intro_text: form.value.intro_text,
        homework_text: form.value.homework_text,
        code_timeline_json: JSON.stringify(timelineRt.value.length ? timelineRt.value : buildCodeTimelineFallback()),
      };
      // 视频替换策略：若预上传有 filename 则传 pre_video_filename；（暂不支持直接在编辑页重新录制? 如果支持可加入 video_file）
      if(preVideoMeta.value?.filename){
        payload.pre_video_filename = preVideoMeta.value.filename;
      }
      // 资料处理：
      // 1. 如果用户预上传新的，则合并 old(去掉被删除) + preMaterials
      // 2. 如果用户只是删除旧的，则发送 materials_json 覆盖
      const keptOld = existingMaterials.value.filter(m=> !removedExistingMaterials.value.has(m.filename));
      if(materialsPreUploaded.value){
        // 合并旧保留 + 预上传
        payload.materials_json = [...keptOld, ...preMaterialsJson.value];
      } else if(removedExistingMaterials.value.size){
        payload.materials_json = keptOld;
      }
      // 如果用户还选了本次直接随更新上传的材料 (未预上传) 则追加 materials 文件 (后端会在未传 materials_json 情况下合并)
      if(!payload.materials_json && materialFileList.value.length && !materialsPreUploaded.value){
        const directFiles = materialFileList.value.map(f=> f.file).filter(Boolean) as File[];
        if(directFiles.length){
          payload.materials = directFiles;
        }
      }
      await updateLesson(lessonId, payload);
      message.success('已保存修改');
      goBack();
    }
  } catch (e:any) {
    console.error(e);
    message.error(e?.response?.data?.error || '创建失败');
  } finally { submitting.value = false; }
}

const timerRef = ref<number|undefined>(undefined);

onMounted(async ()=>{
  if(isEdit){
    try {
      const detail = await (await import('../../api/courses')).getLessonDetail(courseId as any, lessonId);
      const d = detail.data;
      form.value.title = d.title;
      form.value.sort_order = d.sort_order || 0;
      form.value.intro_text = d.intro_text || '';
      form.value.homework_text = d.homework_text || '';
      existingVideoUrl.value = d.video_url || '';
      if(d.materials_json){
        try { existingMaterials.value = typeof d.materials_json === 'string'? JSON.parse(d.materials_json): d.materials_json; } catch(_) {}
      }
    } catch(e:any){
      message.error(e?.response?.data?.error || '加载课时失败');
    }
  }
  startTimelineCapture();
  // 代码/输入/输出变化立即捕获（去重仍由签名控制）
  watch(()=> codingStore.code, ()=> snapshot('code-change'));
  watch(()=> codingStore.input, ()=> snapshot('input-change'));
  watch(()=> codingStore.output, ()=> snapshot('output-change'));
  timerRef.value = window.setInterval(()=>{
    if(recorderRef.value){
      isRecording.value = recorderRef.value.status === 'recording';
    }
  }, 400);
  window.addEventListener('beforeunload', releaseMedia);
});

onUnmounted(()=>{ if(timerRef.value) clearInterval(timerRef.value); window.removeEventListener('beforeunload', releaseMedia); releaseMedia(); stopTimelineCapture(); });
</script>
<style scoped>
.lesson-create { display:flex; flex-direction:column; height:100%; }
.header-bar { display:flex; align-items:center; gap:16px; padding:8px 12px; background:#f5f5f5; }
.header-bar .title { flex:1; font-weight:600; }
.main-split { flex:1; display:flex; overflow:hidden; }
.left-pane { width:45%; display:flex; flex-direction:column; overflow:auto; padding:8px; gap:8px; border-right:1px solid #eee; }
.right-pane { flex:1; position:relative; overflow:hidden; }
.code-pane-split { display:flex; flex-direction:column; height:100%; }
.code-pane-top { flex:1; min-height:0; border-bottom:1px solid #ddd; }
.code-pane-bottom { flex:1; min-height:0; }
.text-sections { margin-top:8px; }
.materials-actions { margin-bottom:8px; }
.materials-list-wrapper { max-height:280px; overflow:auto; border:1px solid #eee; border-radius:4px; padding:4px; background:#fff; }
.selected-preview { margin-top:8px; font-size:12px; color:#555; display:flex; align-items:center; gap:8px; }
.material-list { margin:8px 0 0; padding-left:16px; font-size:12px; }
.materials-pre-json pre { max-height:260px; overflow:auto; background:#f8f8f8; padding:8px; border-radius:4px; }
.pre-video-preview { margin-top:12px; }
.existing-video-box { margin-bottom:12px; }
.existing-materials-box { margin-bottom:12px; }
.existing-materials-list { list-style:none; padding:0; margin:4px 0 0; }
.existing-materials-list li { font-size:12px; margin-bottom:4px; display:flex; gap:6px; align-items:center; }
.existing-materials-list li.to-remove { opacity:0.5; text-decoration:line-through; }
.existing-materials-list a { color:#18a058; text-decoration:none; }
.existing-materials-list a:hover { text-decoration:underline; }
.existing-materials-list .meta { color:#888; }
.ex-tips { font-size:11px; color:#666; margin-top:4px; }
</style>
