<template>
  <div class="office-preview">
    <div v-if="!payload">无预览数据</div>
    <div v-else class="preview-body">
      <div class="info-bar">
        <span class="fname" :title="payload.original || payload.filename">{{ payload.original || payload.filename }}</span>
        <span class="mime">{{ payload.mime }}</span>
        <span v-if="!isPublicUrl" class="warn">(当前地址非公网/HTTPS，在线预览可能失败)</span>
        <n-space size="small" class="viewer-switch" v-if="canAnyEmbed">
          <n-button size="tiny" :type="viewerMode==='ms'?'primary':'default'" @click="viewerMode='ms'" :disabled="!msAvailable">MS Viewer</n-button>
          <n-button size="tiny" :type="viewerMode==='google'?'primary':'default'" @click="viewerMode='google'" :disabled="!googleAvailable">Google</n-button>
        </n-space>
      </div>
      <div v-if="embedState==='loading'" class="hint loading">尝试加载 {{ viewerModeLabel }} 预览...</div>
      <div v-if="embedState==='failed'" class="hint failed">
        <p>{{ viewerModeLabel }} 加载失败（或被阻止）。</p>
        <ul>
          <li v-if="!isPublicUrl">当前文件 URL 不是公网 HTTPS，MS/Google 在线预览通常无法访问本地/内网地址。</li>
          <li>可尝试切换另一种 Viewer 或直接下载。</li>
          <li>若需离线预览，可考虑：上传时自动转换为 PDF，或前端使用 pptx 解析库。</li>
        </ul>
      </div>
      <div v-if="embedState==='unsupported'" class="hint failed">
        不支持的预览条件：文件 MIME/扩展不匹配或缺少 URL。
      </div>
      <div v-if="embedState==='ok'" class="embed-box">
        <iframe :src="currentEmbedUrl" frameborder="0" class="viewer-frame" @load="onIframeLoad"></iframe>
      </div>
      <div class="fallback" v-if="embedState!=='ok'">
        <n-button size="small" tertiary tag="a" :href="payload.url" target="_blank">下载查看</n-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { NButton, NSpace } from 'naive-ui';
const props = defineProps<{ payload:any }>();

const isPptMime = computed(()=> /presentation|powerpoint/.test(props.payload?.mime||''));
const hasUrl = computed(()=> !!props.payload?.url);
const isPublicUrl = computed(()=>{
  if(!hasUrl.value) return false;
  try {
    const u = new URL(props.payload.url);
    // 排除常见本地/内网：localhost 127.* 10.* 192.168.* 172.16-31.* 198.18.* (测试网段)
    if(['localhost','127.0.0.1'].includes(u.hostname)) return false;
    if(/^10\./.test(u.hostname)) return false;
    if(/^192\.168\./.test(u.hostname)) return false;
    if(/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(u.hostname)) return false;
    if(/^198\.18\./.test(u.hostname)) return false;
    if(u.protocol !== 'https:') return false; // Office/Google 更稳定于 https
    return true;
  } catch { return false; }
});

const msAvailable = computed(()=> isPublicUrl.value && isPptMime.value && hasUrl.value);
const googleAvailable = computed(()=> isPublicUrl.value && isPptMime.value && hasUrl.value);
const canAnyEmbed = computed(()=> msAvailable.value || googleAvailable.value);

const viewerMode = ref<'ms'|'google'>(msAvailable.value ? 'ms' : 'google');
const viewerModeLabel = computed(()=> viewerMode.value === 'ms' ? 'Microsoft Office' : 'Google Docs');

const msUrl = computed(()=> msAvailable.value ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(props.payload.url)}` : '');
const googleUrl = computed(()=> googleAvailable.value ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(props.payload.url)}` : '');
const currentEmbedUrl = computed(()=> viewerMode.value === 'ms' ? msUrl.value : googleUrl.value);

// 状态: loading / ok / failed / unsupported
const embedState = ref<'loading'|'ok'|'failed'|'unsupported'>( 'loading');
let failTimer: any = null;

function startLoadCycle(){
  if(!canAnyEmbed.value){ embedState.value = 'unsupported'; return; }
  embedState.value = 'loading';
  clearTimeout(failTimer);
  failTimer = setTimeout(()=>{
    if(embedState.value==='loading') embedState.value='failed';
  }, 3500); // 3.5s 超时视为失败
}
function onIframeLoad(){
  // 不能 100% 保证成功，但若能触发 load 视为 ok
  clearTimeout(failTimer);
  if(embedState.value==='loading') embedState.value='ok';
}

watch(()=> currentEmbedUrl.value, ()=>{ startLoadCycle(); });
onMounted(()=>{ startLoadCycle(); });
</script>
<style scoped>
.office-preview { width:100%; height:100%; display:flex; flex-direction:column; }
.preview-body { flex:1; display:flex; flex-direction:column; min-height:0; }
.info-bar { font-size:12px; color:#666; margin-bottom:6px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.fname { max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.warn { color:#d48806; }
.viewer-switch { margin-left:auto; }
.embed-box { flex:1; min-height:0; border:1px solid #ddd; border-radius:4px; overflow:hidden; background:#fff; }
.viewer-frame { width:100%; height:100%; background:#fff; }
.fallback { margin-top:8px; }
.hint { font-size:12px; line-height:1.4; margin-bottom:8px; }
.failed { color:#c00; }
.loading { color:#888; }
ul { padding-left:18px; margin:4px 0 0; }
</style>
