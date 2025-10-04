<template>
  <div class="lesson-play-tab" v-if="loading">
    <n-skeleton text :repeat="3" />
  </div>
  <div v-else class="lesson-play-tab">
    <div class="video-wrapper">
      <div v-if="!videoUrl" class="no-video">暂无视频</div>
  <video v-else ref="videoRef" :src="videoUrl" controls preload="metadata" />
    </div>
    <div class="meta-section" v-if="introText || homeworkText">
      <div v-if="introText" class="intro-block">
        <h4>课程介绍</h4>
        <div class="text" v-html="introHtml"></div>
      </div>
      <div v-if="homeworkText" class="homework-block">
        <h4>课后任务</h4>
        <div class="text" v-html="homeworkHtml"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { CodingStore } from '../../../stores/CodingStore';
import { useRoute } from 'vue-router';
import { getLessonDetail } from '../../../api/courses';
import { NSkeleton } from 'naive-ui';

const route = useRoute();
const videoUrl = ref('');
const loading = ref(true);
const introText = ref('');
const homeworkText = ref('');
const videoRef = ref<HTMLVideoElement|null>(null);
const codingStore = CodingStore();
// 标记视频事件是否已绑定，避免重复绑定
let videoEventsAttached = false;

// 简单转义为 HTML（可拓展 markdown 渲染）
function escapeHtml(s:string){
  return s.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c));
}
const introHtml = computed(()=> escapeHtml(introText.value).replace(/\n/g,'<br/>'));
const homeworkHtml = computed(()=> escapeHtml(homeworkText.value).replace(/\n/g,'<br/>'));

async function fetchLesson(){
  loading.value = true;
  try {
    const courseId = route.params.courseId as any;
    const lessonId = route.params.lessonId as any;
    if(courseId && lessonId){
      const r = await getLessonDetail(courseId, lessonId);
      videoUrl.value = r.data?.video_url || '';
      introText.value = r.data?.intro_text || '';
      homeworkText.value = r.data?.homework_text || '';
      // 载入时间线（假设 code_timeline_json 是字符串或对象）
      if(r.data?.code_timeline_json){
        try {
          const parsed = typeof r.data.code_timeline_json === 'string'? JSON.parse(r.data.code_timeline_json): r.data.code_timeline_json;
          if(Array.isArray(parsed)) { 
            codingStore.loadTimeline(parsed);
            const norm = codingStore.timeline;
            console.groupCollapsed('%c[LessonPlay] Timeline Loaded (Normalized)','color:#4caf50;font-weight:bold');
            console.log('rawLength=', parsed.length, 'normalizedLength=', norm.length, 'offset=', codingStore.timelineOffset);
            console.table(norm.slice(0,20).map(s=>({t:s.t, codeLen:s.code?.length||0, hasCode:!!s.code, reason:s._reason})));
            if(norm.length>20) console.log('... total', norm.length);
            console.groupEnd();
            // 立即应用首段，避免等待第一帧事件
            const firstSeg = codingStore.resolveSegment(0);
            if(firstSeg){
              if(typeof firstSeg.code === 'string') codingStore.code = firstSeg.code;
              if(typeof firstSeg.input === 'string') codingStore.input = firstSeg.input;
              if(typeof firstSeg.output === 'string') codingStore.output = firstSeg.output;
              console.log('%c[LessonPlay] Initial segment applied t='+firstSeg.t,'color:#9c27b0');
            }
          }
        } catch(e){ console.warn('[LessonPlay] parse timeline failed', e); }
      }
    }
  } finally { loading.value = false; }
}

onMounted(fetchLesson);
watch(()=> [route.params.courseId, route.params.lessonId], fetchLesson);

function emitCodeSync(type:string){
  window.dispatchEvent(new CustomEvent('lesson-video-sync', { detail: { type, ts: videoRef.value?.currentTime || 0 } }));
}

