import "./style/main.css"
import "notyf/notyf.min.css"
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './util/router'
import { pinia } from './util/pinia'

createApp(App).use(pinia).use(router).mount('#app')
