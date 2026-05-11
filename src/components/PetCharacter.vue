<template>
  <div
    class="pet-character"
    :class="[`state-${petStore.currentState}`, `emotion-${petStore.emotion}`, `face-${petStore.facing}`, { dropped: justDropped }]"
    :style="{
      transform: `scale(${petStore.petSize})`,
      '--look-x': petStore.lookX,
      '--look-y': petStore.lookY
    }"
    @mousedown.left="onMouseDown"
    @mouseup.left="onMouseUp"
    @click.left="$emit('click')"
    @dblclick.left="$emit('dblclick')"
    @mousemove="onPointerMove"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <!-- 角色图片主体 -->
    <div class="character-body">
      <img
        :src="characterImage"
        alt="桌宠"
        class="character-img"
        draggable="false"
        @error="onImageError"
      />
    </div>

    <!-- 呼吸光效：贴着脚的地面光 -->
    <div class="breath-glow foot-glow"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePetStore } from '../stores/petStore'
import idleSrc from '../assets/character/idle.png'
import happySrc from '../assets/character/happy.png'
import angrySrc from '../assets/character/angry.png'
import sleepySrc from '../assets/character/sleepy.png'
import dragSrc from '../assets/character/drag.png'
import walkSrc from '../assets/character/walk.png'
import sleepSrc from '../assets/character/sleep.png'
import stretchSrc from '../assets/character/stretch.png'
import sitSrc from '../assets/character/sit.png'
import headpatSrc from '../assets/character/headpat.png'
import startledSrc from '../assets/character/startled.png'

const emit = defineEmits(['click', 'dblclick', 'mouseenter', 'mouseleave'])
const petStore = usePetStore()

const stateImages = {
  idle: idleSrc,
  blink: idleSrc,
  walk: walkSrc,
  sleep: sleepSrc,
  happy: happySrc,
  angry: angrySrc,
  bored: sitSrc,
  sleepy: sleepySrc,
  click: happySrc,
  drag: dragSrc,
  hover: idleSrc,
  work: idleSrc,
  rest: happySrc,
  talk: happySrc,
  remind: happySrc,
  pomodoro: happySrc,
  headpat: headpatSrc,
  startled: startledSrc,
  stretch: stretchSrc,
  sit: sitSrc
}

const emotionImages = {
  happy: happySrc,
  sleepy: sleepySrc,
  angry: angrySrc
}

const characterImage = computed(() => {
  return stateImages[petStore.currentState] || emotionImages[petStore.emotion] || idleSrc
})

function onImageError(e) {
  e.target.src = idleSrc
}

// ========== 拖拽逻辑 ==========
let isDragging = false
let hasMoved = false
let justDropped = ref(false)
let lastHeadpatAt = 0
let startX = 0
let startY = 0

function onMouseDown(e) {
  if (e.button !== 0) return
  isDragging = true
  hasMoved = false
  startX = e.screenX
  startY = e.screenY

  // 计算鼠标在窗口内的偏移
  const offsetX = e.clientX
  const offsetY = e.clientY

  if (window.electronAPI) {
    window.electronAPI.dragStart({ offsetX, offsetY })
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUpGlobal)
}

function onMouseMove(e) {
  if (!isDragging) return

  const dx = Math.abs(e.screenX - startX)
  const dy = Math.abs(e.screenY - startY)

  // 移动超过 5px 才算拖拽
  if (dx > 5 || dy > 5) {
    if (!hasMoved) {
      hasMoved = true
      petStore.startDrag()
    }
    if (window.electronAPI) {
      window.electronAPI.dragMove({ screenX: e.screenX, screenY: e.screenY })
    }
  }
}

function onMouseUp() {
  // 组件内的 mouseup
}

function onMouseUpGlobal() {
  if (isDragging && hasMoved) {
    petStore.endDrag()
    justDropped.value = true
    setTimeout(() => {
      justDropped.value = false
    }, 700)
  }
  isDragging = false
  hasMoved = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUpGlobal)

  if (window.electronAPI) {
    window.electronAPI.dragEnd()
  }
}

function onPointerMove(e) {
  if (isDragging) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const inHead = x > rect.width * 0.32 && x < rect.width * 0.68 && y > rect.height * 0.05 && y < rect.height * 0.34
  const now = Date.now()
  if (inHead && now - lastHeadpatAt > 2500) {
    lastHeadpatAt = now
    petStore.onHeadpat()
  }
}

// ========== 自动眨眼 ==========
let blinkTimer = null

function scheduleBlink() {
  const delay = 3000 + Math.random() * 4000 // 3~7 秒眨一次
  blinkTimer = setTimeout(() => {
    if (petStore.currentState === 'idle') {
      petStore.setState('blink')
      setTimeout(() => {
        if (petStore.currentState === 'blink') {
          petStore.setState('idle')
        }
      }, 200)
    }
    scheduleBlink()
  }, delay)
}

onMounted(() => {
  scheduleBlink()
})

onUnmounted(() => {
  clearTimeout(blinkTimer)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUpGlobal)
})
</script>

