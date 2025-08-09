<template>
  <div style="padding: 2rem">
    <h1>Photo Toolbox</h1>
    <ul>
      <li><router-link to="/compress">降低圖片解析度</router-link></li>
      <li><router-link to="/longExposure">長曝光合成</router-link></li>
      <li><router-link to="/timelapse">Timelapse GIF 生成器</router-link></li>
      <li><router-link to="/timelapseViewer">Timelapse 播放器</router-link></li>
    </ul>
  </div>
</template>

<style scoped>
div {
  font-family: sans-serif;
}

</style>
