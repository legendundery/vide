import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const UserStore = defineStore("user-store", () => {
  const authenticated = ref(false);
  const user_id = ref<number | null>(null);
  const username = ref("");
  const role = ref("");
  const token = ref<string | null>(localStorage.getItem("access_token"));

  const isAdmin = computed(() => role.value === "admin");

  function setSession(t: string) {
    token.value = t;
    localStorage.setItem("access_token", t);
    authenticated.value = true;
  }
  function clearSession() {
    token.value = null;
    localStorage.removeItem("access_token");
    authenticated.value = false;
    user_id.value = null;
    username.value = "";
    role.value = "";
  }

  return {
    // state
    authenticated,
    user_id,
    username,
    role,
    token,
    // getters
    isAdmin,
    // actions
    setSession,
    clearSession,
  };
});
