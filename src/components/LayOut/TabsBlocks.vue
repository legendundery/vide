<template>
  <n-tabs
    v-model:value="valueRef"
    type="card"
    :addable="addableRef"
    :closable="closableRef"
    tab-style="min-width: 80px;"
    @close="handleClose"
    @add="handleAdd"
  >
    <n-tab-pane v-for="panel in panelsRef" :key="panel" :name="panel">
      {{ panel }}
    </n-tab-pane>
    <template #prefix> Prefix </template>
    <template #suffix> Suffix </template>
  </n-tabs>
</template>

<script lang="ts" setup>
import { NTabs, NTabPane } from "naive-ui";
import { computed, ref } from "vue";

const valueRef = ref(1);
const panelsRef = ref([1, 2, 3, 4, 5]);
const addableRef = computed(() => {
  return {
    disabled: panelsRef.value.length >= 10,
  };
});
const closableRef = computed(() => {
  return panelsRef.value.length > 1;
});
const handleAdd = () => {
  const newValue = Math.max(...panelsRef.value) + 1;
  panelsRef.value.push(newValue);
  valueRef.value = newValue;
};
const handleClose = (name: number) => {
  const { value: panels } = panelsRef;
  const nameIndex = panels.findIndex((panelName) => panelName === name);
  if (!~nameIndex) return;
  panels.splice(nameIndex, 1);
  if (name === valueRef.value) {
    valueRef.value = panels[Math.min(nameIndex, panels.length - 1)];
  }
};
</script>
