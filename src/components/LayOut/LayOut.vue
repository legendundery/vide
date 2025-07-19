<template>
  <div class="layout-root">
    <SplitLayout v-if="true" :subtree="LayoutStore.BTREE" />

    <TabsBlocks v-if="false" />

    <VueDraggable v-if="false" />
  </div>
</template>

<script lang="ts" setup>
import SplitLayout from "./SplitLayout.vue";
import { LayOutStore } from "../../stores/LayOutStore";

import TabsBlocks from "./TabsBlocks.vue";
import VueDraggable from "./VueDraggable.vue";
import { onMounted, ref } from "vue";

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
