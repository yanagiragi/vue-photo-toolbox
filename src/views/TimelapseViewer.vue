<template>
  <Header />

  <div class="container">
    <h2>Timelapse 播放器</h2>

    <div class="controls">
      <input type="file" multiple accept="image/*" @change="onFiles" />
      <label>
        幀率 (FPS):
        <input type="number" v-model.number="fps" min="1" max="60" />
      </label>

      <label>
        載入策略：
        <select v-model="loadAll">
          <option :value="true">預載全部（較流暢 — 但較耗記憶體）</option>
          <option :value="false">串流播放（低記憶體 — 可能較慢）</option>
        </select>
      </label>

      <button @click="prepareFrames" :disabled="files.length === 0 || preparing">
        開始載入影格
        <span v-if="done">✅</span>
      </button>
    </div>

    <div v-if="preparing" class="status">
      <p>載入中：正在處理第 {{ currentIndex }} / {{ totalFiles }} 張</p>
    </div>

    <div v-if="ready" class="player">
      <h3>載入完成</h3>

      <div class="play-controls">
        <button @click="togglePlay">{{ playing ? '暫停' : '播放' }}</button>
        <button @click="stop">停止</button>

        <label>當前幀：{{ currentFrame + 1 }} / {{ totalFrames }}</label>
      </div>

      <div class="play-controls">
        <input type="range" :min="0" :max="totalFrames - 1" v-model.number="currentFrame" @input="seek" />
      </div>
      
      <div>
        <canvas ref="canvasRef" class="canvas"></canvas>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import Header from '../components/Header.vue'

const files = ref([])
const fps = ref(10)
const loadAll = ref(true)
const preparing = ref(false)
const ready = ref(false)
const error = ref('')
const playing = ref(false)
const done = ref(false)

const canvasRef = ref(null)
let ctx = null

// 播放控制
const currentIndex = ref(0)
const totalFiles = ref(0)
const currentFrame = ref(0)
const totalFrames = ref(0)
let frames = []
let playTimer = null

let currentBitmap = null
let nextBitmap = null

function onFiles(e) {
  files.value = Array.from(e.target.files).sort((a, b) => a.name.localeCompare(b.name))
  totalFiles.value = files.value.length
  ready.value = false
  frames = []
}

async function loadBitmap(file) {
  return createImageBitmap(await fileToBlob(file))
}

function fileToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Blob([reader.result]))
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function togglePlay() {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}

async function prepareFrames() {
  if (files.value.length === 0) return
  error.value = ''
  preparing.value = true
  done.value = false
  frames = []

  try {
    if (loadAll.value) {
      for (let i = 0; i < files.value.length; i++) {
        currentIndex.value = i + 1
        const bitmap = await loadBitmap(files.value[i])
        frames.push(bitmap)
      }
    }
    totalFrames.value = files.value.length
    currentFrame.value = 0

    ready.value = true
    await nextTick()
    
    const canvas = canvasRef.value
    if (!canvas) throw new Error('Canvas 尚未初始化')
    ctx = canvas.getContext('2d')

    // 用第一張圖設定 canvas 尺寸
    const firstBitmap = loadAll.value ? frames[0] : await loadBitmap(files.value[0])
    
    canvas.width = firstBitmap.width
    canvas.height = firstBitmap.height

    const maxWidth = document.documentElement.clientWidth * 0.9  // 保留點 margin
    const maxHeight = document.documentElement.clientHeight * 0.8 // 保留點 margin

    let scale = Math.min(maxWidth / firstBitmap.width, maxHeight / firstBitmap.height, 1) // 不放大超過 100%
    canvas.style.width = `${firstBitmap.width * scale}px`
    canvas.style.height = `${firstBitmap.height * scale}px`

    // 預載模式下，先畫第一幀
    if (loadAll.value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(frames[0], 0, 0)
    } else {
      // 非預載模式，畫第一幀
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(firstBitmap, 0, 0)
    }

    play()
  } catch (err) {
    error.value = err.message
  } finally {
    preparing.value = false
    done.value = true
  }
}

function play() {
  if (playing.value) return // 避免重複啟動
  playing.value = true
  playTimer = setInterval(async () => {
    if (currentBitmap && !loadAll.value) {
      currentBitmap.close?.()
    }

    const frame = loadAll.value ? frames[currentFrame.value] : await loadBitmap(files.value[currentFrame.value])
    currentBitmap = frame
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(frame, 0, 0)
    currentFrame.value = (currentFrame.value + 1) % totalFrames.value
  }, 1000 / fps.value)
}

function stop() {
  pause()
  currentFrame.value = 0
  if (ctx && canvasRef.value) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

function pause()
{
  playing.value = false
  clearInterval(playTimer)
}

function seek() {
  if (!ctx) return
  if (loadAll.value) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(frames[currentFrame.value], 0, 0)
  } else {
    loadBitmap(files.value[currentFrame.value]).then(img => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.drawImage(img, 0, 0)
    })
  }
}

</script>


<style scoped>
.container {
  max-width: 900px;
  margin: auto;
  padding: 1rem;
  font-family: sans-serif;
}
.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.status {
  margin: 0.5rem 0;
  font-weight: bold;
}
.player {
  margin-top: 1rem;
}
.play-controls {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.canvas {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
input[type="range"] {
  width: 300px;
}
.download-btn {
  background: #42b983;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
}
.error { color: #c0392b; margin-top: .5rem; }

.play-controls button {
  font-size: 1rem;   /* 字體放大 */
  padding: 0.6rem 1rem;  /* 內距變大 */
  border-radius: 6px;  /* 圓角稍微大點 */
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 可選：增加 hover 效果 */
.play-controls button:hover {
  background-color: #4c4c4c;
  color: white;
}

</style>
