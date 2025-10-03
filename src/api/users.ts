import newAxios from "../request";
import { UserStore } from "../stores/UserStore";

function useUserStoreSafe() {
  try {
    return UserStore();
  } catch (e) {
    // Pinia 尚未初始化时返回一个临时对象，避免崩溃；调用方一般在组件或守卫中很快会再次获取
    return {
      setSession: () => {},
      user_id: 0,
      username: "",
      role: "",
    } as any;
  }
}

export const login = async (username: string, password: string) => {
  const result: any = await newAxios.post(
    "api/users/login",
    JSON.stringify({
      username,
      password,
    })
  );
  const userStore = useUserStoreSafe();
  userStore.setSession && userStore.setSession(result.data.token);
  return result;
};

export const profile = () => {
  const userStore = useUserStoreSafe();
  newAxios.get("api/users/profile").then((result) => {
    if (userStore) {
      (userStore as any).user_id = result.data.user_id;
      (userStore as any).username = result.data.username;
      (userStore as any).role = result.data.role;
    }
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
  const res = await newAxios.post(
    "api/users/register",
    JSON.stringify({
      username: username,
      email: email,
      role: role,
      password: password,
    })
  );
  return res;
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
