<template>
  <div class="code-pane">
    <MonacoEditor
      v-model="input"
      :language="codeLanguage"
      :readOnly="isCompiling"
      height="100%"
      width="100%"
    />
    <!-- 移除 Teleport 避免在激活切换与快速点击触发 DOM 先卸载后访问 parentNode 的竞争 -->
    <span class="suffix-label" v-if="suffixExists">Input</span>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch, computed, nextTick } from "vue";

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { CodingStore } from "../../stores/CodingStore.ts";
import { storeToRefs } from 'pinia';

const props = defineProps<{ currentId?: string }>();
const input = ref("");
const codeLanguage = ref("cpp");

const codingstore = CodingStore();
const { isCompiling } = storeToRefs(codingstore);
const suffixSelector = computed(()=> `#${props.currentId||''}-suffix`);
const suffixExists = ref(false);

onMounted(() => { input.value = codingstore.input; refreshSuffix(); });

watch(input, () => { codingstore.input = input.value; });
// 反向同步：播放更新全局输入时同步编辑器
watch(()=> codingstore.input, (val)=>{
  if(val !== input.value){ input.value = val || ''; }
});
watch(()=> props.currentId, ()=> refreshSuffix());

function refreshSuffix(){
  nextTick(()=>{ suffixExists.value = !!document.querySelector(suffixSelector.value); });
}
</script>

<style scoped>
.code-pane { width:100%; height:100%; display:flex; flex-direction:column; }
</style>