<style scoped>
.pet-character {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform-origin: bottom center;
  margin-left: -120px;
  width: 240px;
  height: 360px;
  cursor: pointer;
  transition: transform 0.3s ease;
  /* 防止拖拽时选中 */
  user-select: none;
  -webkit-user-drag: none;
}

.character-body {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s ease;
}

.face-left .character-body {
  transform: scaleX(1);
}

.face-right .character-body {
  transform: scaleX(-1);
}

.state-hover.face-left .character-body {
  transform:
    translateX(calc(var(--look-x, 0) * 8px))
    translateY(calc(var(--look-y, 0) * 4px))
    rotate(calc(var(--look-x, 0) * 5deg))
    scaleX(1);
}

.state-hover.face-right .character-body {
  transform:
    translateX(calc(var(--look-x, 0) * 8px))
    translateY(calc(var(--look-y, 0) * 4px))
    rotate(calc(var(--look-x, 0) * 5deg))
    scaleX(-1);
}

.character-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  transition: filter 0.3s ease, transform 0.3s ease;
}

/* ========== 状态动画 ========== */

/* 待机：轻微呼吸浮动 */
.state-idle .character-img {
  animation: breathe 3s ease-in-out infinite;
}

/* 眨眼 */
.state-blink .character-img {
  animation: none;
}

/* 开心 */
.state-happy .character-img {
  animation: happy-bounce 0.6s ease;
  filter: drop-shadow(0 4px 16px rgba(255, 182, 193, 0.4)) brightness(1.05);
}

/* 生气 */
.state-angry .character-img {
  animation: angry-shake 0.4s ease;
  filter: drop-shadow(0 4px 12px rgba(255, 100, 100, 0.3)) saturate(1.2);
}

/* 困倦 */
.state-sleepy .character-img {
  animation: sleepy-nod 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1)) brightness(0.9);
  opacity: 0.85;
}

/* 被点击 */
.state-click .character-img {
  animation: click-react 0.3s ease;
}

/* 被拖拽 */
.state-drag .character-img {
  animation: drag-swing 0.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
  cursor: grabbing;
}

/* 悬停 */
.state-hover .character-img {
  animation: look-peek 1.2s ease-in-out infinite;
  filter: drop-shadow(0 6px 16px rgba(255, 182, 193, 0.3)) brightness(1.02);
}

/* 工作提醒 */
.state-work .character-img {
  animation: work-focus 1s ease-in-out infinite;
}

/* 休息提醒 */
.state-rest .character-img {
  animation: rest-relax 2s ease-in-out infinite;
}

.state-walk .character-img {
  animation: walk-bob 0.9s ease-in-out infinite;
}

.state-sleep .character-img,
.state-sit .character-img {
  animation: sleep-breathe 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1)) brightness(0.92);
}

.state-talk .character-img {
  animation: gentle-sway 1s ease-in-out infinite;
}

.state-headpat .character-img {
  animation: soft-happy 1.4s ease-in-out;
  filter: drop-shadow(0 6px 18px rgba(255, 105, 180, 0.45)) brightness(1.08);
}

.state-startled .character-img {
  animation: startled-pop 0.55s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.state-stretch .character-img {
  animation: stretch-breathe 2.4s ease-in-out;
}

.state-remind .character-img,
.state-pomodoro .character-img {
  animation: happy-bounce 0.9s ease;
}

.pet-character.dropped .character-img {
  animation: drop-bounce 0.6s ease;
}

/* ========== 呼吸光效 ========== */
/*
 * 角色图在当前容器里下方仍有少量透明边距。
 * 光圈用 bottom 固定在脚底附近,避免落到窗口底部。
 */
.breath-glow {
  position: absolute;
  left: 50%;
  pointer-events: none;
  animation: glow-pulse 3s ease-in-out infinite;
}

/* 贴着脚:地面投影椭圆 */
.breath-glow.foot-glow {
  bottom: 82px;
  transform: translateX(-50%);
  width: 48%;
  height: 12px;
  background: radial-gradient(ellipse, rgba(255, 182, 193, 0.42) 0%, rgba(255, 182, 193, 0.14) 45%, transparent 75%);
  filter: blur(1px);
}

/* ========== 情绪颜色 ========== */
.emotion-happy .breath-glow.foot-glow {
  background: radial-gradient(ellipse, rgba(255, 215, 0, 0.42) 0%, rgba(255, 215, 0, 0.14) 45%, transparent 75%);
}
.emotion-bored .breath-glow.foot-glow {
  background: radial-gradient(ellipse, rgba(150, 150, 200, 0.3) 0%, rgba(150, 150, 200, 0.09) 45%, transparent 75%);
}

.emotion-sleepy .breath-glow.foot-glow {
  background: radial-gradient(ellipse, rgba(100, 100, 180, 0.28) 0%, rgba(100, 100, 180, 0.09) 45%, transparent 75%);
  animation: glow-pulse 4s ease-in-out infinite;
}

.emotion-angry .breath-glow.foot-glow {
  background: radial-gradient(ellipse, rgba(255, 100, 100, 0.42) 0%, rgba(255, 100, 100, 0.14) 45%, transparent 75%);
}
</style>
