<template>
  <div v-if="props.subtree?.type === 'leaf'" class="layout-node">
    <div
      :id="((props.subtree!).first as string) + '-layout'"
      class="layout-node"
    >
      <DraggableBlocks
        :BlockId="((props.subtree!).first as string)"
      ></DraggableBlocks>
    </div>
  </div>
  <div v-else-if="props.subtree?.type === 'horizontal'" class="layout-node">
    <n-split
      direction="horizontal"
      :min="0.1"
      :max="0.9"
      :default-size="(props.subtree!).size || 0.5"
    >
      <template #1
        ><SplitLayout :subtree="(props.subtree!.first as Node | LeafNode)"
      /></template>
      <template #2
        ><SplitLayout :subtree="(props.subtree!.second as Node | LeafNode)"
      /></template>
    </n-split>
  </div>
  <div v-else="type === 'vertical'" class="layout-node">
    <n-split
      direction="vertical"
      :min="0.1"
      :max="0.9"
      :default-size="(props.subtree!).size || 0.5"
    >
      <template #1
        ><SplitLayout :subtree="(props.subtree!.first as Node | LeafNode)"
      /></template>
      <template #2
        ><SplitLayout :subtree="(props.subtree!.second as Node | LeafNode)"
      /></template>
    </n-split>
  </div>
</template>

<script lang="ts" setup>
import { NSplit } from "naive-ui";
import type { PropType } from "vue";

import DraggableBlocks from "./DraggableBlocks.vue";

type LeafNode = {
  type: string;
  size?: number;
  first: string;
  second: undefined;
};
type Node = {
  type: string;
  size?: number;
  first: Node | LeafNode;
  second: Node | LeafNode;
};

type SubTree = LeafNode | Node;

const props = defineProps({
  subtree: {
    type: [Object] as PropType<SubTree>,
  },
});
</script>

<style scoped lang="scss">
.layout-node {
  width: 100%;
  height: 100%;
}
</style>
