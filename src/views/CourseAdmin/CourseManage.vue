<template>
  <div class="course-manage" v-if="loaded">
    <div class="header">
      <n-button quaternary size="small" @click="goBack">返回</n-button>
      <h3 style="margin:0 0 0 12px">课程管理 #{{ courseId }}</h3>
    </div>
    <n-card title="课程信息" size="small" :bordered="false" class="block">
      <n-form label-width="80" :model="courseForm" size="small">
        <n-form-item label="标题"><n-input v-model:value="courseForm.title" /></n-form-item>
        <n-form-item label="描述"><n-input v-model:value="courseForm.description" type="textarea" /></n-form-item>
        <n-form-item label="分类"><n-input v-model:value="courseForm.category" /></n-form-item>
        <n-form-item label="价格"><n-input-number v-model:value="courseForm.price" :min="0" /></n-form-item>
        <n-form-item label="状态"><n-select v-model:value="courseForm.status" :options="statusOptions" style="width:140px" /></n-form-item>
        <n-form-item label="封面">
          <div class="cover-manage">
            <div v-if="courseForm.cover_url && !newCoverPreview" class="current-cover">
              <img :src="courseForm.cover_url" alt="cover" />
            </div>
            <div v-else-if="newCoverPreview" class="current-cover">
              <img :src="newCoverPreview" alt="new-cover" />
            </div>
            <div class="cover-actions">
              <n-upload :default-upload="false" :max="1" @change="onCoverFileChange" :disabled="uploadingCover">
                <n-button size="tiny" :loading="uploadingCover">{{ newCoverFile ? '重新选择':'选择新封面' }}</n-button>
              </n-upload>
              <n-button v-if="newCoverFile" size="tiny" tertiary @click="submitNewCover" :loading="uploadingCover">上传</n-button>
              <n-button v-if="courseForm.cover_url" size="tiny" quaternary type="warning" @click="removeCover" :loading="removingCover">移除</n-button>
              <n-button v-if="newCoverFile" size="tiny" quaternary @click="cancelNewCover">取消</n-button>
            </div>
          </div>
        </n-form-item>
        <n-form-item label="Metadata">
          <n-input type="textarea" v-model:value="metadataStr" placeholder="JSON" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="savingCourse" @click="saveCourse">保存课程</n-button>
        </n-form-item>
      </n-form>
    </n-card>
    <n-card title="课时列表" size="small" :bordered="false" class="block">
      <div class="lesson-toolbar">
        <n-button size="small" type="primary" @click="goCreateLesson">新增课时</n-button>
      </div>
      <n-data-table :columns="lessonColumns" :data="lessons" size="small" :bordered="false" />
    </n-card>

  </div>
  <n-empty description="Loading..." v-else />
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCoursesSingle, getLessons, updateCourse, deleteLesson, updateCourseCover, removeCourseCover } from '../../api/courses';
import { useMessage, NButton, NCard, NForm, NFormItem, NInput, NSelect, NInputNumber, NDataTable, NEmpty } from 'naive-ui';

interface Lesson { lesson_id:number; course_id:number; title:string; sort_order:number; duration:number; metadata?:any }

const route = useRoute();
const router = useRouter();
const message = useMessage();
const courseId = route.params.courseId as string;

const loaded = ref(false);
const savingCourse = ref(false);

const courseForm = reactive<any>({ title:'', description:'', category:'', price:0, status:'draft', cover_url:'' });
const metadataStr = ref('');
const lessons = ref<Lesson[]>([]);
// cover management state
const newCoverFile = ref<File|null>(null);
const newCoverPreview = ref('');
const uploadingCover = ref(false);
const removingCover = ref(false);

const statusOptions = [
  { label:'草稿', value:'draft' },
  { label:'published', value:'published' },
  { label:'hidden', value:'hidden' }
];

// lesson modal state

