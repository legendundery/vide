<template>
  <monaco-editor
    v-model="value"
    language="cpp"
    :options="{}"
    :hints="['table_name']"
    style="width: 300px; height: 100%"
  />
</template>

<script lang="ts" setup>
import monacoEditor from "@/components/monacoEditor.vue";
import { ref } from "vue";
const value = ref("console.log('HelloWorld')");
</script>
