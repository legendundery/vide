<template>
  <MonacoEditor
    v-model="code"
    :language="codeLanguage"
    height="100%"
    width="100%"
  />
  <Teleport :to="'#' + currentId + '-suffix'">
    <n-button @click="compile()">compile</n-button>
    <n-button @click="visualize()">visualize</n-button>
  </Teleport>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { NButton } from "naive-ui";

import MonacoEditor from "../../components/MonacoEditor/MonacoEditor.vue";
import { compileCpp, debugCpp } from "../../api/submitCodeOnPlayground.ts";
import { CodingStore } from "../../stores/CodingStore.ts";

defineProps({
  currentId: String,
});
const code = ref("");
const codeLanguage = ref("cpp");

const codingstore = CodingStore();

onMounted(() => {
  code.value = codingstore.code;
});

watch(code, () => {
  codingstore.code = code.value;
});

const compile = () => {
  const updateJSON = ref({
    code: codingstore.code,
    input: codingstore.input,
  });
  compileCpp(JSON.stringify(updateJSON.value))
    //.then((response) => JSON.parse(response))
    .then((result) => {
      codingstore.output = result.data.output;
      console.log(codingstore.output);
    })
    .catch((err) => {
      console.log(err);
    });
};
const visualize = () => {
  const updateJSON = ref({
    code: codingstore.code,
    input: codingstore.input,
  });
  debugCpp(JSON.stringify(updateJSON.value))
    //.then((response) => JSON.parse(response))
    .then((result) => {
      codingstore.output = result.data.output;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
