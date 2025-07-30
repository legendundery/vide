<template>
  <div>{{ user_id }} {{ username }} {{ role }}</div>
</template>
<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";

import { UserStore } from "../../stores/UserStore";

import { profile } from "../../api/users";

const userStore = UserStore();
const user_id = ref(0);
const username = ref("");
const role = ref("");
onMounted(() => {
  profile();
  user_id.value = userStore.user_id;
  username.value = userStore.username;
  role.value = userStore.role;
});
watch(
  () => userStore.username,
  () => {
    username.value = userStore.username;
    role.value = userStore.role;
  }
);
</script>
