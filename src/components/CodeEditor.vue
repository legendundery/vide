<template>
  <MonacoEditor
    v-model="value"
    :language="codeLanguage"
    height="100%"
    width="100%"
  />
</template>
<script lang="ts" setup>
import { ref } from "vue";
import MonacoEditor from "@/components/MonacoEditor/MonacoEditor.vue";
const value = ref("int a = 1234;"); // 编辑器代码显示的值
const codeLanguage = ref("cpp"); // 要加载的语言类型
</script>
