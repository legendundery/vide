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
    return response; // 直接返回数据体，简化使用
  },
  function (error) {
    // 统一错误处理
    console.error("请求错误:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default newAxios;
