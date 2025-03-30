import HomePage from "@/page/homePage.vue";
import { createWebHistory, createRouter } from "vue-router";

const routes = [
    { path: "/:path(.*)", component: HomePage },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export { router }