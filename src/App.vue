<template>
  <div
    class="app-container"
    :class="{ 'night-mode': petStore.data.settings.nightMode, 'no-shadow': !petStore.data.settings.showShadow }"
    @contextmenu.prevent="showContextMenu"
  >
    <!-- 桌宠角色 -->
    <PetCharacter
      @click="handleClick"
      @dblclick="handleDblClick"
      @mouseenter="handleHover"
      @mouseleave="handleHoverEnd"
    />

    <!-- 气泡对话 -->
    <SpeechBubble v-if="petStore.showBubble" :text="petStore.bubbleText" />

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="showMenu"
      :x="menuX"
      :y="menuY"
      @close="showMenu = false"
      @open-chat="openChat"
      @open-pomodoro="openPomodoro"
      @open-reminder="openReminder"
      @open-study="openStudy"
      @open-info="openInfo"
      @open-achievements="openAchievements"
      @open-settings="openSettings"
      @open-shortcuts="openShortcuts"
      @toggle-top="toggleAlwaysOnTop"
      @set-opacity="setOpacity"
      @set-pet-size="setPetSize"
      @toggle-shadow="toggleShadow"
      @toggle-night-mode="toggleNightMode"
      @toggle-taskbar="toggleTaskbar"
      @toggle-auto-launch="toggleAutoLaunch"
      @reset-position="resetPosition"
      @hide-pet="hidePet"
      @quit="quitApp"
    />

    <!-- 聊天面板 -->
    <ChatPanel
      v-if="showChatPanel"
      @close="showChatPanel = false"
      @open-shortcuts="openShortcuts"
    />

    <!-- 番茄钟面板 -->
    <PomodoroPanel v-if="showPomodoroPanel" @close="showPomodoroPanel = false" />

    <!-- 提醒设置面板 -->
    <ReminderPanel v-if="showReminderPanel" @close="showReminderPanel = false" />

    <!-- 角色信息面板 -->
    <CharacterInfoPanel v-if="showInfoPanel" @close="showInfoPanel = false" />

    <StudyPanel v-if="showStudyPanel" @close="showStudyPanel = false" />
    <AchievementsPanel v-if="showAchievementsPanel" @close="showAchievementsPanel = false" />
    <SettingsPanel
      v-if="showSettingsPanel"
      @close="showSettingsPanel = false"
      @open-shortcuts="openShortcuts"
    />
    <ShortcutsPanel v-if="showShortcutsPanel" @close="showShortcutsPanel = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePetStore } from './stores/petStore'
import { usePetBehavior } from './composables/usePetBehavior'
import PetCharacter from './components/PetCharacter.vue'
import SpeechBubble from './components/SpeechBubble.vue'
import ContextMenu from './components/ContextMenu.vue'
import ChatPanel from './components/ChatPanel.vue'
import PomodoroPanel from './components/PomodoroPanel.vue'
import ReminderPanel from './components/ReminderPanel.vue'
import CharacterInfoPanel from './components/CharacterInfoPanel.vue'
import StudyPanel from './components/StudyPanel.vue'
import AchievementsPanel from './components/AchievementsPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ShortcutsPanel from './components/ShortcutsPanel.vue'

const petStore = usePetStore()
usePetBehavior()

// 面板显示状态
const showMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const showChatPanel = ref(false)
const showPomodoroPanel = ref(false)
const showReminderPanel = ref(false)
const showInfoPanel = ref(false)
const showStudyPanel = ref(false)
const showAchievementsPanel = ref(false)
const showSettingsPanel = ref(false)
const showShortcutsPanel = ref(false)

// 右键菜单
function showContextMenu(e) {
  menuX.value = e.clientX
  menuY.value = e.clientY
  showMenu.value = true
}

// 点击桌宠：随机说话
function handleClick() {
  petStore.onInteract('click')
}

// 双击桌宠：打开聊天
function handleDblClick() {
  showChatPanel.value = true
  petStore.onInteract('dblclick')
}

// 鼠标悬停
function handleHover() {
  if (['idle', 'hover', 'sit', 'sleep', 'sleepy', 'bored'].includes(petStore.currentState)) {
    petStore.setState('hover', { force: true, duration: 1000 })
  }
}

function handleHoverEnd() {
  petStore.setLookDirection(0, 0)
  if (petStore.currentState === 'hover') {
    petStore.setState('idle', { force: true })
  }
}

// 菜单操作
function openChat() {
  showChatPanel.value = true
  showMenu.value = false
}

