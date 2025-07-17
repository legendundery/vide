<template>
  <MonacoEditor
    v-model="value"
    :language="codeLanguage"
    style="height: 100%; width: 100%"
  />
</template>
<script lang="ts" setup>
import { ref } from "vue";
import MonacoEditor from "./MonacoEditor/MonacoEditor.vue";
const value = ref("int a = 1234;"); // 编辑器代码显示的值
const codeLanguage = ref("cpp"); // 要加载的语言类型
</script>
