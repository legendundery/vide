<template>
  <div id="basicLayout">
    <a-layout>
      <a-layout-sider
        v-model:collapsed="collapsed"
        collapsible
        :style="{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
        }"
      >
        <BasicLayOutSider />
      </a-layout-sider>
      <a-layout
        :style="{
          width: `${width}px`,
          height: `${height}px`,
          marginLeft: collapsed ? '80px' : '200px',
        }"
      >
        <a-layout-header
          :style="{
            background: '#efefef',
          }"
          ><LinkBreadcrumb
        /></a-layout-header>
        <a-layout-content :style="{ width: `${width}px` }">
          <contentView :key="reLoadKey" />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import contentView from "./contentView.vue";
const collapsed = ref<boolean>(false);

const width = ref(0);
const height = ref(0);
const reLoadKey = ref(0);

var resizeTimeout: number | undefined;
const updateDimensions = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    width.value = window.innerWidth - (collapsed.value ? 80 : 200);
    height.value = window.innerHeight;
    //reLoadKey.value = reLoadKey.value + 1;
  }, 200);
};

watch(collapsed, () => {
  updateDimensions();
});
onMounted(() => {
  updateDimensions();
  window.addEventListener("resize", updateDimensions);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDimensions);
});
</script>
<style scoped>
#basicLayout {
  overflow: hidden;
}
</style>
