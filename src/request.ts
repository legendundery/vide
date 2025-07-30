import axios from "axios";

// 开发环境后端地址
const backEndUrl = "http://localhost:1437//";

// Vite 中使用 import.meta.env 访问环境变量
const newAxios = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? "http://localhost:3000" // 生产环境地址
      : backEndUrl, // 开发环境地址
  timeout: 60000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
newAxios.interceptors.request.use(
  function (config) {
    // 可在此添加认证 token 等
    // 例如: config.headers.Authorization = `Bearer ${token}`
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 响应拦截器
newAxios.interceptors.response.use(
  function (response) {
    // 可在此统一处理响应数据
    return response;
  },
  async function (error) {
    // 统一错误处理
    console.error("请求错误:", error.response?.data || error.message);

    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 刷新 token 逻辑
      const res = await refreshToken();
      const newToken = res.data.access_token;
      localStorage.setItem("access_token", newToken);
      // 重试原始请求
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return newAxios(originalRequest);
    }

    return Promise.reject(error);
  }
);

function refreshToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  return axios.post("/auth/refresh", { refresh_token: refreshToken });
}

export default newAxios;
