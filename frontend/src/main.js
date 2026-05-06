import './styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { inject } from '@vercel/analytics'
import router from './router'
import { useThemeStore } from './stores/themeStore'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)

document.documentElement.lang = "tr"

const themeStore = useThemeStore()
themeStore.startSystemSync()

app.mount('#app')
inject()
