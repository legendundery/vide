import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import Antd from "ant-design-vue";

const pinia = createPinia();

createApp(App).use(pinia).use(Antd).use(router).mount("#app");