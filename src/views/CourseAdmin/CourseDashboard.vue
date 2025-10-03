<template>
  <div class="course-dashboard">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="goCreateCourse">新建课程</n-button>
        <n-input v-model:value="keyword" placeholder="搜索标题" clearable style="width:220px" />
        <n-button tertiary size="small" @click="refresh" :loading="loading">刷新</n-button>
      </n-space>
    </div>
    <n-data-table :columns="columns" :data="filtered" :loading="loading" size="small" :bordered="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { getManageCourses, deleteCourse } from '../../api/courses';
import { NButton, useMessage, NSpace, NInput, NDataTable } from 'naive-ui';

interface CourseRow { course_id:number; title:string; description:string; status:string; instructor_id:number; category?:string; price?:number; }

const router = useRouter();
const message = useMessage();
const loading = ref(false);
const rows = ref<CourseRow[]>([]);
const keyword = ref('');

const refresh = async () => {
  loading.value = true;
  try {
    const r = await getManageCourses();
    rows.value = r.data || [];
  } catch (e:any) {
    message.error(e?.response?.data?.error || '加载失败');
  } finally {
    loading.value = false;
  }
};

const filtered = computed(()=> rows.value.filter(r=> !keyword.value || r.title.includes(keyword.value)) );

const goCreateCourse = ()=> router.push('/courses-admin/course-create');
const goManage = (row:CourseRow)=> router.push(`/courses-admin/manage/${row.course_id}`);

const onDelete = async (row:CourseRow)=> {
  if(!confirm('确认删除该课程?')) return;
  try {
    await deleteCourse(row.course_id);
    message.success('已删除');
    refresh();
  } catch(e:any){
    message.error(e?.response?.data?.error||'删除失败');
  }
};

const columns = [
  { title:'ID', key:'course_id', width:70 },
  { title:'标题', key:'title', ellipsis:true },
  { title:'状态', key:'status', width:90 },
  { title:'讲师', key:'instructor_id', width:80 },
  { title:'操作', key:'actions', width:180, render(row:CourseRow){
      return h(NSpace, { size:4 }, {
        default: ()=> [
          h(NButton, { size:'tiny', onClick:()=>goManage(row) }, { default:()=> '管理' }),
          h(NButton, { size:'tiny', type:'error', quaternary:true, onClick:()=>onDelete(row) }, { default:()=> '删除' })
        ]
      });
    }
  }
];

refresh();
</script>

<style scoped>
.course-dashboard { padding:12px; }
.toolbar { margin-bottom:8px; }
</style>