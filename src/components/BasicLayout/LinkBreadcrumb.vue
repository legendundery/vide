<template>
  <a-breadcrumb :style="{ margin: '6px 16px' }">
    <a-breadcrumb-item v-for="(route, index) in routes" :key="index">
      <a
        v-if="index !== routes.length - 1"
        :href="'/' + routes.slice(0, index + 1).join('/')"
      >
        {{ map.get(route) || route }}
      </a>
      <span v-if="index === routes.length - 1">
        {{ map.get(route) || route }}
      </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

const path = ref("");
const routes = ref([""]);

router.afterEach((to) => {
  path.value = to.path;
  routes.value = path.value.split("/").filter((str) => str !== "");
});

const map: Map<string, string> = new Map<string, string>([[" ", "home"]]);
</script>
