import './assets/main.css'

import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue';

import { createPinia } from 'pinia'

import App from './App.vue'
import '@arco-design/web-vue/dist/arco.css';
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(ArcoVue);
app.use(router)

app.mount('#app')