async function init(){
  try {
    const c = await getCoursesSingle(courseId);
    Object.assign(courseForm, c.data || {});
    if(typeof courseForm.price === 'string'){
      const n = parseFloat(courseForm.price);
      courseForm.price = isNaN(n)? 0 : n;
    }
    if(c.data?.metadata){ metadataStr.value = typeof c.data.metadata === 'string'? c.data.metadata: JSON.stringify(c.data.metadata, null, 2); }
    const l = await getLessons(courseId);
    lessons.value = (l.data||[]).sort((a:Lesson,b:Lesson)=> a.sort_order-b.sort_order);
  } catch(e:any){
    message.error(e?.response?.data?.error||'加载失败');
  } finally { loaded.value = true; }
}

init();

const saveCourse = async ()=> {
  savingCourse.value = true;
  try {
    if(typeof courseForm.price === 'string'){
      const n = parseFloat(courseForm.price); courseForm.price = isNaN(n)? 0 : n;
    }
    let metadata: any = undefined;
    if(metadataStr.value.trim()){
      try { metadata = JSON.parse(metadataStr.value); } catch(e){ return message.error('Metadata JSON 不合法'); }
    }
    await updateCourse(courseId, { ...courseForm, metadata });
    message.success('课程已保存');
  } catch(e:any){
    message.error(e?.response?.data?.error||'保存失败');
  } finally { savingCourse.value = false; }
};

function onCoverFileChange(options:any){
  if(options.fileList.length>0){
    newCoverFile.value = options.file.file;
    newCoverPreview.value = URL.createObjectURL(options.file.file);
  } else {
    newCoverFile.value = null; newCoverPreview.value='';
  }
}

function cancelNewCover(){ newCoverFile.value=null; newCoverPreview.value=''; }

async function submitNewCover(){
  if(!newCoverFile.value) return;
  uploadingCover.value = true;
  try {
    const res = await updateCourseCover(courseId, newCoverFile.value);
    courseForm.cover_url = res.data.cover_url;
    cancelNewCover();
    message.success('封面已更新');
  } catch(e:any){
    message.error(e?.response?.data?.error||'封面更新失败');
  } finally { uploadingCover.value = false; }
}

async function removeCover(){
  if(!courseForm.cover_url) return;
  if(!confirm('确认移除封面?')) return;
  removingCover.value = true;
  try {
    await removeCourseCover(courseId);
    courseForm.cover_url='';
    message.success('封面已移除');
  } catch(e:any){
    message.error(e?.response?.data?.error||'移除失败');
  } finally { removingCover.value = false; }
}

function goCreateLesson(){
  router.push({ name:'lesson-create', query:{ course_id: courseId }});
}

function openEditLesson(row:Lesson){
  router.push({ name:'lesson-edit', params:{ courseId: courseId, lessonId: row.lesson_id }});
}


async function removeLesson(row:Lesson){
  if(!confirm('确认删除该课时?')) return;
  try {
    await deleteLesson(courseId, row.lesson_id);
    lessons.value = lessons.value.filter(l=> l.lesson_id!==row.lesson_id);
    message.success('已删除');
  } catch(e:any){
    message.error(e?.response?.data?.error||'删除失败');
  }
}

const lessonColumns = [
  { title:'ID', key:'lesson_id', width:70 },
  { title:'标题', key:'title' },
  { title:'序号', key:'sort_order', width:80 },
  { title:'时长', key:'duration', width:80 },
  { title:'操作', key:'actions', width:180, render(row:Lesson){
      return [
        h(NButton, { size:'tiny', onClick:()=>openEditLesson(row) }, { default:()=> '编辑' }),
        h(NButton, { size:'tiny', quaternary:true, type:'error', onClick:()=>removeLesson(row) }, { default:()=> '删除' })
      ];
    }
  }
];

const goBack = ()=> router.push('/courses-admin/dashboard');
</script>

<style scoped>
.course-manage { padding:12px; }
.block { margin-bottom:16px; }
.header { display:flex; align-items:center; margin-bottom:8px; }
.lesson-toolbar { margin-bottom:8px; }
.cover-manage { display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; }
.current-cover img { width:140px; height:94px; object-fit:cover; border:1px solid #ddd; border-radius:4px; }
.cover-actions { display:flex; gap:6px; align-items:center; }
</style>