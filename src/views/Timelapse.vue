<template>
  <Header />

  <div class="container">
    <h2>GIF Timelapse 生成器</h2>

    <input type="file" multiple accept="image/*" @change="handleFiles" />
    
    <div v-if="images.length > 0" class="settings">
      <label>
        幀率 (FPS): 
        <input type="number" v-model.number="fps" min="1" max="30" />
      </label>

      <button @click="generateGif" :disabled="processing">
        開始生成 GIF
        <span v-if="done">✅</span>
      </button>
    </div>

    <div v-if="processing">
      <p>正在處理第 {{ currentIndex }} 張 / 共 {{ images.length }} 張</p>

      <!-- 只在編碼階段顯示進度 -->
      <div v-if="encodingStarted && !done">
        <p>編碼進度：{{ (progress * 100).toFixed(1) }}%</p>
        <progress :value="progress" max="1" style="width: 100%;"></progress>
      </div>
    </div>

    <div v-if="gifUrl && !processing">
      <h3>合成完成</h3>
      <a :href="gifUrl" download="timelapse.gif">下載 GIF</a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from '../components/Header.vue'
import GIF from 'gif.js.optimized'

const images = ref([])
const fps = ref(10)
const processing = ref(false)
const currentIndex = ref(0)
const progress = ref(0)
const encodingStarted = ref(false)
const gifUrl = ref(null)
const done = ref(false)

function handleFiles(e) {
  images.value = Array.from(e.target.files)
  gifUrl.value = null
  progress.value = 0
  encodingStarted.value = false
}

async function generateGif() {
  if (images.value.length === 0) return

  done.value = false
  processing.value = true
  currentIndex.value = 0
  gifUrl.value = null
  progress.value = 0
  encodingStarted.value = false

  // 先讀第一張圖確認寬高
  const firstImg = await loadImage(URL.createObjectURL(images.value[0]))
  const width = firstImg.width
  const height = firstImg.height

  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: `${import.meta.env.BASE_URL}/gif.worker.js`,
    width: width,
    height: height
  })

  // 圖片加入 GIF
  for (let i = 0; i < images.value.length; i++) {
    currentIndex.value = i + 1

    const img = await loadImage(URL.createObjectURL(images.value[i]))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    gif.addFrame(canvas, { delay: 1000 / fps.value })
  }

  // 圖片都加入後，開始編碼，設定 encodingStarted 為 true，顯示進度
  encodingStarted.value = true

  gif.on('progress', (p) => {
    progress.value = p
  })

  gif.on('finished', (blob) => {
    gifUrl.value = URL.createObjectURL(blob)
    processing.value = false
    encodingStarted.value = false
    done.value = true
  })

  gif.render()
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
</script>

<style scoped>
.container {
  max-width: 700px;
  margin: auto;
  font-family: sans-serif;
  padding: 1rem;
}
.settings label {
  display: block;
  margin: 0.5rem 0;
}
ul {
  list-style: none;
  padding: 0;
}
button {
  margin-bottom: 8px;
}
</style>
