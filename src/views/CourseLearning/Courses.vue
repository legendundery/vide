<template>
  <div class="courses-page">
    <div class="toolbar">
      <n-input v-model:value="keyword" placeholder="搜索课程标题或描述" clearable size="small" class="search" />
      <n-select v-model:value="sortKey" :options="sortOptions" size="small" class="sort" />
    </div>
    <div v-if="loading" class="grid">
      <n-skeleton v-for="i in 8" :key="i" height="210px" :sharp="false" />
    </div>
    <n-empty v-else-if="!filtered.length" description="暂无课程" class="empty" />
    <div v-else class="grid">
      <n-card
        v-for="c in filtered"
        :key="c.course_id"
        hoverable
        size="small"
        class="course-card"
        @click="goLessons(c.course_id)"
      >
        <div class="cover" v-if="c.cover_url">
          <img :src="c.cover_url" alt="cover" loading="lazy" />
        </div>
        <h3 class="title" :title="c.title">{{ c.title }}</h3>
        <p class="desc">{{ c.description || '暂无描述' }}</p>
        <div class="meta">
            <span>{{ c.total_duration ? Math.floor(c.total_duration / 60) : '-' }} min {{ c.total_duration ? (c.total_duration % 60) : '-' }} s</span>
            <span>评分 {{ c.avg_rating || '-' }}</span>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getCourses } from '../../api/courses';
import { NInput, NSelect, NCard, NEmpty, NSkeleton } from 'naive-ui';

interface Course { course_id: number; title: string; description: string; instructor_id: number; category?: string; price?: string; cover_url?: string; total_duration?: number; avg_rating?: string; status?: string; created_at?: string; updated_at?: string; }

const router = useRouter();
const list = ref<Course[]>([]);
const loading = ref(false);
const keyword = ref('');
const sortKey = ref<'latest' | 'duration' | 'rating'>('latest');
const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '时长', value: 'duration' },
  { label: '评分', value: 'rating' }
];

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getCourses();
    list.value = res.data || [];
  } finally { loading.value = false; }
};

onMounted(fetchList);

const filtered = computed(() => {
  let arr = list.value.filter(c => {
    if(!keyword.value) return true;
    const k = keyword.value.toLowerCase();
    return (c.title?.toLowerCase().includes(k) || c.description?.toLowerCase().includes(k));
  });
  switch(sortKey.value){
    case 'duration': arr = arr.slice().sort((a,b)=> (b.total_duration||0)-(a.total_duration||0)); break;
    case 'rating': arr = arr.slice().sort((a,b)=> parseFloat(b.avg_rating||'0') - parseFloat(a.avg_rating||'0')); break;
    default: arr = arr.slice().sort((a,b)=> (new Date(b.created_at||'').getTime()) - (new Date(a.created_at||'').getTime()));
  }
  return arr;
});

const goLessons = (id:number)=> router.push(`/lessons/${id}`);
</script>

<style scoped>
.courses-page { max-width: 1200px; margin:0 auto; padding:16px 24px 40px; }
.toolbar { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
.search { flex:1; min-width:220px; }
.sort { width:140px; }
.grid { display:grid; gap:18px; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); }
.course-card { cursor:pointer; display:flex; flex-direction:column; }
.cover { aspect-ratio:16/9; width:100%; overflow:hidden; border-radius:6px; background:#f2f2f2; margin-bottom:8px; }
.cover img { width:100%; height:100%; object-fit:cover; display:block; }
.title { font-size:15px; font-weight:600; margin:2px 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.desc { font-size:12px; line-height:1.4; color:#666; margin:0 0 8px; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:34px; }
.meta { font-size:11px; margin-top:auto; display:flex; justify-content:space-between; color:#888; }
.empty { padding:40px 0; }
@media (max-width: 640px){ .courses-page { padding:12px 16px 32px; } }
</style>