function attachVideoEvents(){
  const v = videoRef.value; if(!v) return;
  if(videoEventsAttached) return; // 已绑定过
  videoEventsAttached = true;
  v.addEventListener('play', ()=> emitCodeSync('play'));
  v.addEventListener('pause', ()=> emitCodeSync('pause'));
  v.addEventListener('seeked', ()=> emitCodeSync('seek'));
  // 持续同步：timeupdate 频率较低（约 4~5 次/秒），再加一个 rAF 细化（节流）
  let lastApplied = -1;
  let lastSegmentT = -1;
  const applySegment = (ts:number)=>{
    // 避免对同一时间戳重复解析（提高性能）
    // 将时间戳截断到毫秒级或 2 位小数
    const key = Math.floor(ts*50); // 20ms 精度
    if(key === lastApplied) return;
    lastApplied = key;
    const seg = codingStore.resolveSegment(ts);
    if(seg){
      const beforeCode = codingStore.code;
      const beforeInput = codingStore.input;
      const beforeOutput = codingStore.output;
      let changed = false;
      if(typeof seg.code === 'string' && codingStore.code !== seg.code){ codingStore.code = seg.code; changed = true; }
      if(typeof seg.input === 'string' && codingStore.input !== seg.input){ codingStore.input = seg.input; changed = true; }
      if(typeof seg.output === 'string' && codingStore.output !== seg.output){ codingStore.output = seg.output; changed = true; }
      // 始终记录 segment 应用（不再要求 changed 才打印），但用 changed 标记区别
      if(changed || seg.t !== lastSegmentT){
        console.log('%c[LessonPlay] Apply','color:#2196f3', 'videoTs=', ts.toFixed(3), 'seg.t=', seg.t, {
          codeChanged: beforeCode!==codingStore.code,
          inputChanged: beforeInput!==codingStore.input,
          outputChanged: beforeOutput!==codingStore.output,
          codeLen: codingStore.code.length,
          changed
        });
      }
      if(seg.t !== lastSegmentT){
        lastSegmentT = seg.t;
        const codePreview = codingStore.code.split('\n');
        let printed = codePreview;
        if(codePreview.length>40){
          printed = [...codePreview.slice(0,20),`... (${codePreview.length-40} lines omitted) ...`,...codePreview.slice(-20)];
        }
        console.groupCollapsed('%c[LessonPlay] Segment Code t='+seg.t,'color:#ff9800');
        console.log(printed.join('\n'));
        console.groupEnd();
      }
    }
  };
  const onTimeUpdate = ()=>{ if(!v.paused) applySegment(v.currentTime); };
  v.addEventListener('timeupdate', onTimeUpdate);
  let rafId:number; 
  const rafLoop = ()=>{ if(!v.paused && !v.seeking) applySegment(v.currentTime); rafId = requestAnimationFrame(rafLoop); };
  v.addEventListener('play', ()=>{ rafId = requestAnimationFrame(rafLoop); });
  v.addEventListener('pause', ()=>{ cancelAnimationFrame(rafId); });
  v.addEventListener('ended', ()=>{ cancelAnimationFrame(rafId); applySegment(v.duration); });
  // 初次如果自动播放未触发 play 事件，可手动启动一次
  if(!v.paused) rafId = requestAnimationFrame(rafLoop);
}

onMounted(()=>{ attachVideoEvents(); });
// 关键：初次 onMounted 时 videoUrl 可能还没拉取到导致 videoRef 为空，这里监听 videoUrl 一旦有值再尝试绑定
watch(videoUrl, (val)=>{ if(val) setTimeout(()=> attachVideoEvents(), 0); });
onBeforeUnmount(()=>{
  const v = videoRef.value; if(!v) return;
  v.removeAttribute('src');
});

// 监听同步事件，更新代码 / 输入 / 输出
function handleVideoSync(e:any){
  const { type, ts } = e.detail || {};
  if(type === 'play' || type === 'seek' || type==='pause'){
    console.log('%c[LessonPlay] handleVideoSync','color:#607d8b', type, ts);
    const seg = codingStore.resolveSegment(Number(ts)||0);
    if(seg){
      if(typeof seg.code === 'string' && codingStore.code !== seg.code) codingStore.code = seg.code;
      if(typeof seg.input === 'string' && codingStore.input !== seg.input) codingStore.input = seg.input;
      if(typeof seg.output === 'string' && codingStore.output !== seg.output) codingStore.output = seg.output;
    }
  }
}
onMounted(()=>{ window.addEventListener('lesson-video-sync', handleVideoSync); });
onBeforeUnmount(()=>{ window.removeEventListener('lesson-video-sync', handleVideoSync); });
</script>
<style scoped>
 .lesson-play-tab { width:100%; height:100%; display:flex; flex-direction:column; align-items:stretch; padding:8px; gap:12px; overflow:auto; }
 .video-wrapper { flex:0 0 auto; display:flex; justify-content:center; }
 video { max-width:100%; max-height:480px; background:#000; border:1px solid #333; border-radius:4px; }
 .no-video { color:#888; font-size:14px; padding:40px 0; text-align:center; }
 .meta-section { flex:1; display:flex; flex-direction:column; gap:20px; }
 .meta-section h4 { margin:0 0 6px; font-size:14px; color:#333; }
 .text { font-size:13px; line-height:1.5; white-space:normal; word-break:break-word; }
</style>
