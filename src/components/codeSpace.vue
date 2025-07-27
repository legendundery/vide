<template>
  <div class="container">
    <a-row>
      <a-col flex="auto">
        <a-button v-if="title" type="dashed">{{ title }}</a-button>
      </a-col>
      <a-col>
        <a-button
          v-if="props.compile"
          type="primary"
          :loading="iconLoading"
          @click="compile"
          flex="20px"
        >
          compile
        </a-button>
        <!--
        <a-button
          v-if="typeof props.compile === 'function'"
          type="primary"
          :loading="iconLoading"
          @click="compile"
          flex="20px"
      >
          compile_test
        </a-button>-->
      </a-col>
    </a-row>
    <monaco-editor
      v-model="content"
      language="cpp"
      :options="{}"
      :hints="['table_name']"
      style="height: 100%; width: 100%"
    />
  </div>
</template>

<script lang="ts" setup>
import monacoEditor from "@/components/monacoEditor.vue";
import { ref, onMounted, onBeforeUnmount, defineProps, defineModel } from "vue";
const content = defineModel();
const iconLoading = ref(false);
let isCompiling = false;

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  compile: {
    type: Function,
    default: undefined,
  },
});
const compile = async () => {
  if (isCompiling || typeof props.compile !== "function") return;

  isCompiling = true;
  iconLoading.value = true;

  try {
    await props.compile();
    // 成功提示
  } catch (error) {
    console.error("编译失败:", error);
    // 显示错误信息
  } finally {
    iconLoading.value = false;
    isCompiling = false;
  }
};

const compile1 = async () => {
  if (props.compile) {
    iconLoading.value = true; // 编译开始，设为 true
    try {
      await props.compile(); // 执行编译（等待完成）
    } finally {
      iconLoading.value = false; // 无论成功/失败，结束后设为 false
    }
  }
};

onBeforeUnmount(() => {
  if (typeof content.value === "string")
    localStorage.setItem("content", content.value);
});
onMounted(() => {
  const tmp_content = localStorage.getItem("content");
  if (tmp_content) content.value = tmp_content;
  localStorage.removeItem("content"); // Remove saved username if "Remember Me" is unchecked
});
//:style="{ width: container_width, height: container_height }"
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background: "#efefef";
}
</style>
