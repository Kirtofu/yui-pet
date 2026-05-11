<template>
  <Teleport to="body">
    <div class="menu-overlay" @click="$emit('close')" @contextmenu.prevent="$emit('close')">
      <div
        class="context-menu"
        :style="{ left: adjustedX + 'px', top: adjustedY + 'px', maxHeight: menuMaxHeight + 'px' }"
        @click.stop
        @wheel.stop
      >
        <div class="menu-item" @click="$emit('open-chat')">
          <span class="menu-icon">💬</span>
          <span>打开聊天</span>
        </div>
        <div class="menu-item" @click="$emit('open-pomodoro')">
          <span class="menu-icon">🍅</span>
          <span>番茄钟</span>
        </div>
        <div class="menu-item" @click="$emit('open-reminder')">
          <span class="menu-icon">⏰</span>
          <span>提醒设置</span>
        </div>
        <div class="menu-item" @click="$emit('open-study')">
          <span class="menu-icon">📚</span>
          <span>学习陪伴</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="$emit('open-info')">
          <span class="menu-icon">📋</span>
          <span>角色信息</span>
        </div>
        <div class="menu-item" @click="$emit('open-achievements')">
          <span class="menu-icon">🏅</span>
          <span>成就</span>
        </div>
        <div class="menu-item" @click="$emit('open-settings')">
          <span class="menu-icon">⚙️</span>
          <span>设置</span>
        </div>
        <div class="menu-item" @click="$emit('toggle-top')">
          <span class="menu-icon">📌</span>
          <span>{{ alwaysOnTop ? '取消置顶' : '置顶显示' }}</span>
        </div>
        <div class="menu-item has-submenu">
          <span class="menu-icon">🔅</span>
          <span>透明度</span>
          <div class="submenu opacity-submenu">
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              :value="opacity"
              @input="$emit('set-opacity', Number($event.target.value))"
              class="opacity-slider"
            />
            <span class="opacity-value">{{ Math.round(opacity * 100) }}%</span>
          </div>
        </div>
        <div class="menu-item has-submenu">
          <span class="menu-icon">🔎</span>
          <span>角色大小</span>
          <div class="submenu opacity-submenu">
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              :value="petSize"
              @input="$emit('set-pet-size', Number($event.target.value))"
              class="opacity-slider"
            />
            <span class="opacity-value">{{ Math.round(petSize * 100) }}%</span>
          </div>
        </div>
        <div class="menu-item" @click="$emit('toggle-shadow')">
          <span class="menu-icon">🌗</span>
          <span>{{ showShadow ? '隐藏阴影' : '显示阴影' }}</span>
          <span class="menu-check" v-if="showShadow">✓</span>
        </div>
        <div class="menu-item" @click="$emit('toggle-night-mode')">
          <span class="menu-icon">🌙</span>
          <span>夜间模式</span>
          <span class="menu-check" v-if="nightMode">✓</span>
        </div>
        <div class="menu-item" @click="$emit('toggle-taskbar')">
          <span class="menu-icon">🪟</span>
          <span>任务栏显示</span>
          <span class="menu-check" v-if="showInTaskbar">✓</span>
        </div>
        <div class="menu-item" @click="$emit('toggle-auto-launch')">
          <span class="menu-icon">🚀</span>
          <span>开机自启动</span>
          <span class="menu-check" v-if="autoLaunch">✓</span>
        </div>
        <div class="menu-item" @click="$emit('reset-position')">
          <span class="menu-icon">🎯</span>
          <span>回到右下角</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="$emit('hide-pet')">
          <span class="menu-icon">👻</span>
          <span>隐藏桌宠</span>
        </div>
        <div class="menu-item menu-item-danger" @click="$emit('quit')">
          <span class="menu-icon">❌</span>
          <span>退出程序</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { usePetStore } from '../stores/petStore'

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})

defineEmits([
  'close', 'open-chat', 'open-pomodoro', 'open-reminder',
  'open-study', 'open-info', 'open-achievements', 'open-settings',
  'toggle-top', 'set-opacity', 'set-pet-size', 'toggle-shadow',
  'toggle-night-mode', 'toggle-taskbar', 'toggle-auto-launch',
  'reset-position', 'hide-pet', 'quit'
])

const petStore = usePetStore()
const alwaysOnTop = computed(() => petStore.alwaysOnTop)
const opacity = computed(() => petStore.opacity)
const autoLaunch = computed(() => petStore.autoLaunch)
const petSize = computed(() => petStore.petSize)
const showShadow = computed(() => petStore.data.settings.showShadow)
const nightMode = computed(() => petStore.data.settings.nightMode)
const showInTaskbar = computed(() => petStore.data.settings.showInTaskbar)

// 防止菜单超出窗口
const adjustedX = computed(() => {
  const menuWidth = 200
  return Math.min(props.x, window.innerWidth - menuWidth - 10)
})

const adjustedY = computed(() => {
  const visibleHeight = Math.min(456, window.innerHeight - 16)
  return Math.max(8, Math.min(props.y, window.innerHeight - visibleHeight - 8))
})

const menuMaxHeight = computed(() => {
  return Math.max(160, window.innerHeight - adjustedY.value - 8)
})
</script>

<style scoped>
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.context-menu {
  position: absolute;
  min-width: 180px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 6px 0;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 182, 193, 0.2);
  animation: menu-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.context-menu::-webkit-scrollbar {
  width: 5px;
}

.context-menu::-webkit-scrollbar-track {
  background: transparent;
}

.context-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 182, 193, 0.55);
  border-radius: 999px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #4a4a6a;
  transition: background 0.15s ease;
  position: relative;
}

.menu-item:hover {
  background: rgba(255, 182, 193, 0.15);
}

.menu-item-danger:hover {
  background: rgba(255, 100, 100, 0.1);
  color: #e74c3c;
}

.menu-icon {
  margin-right: 10px;
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.menu-check {
  margin-left: auto;
  color: #ff8fab;
  font-weight: bold;
}

.menu-divider {
  height: 1px;
  margin: 4px 12px;
  background: rgba(0, 0, 0, 0.06);
}

/* 透明度子菜单 */
.has-submenu {
  flex-wrap: wrap;
}

.submenu {
  display: none;
  width: 100%;
  padding: 6px 0 2px 30px;
}

.has-submenu:hover .submenu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opacity-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #ffb6c1, #ff69b4);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff69b4;
  box-shadow: 0 1px 4px rgba(255, 105, 180, 0.4);
  cursor: pointer;
}

.opacity-value {
  font-size: 11px;
  color: #999;
}

@keyframes menu-pop {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
