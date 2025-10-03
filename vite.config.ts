import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import path from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), monacoEditorPlugin({})],
  server: {
    port: 5174,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:1437",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      `monaco-editor/esm/vs/language/json/json.worker`,
      `monaco-editor/esm/vs/language/css/css.worker`,
      `monaco-editor/esm/vs/language/html/html.worker`,
      `monaco-editor/esm/vs/language/typescript/ts.worker`,
      `monaco-editor/esm/vs/editor/editor.worker`,
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
