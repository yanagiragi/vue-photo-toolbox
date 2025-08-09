import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ImageCompressor from '../views/ImageCompressor.vue'
import LongExposure from '../views/LongExposure.vue'
import Timelapse from '../views/Timelapse.vue'
import TimelapseViewer from '../views/TimelapseViewer.vue'

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/compress', name: 'Compressor', component: ImageCompressor },
    { path: '/longExposure', name: 'LongExposure', component: LongExposure },
    { path: '/timelapse', name: 'Timelapse', component: Timelapse },
    { path: '/timelapseViewer', name: 'TimelapseViewer', component: TimelapseViewer },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
