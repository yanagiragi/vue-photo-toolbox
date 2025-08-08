<template>
  <Header />
  
  <div class="container">
    <h2>圖片壓縮與批次處理</h2>

    <div class="control-bar">
      <label>每批處理張數：</label>
      <input
        type="number"
        v-model.number="chunkSize"
        min="1"
        max="500"
        @change="saveChunkSize"
      />

      <label>壓縮比例 (品質)：</label>
      <input
        type="number"
        v-model.number="compressionRatio"
        min="0.1"
        max="1"
        step="0.05"
        @change="saveCompressionRatio"
      />
    </div>

    <input type="file" multiple accept="image/*" @change="handleFileChange" />

    <div v-if="total > 0" class="progress">
      處理進度：{{ done }} / {{ total }} 張
    </div>

    <div v-if="fileChunks.length > 0">
      <p>共分為 {{ fileChunks.length }} 批：</p>
      <ul>
        <li v-for="(chunk, index) in fileChunks" :key="index">
          <button
            :disabled="isProcessing || processedChunks.has(index)"
            @click="selectChunk(index)"
          >
            處理第 {{ index + 1 }} 批（{{ chunk.length }} 張）
            <span v-if="processedChunks.has(index)">✅</span>
          </button>
        </li>
      </ul>
    </div>

    <div v-if="zipBlob">
      <a
        :href="zipUrl"
        :download="`compressed_images_batch_${currentBatchIndex + 1}.zip`"
      >
        下載第 {{ currentBatchIndex + 1 }} 批壓縮圖片
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from '../components/Header.vue'
import JSZip from 'jszip'

// 定義 reactive 狀態
const chunkSize = ref(100)
const compressionRatio = ref(parseFloat(localStorage.getItem('compressionRatio') || '0.5'))
const files = ref([])
const fileChunks = ref([])
const selectedChunk = ref([])
const isProcessing = ref(false)
const zipBlob = ref(null)
const zipUrl = ref(null)
const currentBatchIndex = ref(null)
const processedChunks = ref(new Set())

const done = ref(0)
const total = ref(0)

// 讀取 localStorage
onMounted(() => {
  const savedChunkSize = localStorage.getItem('chunkSize')
  if (savedChunkSize) {
    chunkSize.value = parseInt(savedChunkSize)
  }
})

function saveCompressionRatio() {
  localStorage.setItem('compressionRatio', compressionRatio.value)
}

function saveChunkSize() {
  localStorage.setItem('chunkSize', chunkSize.value)
}

function handleFileChange(event) {
  const fileList = Array.from(event.target.files || [])
  files.value = fileList
  total.value = fileList.length
  done.value = 0
  zipBlob.value = null
  zipUrl.value = null
  processedChunks.value = new Set()

  // 分批
  fileChunks.value = []
  for (let i = 0; i < fileList.length; i += chunkSize.value) {
    fileChunks.value.push(fileList.slice(i, i + chunkSize.value))
  }
}

function selectChunk(index) {
  selectedChunk.value = fileChunks.value[index]
  currentBatchIndex.value = index
  saveChunkSize()
  processChunk(selectedChunk.value, index)
}

async function processChunk(chunk, batchIndex) {
  isProcessing.value = true

  // 清理 zip url
  if (zipUrl.value) {
    URL.revokeObjectURL(zipUrl.value)
    zipUrl.value = null
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const zip = new JSZip()

  done.value = 0
  total.value = chunk.length

  for (const file of chunk) {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    await new Promise((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
    })

    canvas.width = img.width * compressionRatio.value
    canvas.height = img.height * compressionRatio.value
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', compressionRatio.value)
    )

    zip.file(file.name, blob)

    // ✅ 清除 img 資源
    URL.revokeObjectURL(img.src)
    img.src = ''

    done.value++
  }

  const zipResult = await zip.generateAsync({ type: 'blob' })
  zipBlob.value = zipResult
  zipUrl.value = URL.createObjectURL(zipBlob.value)

  processedChunks.value.add(batchIndex)
  isProcessing.value = false
}

</script>

<style scoped>
.container {
  padding: 1rem;
  font-family: sans-serif;
  max-width: 700px;
  margin: auto;
}
.control-bar {
  margin: 1rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.progress {
  font-weight: bold;
  margin: 1rem 0;
}
ul {
  list-style: none;
  padding: 0;
}
button {
  margin-bottom: 8px;
}
</style>
