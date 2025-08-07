import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ImageCompressor from '../views/ImageCompressor.vue'

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/compress', name: 'Compressor', component: ImageCompressor }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