function openPomodoro() {
  showPomodoroPanel.value = true
  showMenu.value = false
}

function openReminder() {
  showReminderPanel.value = true
  showMenu.value = false
}

function openStudy() {
  showStudyPanel.value = true
  showMenu.value = false
}

function openInfo() {
  showInfoPanel.value = true
  showMenu.value = false
}

function openAchievements() {
  showAchievementsPanel.value = true
  showMenu.value = false
}

function openSettings() {
  showSettingsPanel.value = true
  showMenu.value = false
}

function openShortcuts() {
  showShortcutsPanel.value = true
  showMenu.value = false
}

async function toggleAlwaysOnTop() {
  petStore.alwaysOnTop = !petStore.alwaysOnTop
  if (window.electronAPI) {
    await window.electronAPI.setAlwaysOnTop(petStore.alwaysOnTop)
  }
  showMenu.value = false
}

async function setOpacity(val) {
  petStore.opacity = val
  if (window.electronAPI) {
    await window.electronAPI.setOpacity(val)
  }
}

function setPetSize(val) {
  petStore.setPetSize(val)
}

function toggleShadow() {
  petStore.setSetting('showShadow', !petStore.data.settings.showShadow)
  showMenu.value = false
}

function toggleNightMode() {
  petStore.setSetting('nightMode', !petStore.data.settings.nightMode)
  showMenu.value = false
}

async function toggleTaskbar() {
  const next = !petStore.data.settings.showInTaskbar
  petStore.setSetting('showInTaskbar', next)
  if (window.electronAPI?.setShowInTaskbar) {
    await window.electronAPI.setShowInTaskbar(next)
  }
  showMenu.value = false
}

async function toggleAutoLaunch() {
  if (window.electronAPI) {
    const current = await window.electronAPI.getAutoLaunch()
    await window.electronAPI.setAutoLaunch(!current)
    petStore.autoLaunch = !current
  }
  showMenu.value = false
}

async function resetPosition() {
  if (window.electronAPI?.getWorkArea && window.electronAPI?.setPosition) {
    const area = await window.electronAPI.getWorkArea()
    await window.electronAPI.setPosition(area.x + area.width - 400, area.y + area.height - 520)
  }
  showMenu.value = false
}

async function hidePet() {
  if (window.electronAPI) {
    await window.electronAPI.hide()
  }
  showMenu.value = false
}

async function quitApp() {
  if (window.electronAPI) {
    await window.electronAPI.quit()
  }
}

// 定时器：情绪衰减 & 时间问候 & 随机自言自语
let emotionTimer = null
let greetTimer = null
let monologueTimer = null
let reminderTimer = null

function checkReminders() {
  const now = new Date()
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dateKey = now.toISOString().slice(0, 10)
  petStore.reminders.forEach(item => {
    if (!item.enabled || item.time !== current) return
    const alreadyDoneToday = item.completed.some(ts => new Date(ts).toISOString().slice(0, 10) === dateKey)
    if (!alreadyDoneToday) petStore.completeReminder(item.id)
  })
}

onMounted(() => {
  petStore.init()

  // 每 5 分钟检查情绪衰减
  emotionTimer = setInterval(() => {
    petStore.decayEmotion()
  }, 5 * 60 * 1000)

  // 每 30 分钟检查时间段问候
  greetTimer = setInterval(() => {
    petStore.timeGreeting()
  }, 30 * 60 * 1000)

  // 初始问候
  setTimeout(() => {
    petStore.timeGreeting()
  }, 2000)

  // 每 3~8 分钟随机自言自语
  const scheduleMonologue = () => {
    const delay = (3 + Math.random() * 5) * 60 * 1000
  monologueTimer = setTimeout(() => {
      petStore.randomMonologue()
      scheduleMonologue()
    }, delay)
  }
  scheduleMonologue()

  reminderTimer = setInterval(checkReminders, 30 * 1000)
  window.electronAPI?.onTrayOpenSettings?.(() => openSettings())
  window.electronAPI?.onTrayOpenPomodoro?.(() => openPomodoro())
})

onUnmounted(() => {
  clearInterval(emotionTimer)
  clearInterval(greetTimer)
  clearTimeout(monologueTimer)
  clearInterval(reminderTimer)
  petStore.dispose()
})
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  /* 透明背景 */
  background: transparent;
  user-select: none;
}

.app-container.night-mode :deep(.character-img) {
  filter: brightness(0.86) saturate(0.9) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.18));
}

.app-container.no-shadow :deep(.character-img) {
  filter: none !important;
}
</style>
