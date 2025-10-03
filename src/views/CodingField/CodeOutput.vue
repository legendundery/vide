<template>
  <div class="code-pane">
    <MonacoEditor
      v-model="output"
      :language="codeLanguage"
      :readOnly="true"
      height="100%"
      width="100%"
      :key="monacoKey"
    />
    <!-- 移除 Teleport 防止编译后自动切换 Output 与用户立即点 Input 产生的卸载顺序竞争 -->
    <span class="suffix-label" v-if="suffixExists">Output</span>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch, computed, nextTick, inject } from "vue";

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { CodingStore } from "../../stores/CodingStore.ts";

const props = defineProps<{ currentId?: string }>();
const output = ref("");
const codeLanguage = ref("cpp");
const monacoKey = ref(0); // force remount if needed

const suffixSelector = computed(() => `#${props.currentId || ''}-suffix`);
const suffixExists = ref(false);

const codingstore = CodingStore();
// 注入当前激活的 tab（DraggableBlocks 提供），以及全局激活 CodeEditor tab
const injectedActiveTab: any = inject('activeTab', null);
import { LayOutStore } from '../../stores/LayOutStore';
const layoutStore = LayOutStore();

onMounted(() => {
  syncFromActive();
  refreshSuffix();
});

function resolveActiveOutput(){
  // 1. 如果当前注入激活的是 CodeEditor，用它自己的 output（未编译则保持空串）
  if(injectedActiveTab?.value && injectedActiveTab.value.path === 'CodeEditor'){
    return injectedActiveTab.value.output || '';
  }
  // 2. 否则使用全局最近激活的 CodeEditor（可能用户切到 Input/Output 标签）
  if(layoutStore.activeCodeTabGlobal?.value){
    return layoutStore.activeCodeTabGlobal.value.output || '';
  }
  // 3. 最后兜底：仍返回全局 codingstore.output（兼容旧逻辑）
  return codingstore.output || '';
}

function syncFromActive(){ output.value = resolveActiveOutput() || ''; }

watch(()=> injectedActiveTab?.value, ()=>{ syncFromActive(); });
watch(()=> layoutStore.activeCodeTabGlobal, ()=>{ syncFromActive(); });
watch(()=> codingstore.output, ()=>{ syncFromActive(); });
watch(() => props.currentId, () => { refreshSuffix(); });

function refreshSuffix(){
  nextTick(() => {
    suffixExists.value = !!document.querySelector(suffixSelector.value);
  });
}
</script>

<style scoped>
.code-pane { width:100%; height:100%; display:flex; flex-direction:column; }
</style>
