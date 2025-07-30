<template>
  <div style="width: 100%">
    <RouterLink :to="'/login'">
      <button>login</button>
    </RouterLink>
    <button @click="logout">logout</button>
    <button
      @click="
        newAxios.get('api/users').then((result) => console.log(result.data.tmp))
      "
    >
      test
    </button>
    <button
      @click="
        newAxios
          .post(
            'api/users/register',
            JSON.stringify({
              username: 'newStu',
              email: '',
              password: 'abcdefg',
            })
          )
          .then((result) => console.log(result.data.userId))
      "
    >
      register
    </button>
    <button
      @click="
        newAxios
          .post(
            'api/users/login',
            JSON.stringify({
              username: 'newStu',
              password: 'abcdefg',
            })
          )
          .then(login)
      "
    >
      login
    </button>
    <button
      @click="
        newAxios
          .get('api/users/profile')
          .then((result) => console.log(result.data))
      "
    >
      profile
    </button>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from "vue-router";
import newAxios from "../request";
const login = (result: any) => {
  localStorage.setItem("access_token", result.data.token);
  console.log(result.data.userId, result.data.username);
};
const logout = () => {
  localStorage.removeItem("access_token");
};
</script>
