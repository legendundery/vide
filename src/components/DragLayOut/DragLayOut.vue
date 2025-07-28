<template>
  <n-layout-header>
    <n-grid :x-gap="12" :cols="12">
      <n-grid-item>
        <RouterLink to="/"
          ><home-outline style="height: 24px; padding: 4px"
        /></RouterLink>
      </n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
      <n-grid-item></n-grid-item>
    </n-grid>
  </n-layout-header>
  <n-layout-content content-style="height: calc(100vh - 40px)">
    <div class="layout-root">
      <SplitLayout v-if="true" :subtree="LayoutStore.BTREE" />
    </div>
  </n-layout-content>
</template>

<script lang="ts" setup>
import SplitLayout from "./SplitLayout.vue";
import { LayOutStore } from "../../stores/LayOutStore";

import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { NLayoutHeader, NLayoutContent, NGrid, NGridItem } from "naive-ui";
import { HomeOutline } from "@vicons/ionicons5";

const LayoutStore = LayOutStore();

const MountedDelay = ref(false);
onMounted(() => {
  MountedDelay.value = true;
});
</script>

<style scoped lang="scss">
.layout-root {
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
