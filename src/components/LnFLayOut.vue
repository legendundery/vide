<template>
  <a-layout class="container">
    <a-layout-sider class="left" :width="leftWidth">
      <slot name="left"></slot>
    </a-layout-sider>
    <a-divider
      type="vertical"
      style="height: auto; width: 8px; background-color: #7cb305"
      @mousedown="handleResize"
    ></a-divider>
    <a-layout-sider class="right" :width="rightWidth" style="overflow: scroll">
      <slot name="right"></slot>
    </a-layout-sider>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const leftWidth = ref(500);
const rightWidth = ref(500);

function handleResize(event: { clientX: any }) {
  document.onselectstart = function () {
    return false;
  };

  const startX = event.clientX;
  const startLX = leftWidth.value;
  const startRX = rightWidth.value;
  var resizeTimeout: number | undefined;

  function onMouseMove(e: { clientX: number }) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      const moveX = e.clientX - startX;
      const newLeftWidth = startLX + moveX;
      const newRightWidth = startRX - moveX;

      if (newLeftWidth > 200 && newRightWidth > 200) {
        leftWidth.value = newLeftWidth;
        rightWidth.value = newRightWidth;
      }
    }, 100);
  }

  function onMouseUp() {
    document.onselectstart = null;

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.left {
  background-color: #efefef;
}
.right {
  background-color: #efefef;
}
</style>
