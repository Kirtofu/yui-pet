<template>
  <div class="speech-bubble" :class="{ 'show': true }">
    <div class="bubble-content">
      <span class="bubble-text">{{ text }}</span>
    </div>
    <div class="bubble-tail"></div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.speech-bubble {
  position: absolute;
  bottom: 292px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: bubble-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.bubble-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 10px 16px;
  max-width: 200px;
  min-width: 80px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.bubble-text {
  font-size: 13px;
  line-height: 1.5;
  color: #4a4a6a;
  word-break: break-word;
}

.bubble-tail {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.05));
}

@keyframes bubble-in {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
</style>
