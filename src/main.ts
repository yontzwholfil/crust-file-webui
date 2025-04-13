import "./asset/style/main.css";
import "notyf/notyf.min.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./util/router";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

createApp(App).use(pinia).use(router).mount("#app");
