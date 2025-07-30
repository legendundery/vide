import { defineStore } from "pinia";
import { ref } from "vue";

export const UserStore = defineStore("user-store", () => {
  const state = ref(false);
  const user_id = ref(0);
  const username = ref("");
  const role = ref("");
  return {
    state,
    user_id,
    username,
    role,
  };
});
