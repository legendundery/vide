<template>
  <MonacoEditor
    v-model="output"
    :language="codeLanguage"
    :readOnly="true"
    height="100%"
    width="100%"
  />
  <Teleport :to="'#' + currentId + '-suffix'"> Output </Teleport>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { CodingStore } from "../../stores/CodingStore.ts";

defineProps({
  currentId: String,
});
const output = ref("");
const codeLanguage = ref("cpp");

const codingstore = CodingStore();

onMounted(() => {
  output.value = codingstore.output;
});

watch(
  () => codingstore.output,
  () => {
    output.value = codingstore.output;
  }
);
</script>
