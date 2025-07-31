import newAxios from "../request";
import { UserStore } from "../stores/UserStore";

import router from "../router";

const userStore = UserStore();

export const login = (
  username: string = "newStu",
  password: string = "abcdefg"
) => {
  newAxios
    .post(
      "api/users/login",
      JSON.stringify({
        username: username,
        password: password,
      })
    )
    .then((result: any) => {
      localStorage.setItem("access_token", result.data.token);
      userStore.state = true;

      profile();
      router.push("/profile");
    });
};

export const profile = () => {
  newAxios.get("api/users/profile").then((result) => {
    userStore.user_id = result.data.user_id;
    userStore.username = result.data.username;
    userStore.role = result.data.role;
  });
};

export const getusers = async () => {
  return await newAxios.get("api/users");
};

export const registeruser = async (
  username: string,
  email: string,
  role: string,
  password: string = ""
) => {
  return await newAxios.post(
    "api/users/register",
    JSON.stringify({
      username: username,
      email: email,
      role: role,
      password: password,
    })
  );
};

export const updateuser = async (
  user_id: Number,
  username: string,
  email: string,
  role: string,
  password: string = ""
) => {
  return await newAxios.post(
    "api/users/update",
    JSON.stringify({
      user_id: user_id,
      username: username,
      email: email,
      role: role,
      password: password,
    })
  );
};

export const delteuser = async (user_id: Number) => {
  return await newAxios.post(
    "api/users/delete",
    JSON.stringify({
      user_id: user_id,
    })
  );
};
