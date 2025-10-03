import { createApp } from "vue";
import { createPinia } from "pinia";
import  createNaiveUi  from 'naive-ui';
import App from "./App.vue";
import router from "./router";

const pinia = createPinia();
const naive = createNaiveUi;

createApp(App).use(pinia).use(router).use(naive).mount("#app");
