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
