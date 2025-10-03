## 前端 (vide) – Vue 3 + TypeScript + Vite

### 技术栈

Vue 3 + `<script setup>` + TypeScript + Vite + Pinia + Naive UI + Monaco Editor。

### 目录结构简述

```
vide/
	src/
		api/            # axios 请求封装
		components/     # 通用组件（布局 / 拖拽 / 编辑器等）
		router/         # 路由配置
		stores/         # Pinia 状态
		views/          # 业务页面
		assets/         # 静态资源
	vite.config.ts    # Vite 配置（端口 5174 + /api 代理到后端 1437）
```

### 环境与端口

| 模块          | 本地开发端口 | 生产（建议）      |
| ------------- | ------------ | ----------------- |
| 前端 Vite Dev | 5174         | 8849 (Nginx 静态) |
| 后端 API      | 1437         | 1437              |

### 安装依赖

建议使用 pnpm：

```
pnpm install
```

### 开发启动

```
pnpm dev
```

打开浏览器： http://localhost:5174

### 构建产物

```
pnpm build
```

输出目录： `dist/`

### 本地预览构建产物

```
pnpm preview   # 默认 4173 端口，可用于简单验收
```

### 与后端联调说明

Vite 通过 `vite.config.ts` 里 `server.proxy` 将 `/api` 前缀代理到 `http://localhost:1437`，无需在代码里写绝对后端地址。生产部署时让 Nginx 再做同名代理即可无痛切换。

### 部署 (Nginx 示例)

```
server {
	listen 8849;
	server_name your.domain;
	root /var/www/webide-frontend/dist;

	location /api/ {
		proxy_pass http://127.0.0.1:1437/api/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
	}

	try_files $uri /index.html;
}
```

### 常见问题

1. 空白页：检查 Nginx 是否加了 `try_files`。
2. API 404：确认 `/api` 代理，后端是否运行，路由是否为 `/api/courses/...`。
3. CORS 报错：生产不要直接访问后端裸域，统一从前端域经代理转发。

### 打包归档（可选命令）

```
pnpm build
tar -czf vide-dist.tar.gz dist
```

### 后续优化建议

- 开启静态资源 hash 长缓存
- 使用 CDN 分发 `dist/assets`
- 打开 gzip / brotli：

```
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
```

---

后端部署与数据库说明请查看上一级目录 `Backend_of_CppLearning/README.md`。
