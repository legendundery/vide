<template>
  <MonacoEditor
    v-model="input"
    :language="codeLanguage"
    height="100%"
    width="100%"
  />
  <Teleport :to="'#' + currentId + '-suffix'"> Input </Teleport>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { CodingStore } from "../../stores/CodingStore.ts";

defineProps({
  currentId: String,
});
const input = ref("");
const codeLanguage = ref("cpp");

const codingstore = CodingStore();

onMounted(() => {
  input.value = codingstore.input;
});

watch(input, () => {
  codingstore.input = input.value;
});
</script>
