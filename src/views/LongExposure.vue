<template>
  <Header />

  <div class="container">
    <h2>長曝光合成</h2>

    <input type="file" multiple accept="image/*" @change="handleFiles" />

    <div v-if="images.length > 0">
      <p>已選擇 {{ images.length }} 張圖片</p>
      <button @click="startProcessing" :disabled="processing">
        開始合成
        <span v-if="done">✅</span>
      </button>
    </div>

    <div v-if="processing">
      <p>正在合成第 {{ currentIndex }} 張 / 共 {{ images.length }} 張</p>
    </div>

    <div v-if="resultUrl">
      <h3>合成完成</h3>
      <a :href="resultUrl" download="long_exposure.jpg">下載圖片</a>
    </div>  
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import Header from "../components/Header.vue";

const images = ref([]);
const processing = ref(false);
const currentIndex = ref(0);
const resultUrl = ref(null);
const done = ref(false);

function handleFiles(event) {
  images.value = Array.from(event.target.files); // 只存檔案參考，不轉成 Base64
}

async function startProcessing() {
  if (images.value.length === 0) return;

  done.value = false
  processing.value = true;
  currentIndex.value = 0;

  let canvas, ctx;

  for (let i = 0; i < images.value.length; i++) {
    currentIndex.value = i + 1;

    const img = await loadImage(images.value[i]);

    if (i === 0) {
      // 初始化畫布
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(img, 0, 0);
    }

    // 釋放圖片記憶體
    img.src = "";
    await nextTick();
  }

  resultUrl.value = canvas.toDataURL("image/jpeg", 0.9);
  processing.value = false;
  done.value = true;
}

function loadImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); // 直接用 blob URL，節省記憶體
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // 用完就釋放
      resolve(img);
    };
    img.src = url;
  });
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
