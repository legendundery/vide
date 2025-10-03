<template>
  <div class="code-pane">
    <MonacoEditor
      v-model="code"
      :language="codeLanguage"
      height="100%"
      width="100%"
    />
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch, inject, defineExpose } from "vue";
// Buttons moved to DraggableBlocks header to avoid Teleport lifecycle race

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { compileCpp, debugCpp } from "../../api/submitCodeOnPlayground.ts";
import { CodingStore } from "../../stores/CodingStore.ts";
import { storeToRefs } from 'pinia';
import { LayOutStore } from "../../stores/LayOutStore";

const props = defineProps<{ currentId?: string }>();
const code = ref("");
const codeLanguage = ref("cpp");

const codingstore = CodingStore();
const { isCompiling } = storeToRefs(codingstore);
const layoutStore = LayOutStore();
// 注入来自 DraggableBlocks 的当前激活 tab；若不存在则回退到 leaf 内第一个 CodeEditor
const injectedActiveTab: any = inject('activeTab', null);

function getCurrentTab(): any {
  if(injectedActiveTab?.value){ return injectedActiveTab.value; }
  const leaf = layoutStore.Leafs.find(l=> l.id === props.currentId);
  if(!leaf) return null;
  return leaf.pages.find(p=> p.path === 'CodeEditor') || null;
}
// obsolete teleport logic removed

onMounted(() => {
  const tab = getCurrentTab();
  code.value = tab?.code || '';
});

// 监听激活 tab 切换（来自注入引用）
watch(()=> injectedActiveTab?.value, (newVal, oldVal)=>{
  if(newVal && newVal !== oldVal){
    code.value = newVal.code || '';
  }
});

watch(code, () => {
  const tab = getCurrentTab();
  if(tab){ tab.code = code.value; }
  codingstore.code = code.value; // 保持旧逻辑兼容（全局最后一次）
});
watch(()=> props.currentId, ()=>{});

// compile/visualize now triggered by DraggableBlocks header actions (kept for fallback shortcut, but not used directly)
// isCompiling 由 storeToRefs 提供 ref

const compile = () => {
  if(isCompiling.value) return; // 防抖
  isCompiling.value = true;
  const currentTab = getCurrentTab();
  const updateJSON = ref({
    code: currentTab? currentTab.code : codingstore.code,
    input: codingstore.input,
  });
  // 预写入“正在编译”占位
  const compilingMsg = '[Compiling...]';
  codingstore.output = compilingMsg;
  // 自动切换到 Output leaf (rd) 激活其 Output tab（通过 LayoutStore）
  switchToOutputLeaf();
  compileCpp(JSON.stringify(updateJSON.value))
    .then((result) => {
      const out = safeNormalizeOutput(result?.data?.output);
  codingstore.output = out;
    })
    .catch((err) => {
      const msg = extractError(err);
      const out = `[Compile Error]\n${msg}`;
  codingstore.output = out;
      console.error(err);
    })
  .finally(()=>{ isCompiling.value = false; });
};
const visualize = () => {
  if(isCompiling.value) return; // 与 compile 互斥
  isCompiling.value = true;
  const currentTab = getCurrentTab();
  const updateJSON = ref({
    code: currentTab? currentTab.code : codingstore.code,
    input: codingstore.input,
  });
  const runningMsg = '[Debug Running...]';
  codingstore.output = runningMsg;
  switchToOutputLeaf();
  debugCpp(JSON.stringify(updateJSON.value))
    .then((result) => {
      const out = safeNormalizeOutput(result?.data?.output);
  codingstore.output = out;
    })
    .catch((err) => {
      const msg = extractError(err);
      const out = `[Debug Error]\n${msg}`;
  codingstore.output = out;
      console.error(err);
    })
  .finally(()=>{ isCompiling.value = false; });
};

function switchToOutputLeaf(){
  // 通过自定义事件通知 rd leaf 激活 Output tab，避免直接 DOM click 竞争导致的 parentNode null
  try {
    const evt = new CustomEvent('layout-activate-tab', { detail:{ leafId:'rd', path:'CodeOutput', label:'Output' } });
    window.dispatchEvent(evt);
  } catch(e){ /* ignore */ }
}

defineExpose({ compile, visualize, isCompiling });

function safeNormalizeOutput(raw:any):string {
  if(raw == null) return '';
  if(typeof raw === 'string') return raw;
  try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
}
function extractError(e:any):string {
  if(!e) return 'Unknown error';
  if(e.response?.data){
    if(typeof e.response.data === 'string') return e.response.data;
    try { return JSON.stringify(e.response.data); } catch { /* ignore */ }
  }
  if(e.message) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}
</script>

<style scoped>
.code-pane { width:100%; height:100%; display:flex; flex-direction:column; }
</style>
