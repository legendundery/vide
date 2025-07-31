<template>
  <div>
    <button @click="dispUsers()">getusers</button>
  </div>
  <div v-for="user in users">
    user_id
    <input v-model="user.user_id" />
    username
    <input v-model="user.username" />
    email
    <input v-model="user.email" />
    role
    <input v-model="user.role" />

    {{ user.user_id }}
    {{ user.username }}
    {{ user.email }}
    {{ user.role }}
  </div>
  <br />
  <div>
    register username<input v-model="newUser.username" /> email<input
      v-model="newUser.email"
    />
    role<input v-model="newUser.role" /> password<input
      v-model="newUser.password"
    />

    {{ newUser.user_id }}
    {{ newUser.username }}
    {{ newUser.email }}
    {{ newUser.password }}

    <button
      @click="
        registeruser(
          newUser.username,
          newUser.email,
          newUser.role,
          newUser.password
        )
      "
    >
      register
    </button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { getusers, delteuser, updateuser, registeruser } from "../../api/users";

interface user_data {
  user_id: Number;
  username: string;
  email: string;
  role: string;
  password: string;
}
const users = ref([{} as user_data]);
const newUser = ref({} as user_data);
const dispUsers = () => {
  getusers().then((result) => {
    users.value = result.data.users;
  });
};
const deleteUser = (user_id: Number) => {
  delteuser(user_id).then((result) => {
    console.log(result);
  });
};
const updateUser = (
  user_id: Number,
  username: string,
  email: string,
  role: string
) => {
  updateuser(user_id, username, email, role);
};
onMounted(() => dispUsers());
</script>
