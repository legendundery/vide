<template>
  <div class="lesson-player-page">
    <div class="top-bar">
      <div class="course-info">
        <n-breadcrumb separator="/">
          <n-breadcrumb-item @click="goCourses" class="link">课程</n-breadcrumb-item>
          <n-breadcrumb-item @click="goLessons(courseId)" class="link">{{ course?.title || '...' }}</n-breadcrumb-item>
          <n-breadcrumb-item>{{ currentLesson?.title || '播放' }}</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="lesson-switch">
        <n-select v-model:value="currentLessonId" :options="lessonOptions" size="small" style="width: 260px" @update:value="onSelectLesson" />
        <n-button size="small" @click="prevLesson" :disabled="!hasPrev">上一课</n-button>
        <n-button size="small" @click="nextLesson" :disabled="!hasNext">下一课</n-button>
      </div>
    </div>
    <div class="layout-wrapper">
      <DragLayOut />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCoursesSingle, getLessons, getLessonDetail } from '../../api/courses';
import DragLayOut from '../../components/DragLayOut/DragLayOut.vue';
import { NBreadcrumb, NBreadcrumbItem, NSelect, NButton } from 'naive-ui';
import { LayOutStore } from '../../stores/LayOutStore';

interface Course { course_id:number; title:string; description:string; }
interface Lesson { lesson_id:number; course_id:number; title:string; video_url:string; sort_order:number; duration?:number; }

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId as string;
const lessonIdParam = route.params.lessonId as string;

const course = ref<Course | null>(null);
const lessons = ref<Lesson[]>([]);
const currentLessonId = ref<number | null>(lessonIdParam ? Number(lessonIdParam) : null);

const lessonOptions = computed(()=> lessons.value.map(l=> ({ label: `${l.sort_order}. ${l.title}`, value: l.lesson_id })) );
const currentLesson = computed(()=> lessons.value.find(l=> l.lesson_id === currentLessonId.value));
// 资料 JSON
const materialsList = ref<any[]>([]);

watch(currentLessonId, async (id)=>{
  materialsList.value = [];
  if(!id) return;
  try {
    const detail = await getLessonDetail(courseId, id);
    const d = detail.data;
    if(d.materials_json){
      try { materialsList.value = typeof d.materials_json === 'string'? JSON.parse(d.materials_json): d.materials_json; } catch(_) {}
    }
  } catch(_){}
});

function formatSize(size?:number){
  if(!size && size!==0) return '';
  if(size < 1024) return size + 'B';
  if(size < 1024*1024) return (size/1024).toFixed(1)+'KB';
  return (size/1024/1024).toFixed(1)+'MB';
}
const currentIndex = computed(()=> lessons.value.findIndex(l=> l.lesson_id === currentLessonId.value));
const hasPrev = computed(()=> currentIndex.value > 0);
const hasNext = computed(()=> currentIndex.value >=0 && currentIndex.value < lessons.value.length -1);

const layoutStore = LayOutStore();

const initTabs = ()=>{ layoutStore.ensureLessonPlayerTabs(); };

const fetchData = async () => {
  try { const c = await getCoursesSingle(courseId); course.value = c.data || null; } catch(_){}
  try { const r = await getLessons(courseId); lessons.value = (r.data||[]).sort((a:Lesson,b:Lesson)=> a.sort_order - b.sort_order); if(currentLessonId.value===null && lessons.value.length) currentLessonId.value = lessons.value[0].lesson_id; } catch(_){}
};

onMounted(()=>{ fetchData(); initTabs(); });
watch(()=> currentLessonId.value, (id)=> { if(id) router.replace(`/lesson-player/${courseId}/${id}`); });

const onSelectLesson = (id:number)=> { currentLessonId.value = id; };
const prevLesson = ()=> { if(hasPrev.value) currentLessonId.value = lessons.value[currentIndex.value -1].lesson_id; };
const nextLesson = ()=> { if(hasNext.value) currentLessonId.value = lessons.value[currentIndex.value +1].lesson_id; };

// navigation helpers
const goCourses = ()=> router.push('/courses');
const goLessons = (cid:string|number)=> router.push(`/lessons/${cid}`);
</script>

<style scoped>
.lesson-player-page { height:100%; display:flex; flex-direction:column; }
.top-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:#fff; border-bottom:1px solid #e4e4e4; gap:24px; flex-wrap:wrap; }
.course-info { font-size:14px; }
.lesson-switch { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.layout-wrapper { flex:1; height:calc(100vh - 56px); }
.link { cursor:pointer; }
.link:hover { color:#18a058; }
</style>
