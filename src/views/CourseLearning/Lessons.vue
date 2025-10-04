<template>
  <div class="lesson-list-page">
    <div class="course-head" v-if="loadingCourse">
      <n-skeleton text :repeat="3" style="max-width:520px" />
    </div>
    <div class="course-head" v-else>
      <div class="cover" v-if="course.cover_url"><img :src="course.cover_url" alt="cover" /></div>
      <div class="info">
        <h1 class="title">{{ course.title }}</h1>
        <p class="desc">{{ course.description || '暂无课程描述。' }}</p>
        <div class="meta">
          <span>总时长: {{ course.total_duration || '-' }} 秒</span>
          <span>评分: {{ course.avg_rating || '-' }}</span>
          <span>状态: {{ course.status || '-' }}</span>
        </div>
      </div>
    </div>

    <div class="lessons-section">
      <h2 class="section-title">课时列表</h2>
      <div v-if="loadingLessons" class="lesson-skeleton">
        <n-skeleton v-for="i in 6" :key="i" height="54px" />
      </div>
      <n-empty v-else-if="!lessons.length" description="暂无课时" />
      <n-list v-else clickable bordered class="lesson-list">
        <n-list-item v-for="l in lessons" :key="l.lesson_id" @click="openLesson(l.lesson_id)">
          <template #prefix>
            <n-tag type="success" size="small">{{ l.sort_order }}</n-tag>
          </template>
          <div class="l-title">{{ l.title }}</div>
          <template #suffix>
            <span class="duration">{{ l.duration ? Math.floor(l.duration / 60) : '-' }}min{{ l.duration ? (l.duration % 60) : '-' }}s</span>
          </template>
        </n-list-item>
      </n-list>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCoursesSingle, getLessons } from '../../api/courses';
import { NList, NListItem, NSkeleton, NEmpty, NTag } from 'naive-ui';

interface Course { course_id:number; title:string; description:string; instructor_id:number; category?:string; price?:string; cover_url?:string; total_duration?:number; avg_rating?:string; status?:string; created_at?:string; updated_at?:string; }
interface Lesson { lesson_id:number; course_id:number; title:string; video_url:string; duration?:number; sort_order:number; }

const route = useRoute();
const router = useRouter();
const courseId = route.params.id as string;

const course = ref<Partial<Course>>({});
const lessons = ref<Lesson[]>([]);
const loadingCourse = ref(false);
const loadingLessons = ref(false);

const fetchCourse = async () => {
  loadingCourse.value = true; try { const r = await getCoursesSingle(courseId); course.value = r.data || {}; } finally { loadingCourse.value = false; }
};
const fetchLessons = async () => {
  loadingLessons.value = true; try { const r = await getLessons(courseId); lessons.value = (r.data||[]).sort((a:Lesson,b:Lesson)=> a.sort_order - b.sort_order); } finally { loadingLessons.value = false; }
};

onMounted(()=>{ fetchCourse(); fetchLessons(); });

const openLesson = (lessonId:number)=> router.push(`/lesson-player/${courseId}/${lessonId}`);
</script>

<style scoped>
.lesson-list-page { max-width: 1080px; margin:0 auto; padding:24px 20px 60px; }
.course-head { display:flex; gap:28px; margin-bottom:40px; }
.cover { width:260px; aspect-ratio:16/10; background:#f3f3f3; border-radius:8px; overflow:hidden; flex-shrink:0; }
.cover img { width:100%; height:100%; object-fit:cover; display:block; }
.info { flex:1; }
.title { font-size:28px; margin:0 0 16px; font-weight:600; }
.desc { margin:0 0 18px; color:#555; line-height:1.55; }
.meta { display:flex; flex-wrap:wrap; gap:18px; font-size:13px; color:#666; }
.section-title { font-size:20px; margin:0 0 16px; font-weight:600; }
.lesson-list { background:#fff; border-radius:8px; overflow:hidden; }
.l-title { font-size:14px; font-weight:500; }
.duration { font-size:12px; color:#888; width : 180px; text-align: right; }
.lesson-skeleton { display:flex; flex-direction:column; gap:10px; }
@media (max-width: 780px){ .course-head { flex-direction:column; } .cover { width:100%; } .title { font-size:22px; } }
</style>
