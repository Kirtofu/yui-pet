<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="pomodoro-panel">
      <!-- 标题 -->
      <div class="panel-header">
        <span class="panel-title">🍅 番茄钟</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- 计时器显示 -->
        <div class="timer-display">
          <div class="timer-ring" :class="{ active: isRunning }">
            <svg viewBox="0 0 120 120" class="timer-svg">
              <circle cx="60" cy="60" r="52" class="ring-bg" />
              <circle
                cx="60" cy="60" r="52"
                class="ring-progress"
                :style="{ strokeDashoffset: progressOffset }"
              />
            </svg>
            <div class="timer-text">
              <span class="timer-time">{{ displayTime }}</span>
              <span class="timer-label">{{ phaseLabel }}</span>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="timer-controls">
          <button
            class="ctrl-btn"
            :class="{ primary: !isRunning }"
            @click="toggleTimer"
          >
            {{ isRunning ? '暂停' : (remaining < totalDuration ? '继续' : '开始') }}
          </button>
          <button class="ctrl-btn" @click="resetTimer">重置</button>
        </div>

        <!-- 设置 -->
        <div class="timer-settings">
          <div class="setting-row">
            <label>工作时长</label>
            <div class="setting-control">
              <button class="adj-btn" @click="adjustWork(-5)">-</button>
              <span>{{ workMinutes }} 分钟</span>
              <button class="adj-btn" @click="adjustWork(5)">+</button>
            </div>
          </div>
          <div class="setting-row">
            <label>休息时长</label>
            <div class="setting-control">
              <button class="adj-btn" @click="adjustBreak(-1)">-</button>
              <span>{{ breakMinutes }} 分钟</span>
              <button class="adj-btn" @click="adjustBreak(1)">+</button>
            </div>
          </div>
        </div>

        <!-- 统计 -->
        <div class="timer-stats">
          <span>🍅 总完成：{{ petStore.data.stats.pomodoroCompleted }} 个番茄</span>
          <span>今日专注：{{ petStore.data.stats.focusTodayMinutes }} 分钟</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { usePetStore } from '../stores/petStore'
import { formatTime } from '../utils/timer'

defineEmits(['close'])

const petStore = usePetStore()

// 番茄钟设置
const workMinutes = ref(25)
const breakMinutes = ref(5)
const phase = ref('work') // 'work' | 'break'
const isRunning = ref(false)

// 计时
const totalDuration = computed(() =>
  (phase.value === 'work' ? workMinutes.value : breakMinutes.value) * 60
)
const remaining = ref(totalDuration.value)

let intervalId = null

const displayTime = computed(() => formatTime(remaining.value))
const phaseLabel = computed(() => phase.value === 'work' ? '专注中' : '休息中')

// 进度环
const circumference = 2 * Math.PI * 52
const progressOffset = computed(() => {
  const progress = remaining.value / totalDuration.value
  return circumference * progress
})

function toggleTimer() {
  if (isRunning.value) {
    pause()
  } else {
    start()
  }
}

function start() {
  if (remaining.value <= 0) {
    remaining.value = totalDuration.value
  }
  isRunning.value = true
  intervalId = setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      complete()
    }
  }, 1000)
}

function pause() {
  isRunning.value = false
  clearInterval(intervalId)
  intervalId = null
}

function resetTimer() {
  pause()
  phase.value = 'work'
  remaining.value = workMinutes.value * 60
}

function complete() {
  pause()
  if (phase.value === 'work') {
    petStore.onPomodoroComplete('work', workMinutes.value)
    phase.value = 'break'
    remaining.value = breakMinutes.value * 60
  } else {
    petStore.onPomodoroComplete('break')
    phase.value = 'work'
    remaining.value = workMinutes.value * 60
  }
}

function adjustWork(delta) {
  if (isRunning.value) return
  workMinutes.value = Math.max(5, Math.min(60, workMinutes.value + delta))
  if (phase.value === 'work') {
    remaining.value = workMinutes.value * 60
  }
}

function adjustBreak(delta) {
  if (isRunning.value) return
  breakMinutes.value = Math.max(1, Math.min(30, breakMinutes.value + delta))
  if (phase.value === 'break') {
    remaining.value = breakMinutes.value * 60
  }
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pomodoro-panel {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 182, 193, 0.3);
  overflow: hidden;
  animation: panel-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 99, 71, 0.1), rgba(255, 182, 193, 0.15));
  border-bottom: 1px solid rgba(255, 182, 193, 0.2);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #4a4a6a;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.15);
  color: #e74c3c;
}

.panel-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 计时器环 */
.timer-display {
  position: relative;
}

.timer-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 182, 193, 0.2);
  stroke-width: 6;
}

.ring-progress {
  fill: none;
  stroke: #ff69b4;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 326.73;
  transition: stroke-dashoffset 1s linear;
}

.timer-ring.active .ring-progress {
  stroke: #ff4500;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-time {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #4a4a6a;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: 11px;
  color: #999;
}

/* 控制按钮 */
.timer-controls {
  display: flex;
  gap: 10px;
}

.ctrl-btn {
  padding: 8px 20px;
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a4a6a;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn.primary {
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
  color: white;
  border: none;
}

.ctrl-btn:hover {
  transform: scale(1.05);
}

/* 设置 */
.timer-settings {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.adj-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 50%;
  background: white;
  color: #ff69b4;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.adj-btn:hover {
  background: rgba(255, 182, 193, 0.2);
}

/* 统计 */
.timer-stats {
  font-size: 12px;
  color: #999;
}

@keyframes panel-slide-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
