<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="info-panel">
      <!-- 标题 -->
      <div class="panel-header">
        <span class="panel-title">📋 角色信息</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- 角色头像 -->
        <div class="avatar-section">
          <div class="avatar-frame">
            <img :src="characterImg" alt="角色" class="avatar-img" />
          </div>
          <div class="name-section">
            <div v-if="!isEditingName" class="name-display" @click="startEditName">
              <span class="char-name">{{ petStore.characterName }}</span>
              <span class="edit-hint">✏️</span>
            </div>
            <div v-else class="name-edit">
              <input
                v-model="editName"
                class="name-input"
                maxlength="10"
                @keydown.enter="saveName"
                @blur="saveName"
                ref="nameInputRef"
              />
            </div>
          </div>
        </div>

        <!-- 信息卡片 -->
        <div class="info-cards">
          <div class="info-card">
            <span class="card-icon">💖</span>
            <div class="card-content">
              <span class="card-label">好感度</span>
              <div class="mood-bar">
                <div class="mood-fill" :style="{ width: petStore.mood + '%' }"></div>
              </div>
              <span class="card-value">{{ petStore.mood }}/100</span>
            </div>
          </div>

          <div class="info-card">
            <span class="card-icon">{{ emotionIcon }}</span>
            <div class="card-content">
              <span class="card-label">当前情绪</span>
              <span class="card-value emotion-text">{{ emotionText }}</span>
            </div>
          </div>

          <div class="info-card">
            <span class="card-icon">⏱️</span>
            <div class="card-content">
              <span class="card-label">陪伴时间</span>
              <span class="card-value">{{ companionDays }} 天</span>
            </div>
          </div>

          <div class="info-card">
            <span class="card-icon">👆</span>
            <div class="card-content">
              <span class="card-label">今日互动</span>
              <span class="card-value">{{ petStore.todayInteractions }} 次</span>
            </div>
          </div>
        </div>

        <!-- 大小调节 -->
        <div class="size-section">
          <span class="size-label">桌宠大小</span>
          <div class="size-control">
            <button class="size-btn" @click="changeSize(-0.1)">-</button>
            <span class="size-value">{{ Math.round(petStore.petSize * 100) }}%</span>
            <button class="size-btn" @click="changeSize(0.1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { usePetStore } from '../stores/petStore'
import characterImg from '../assets/character/idle.png'

defineEmits(['close'])

const petStore = usePetStore()

// 编辑名字
const isEditingName = ref(false)
const editName = ref('')
const nameInputRef = ref(null)

function startEditName() {
  editName.value = petStore.characterName
  isEditingName.value = true
  nextTick(() => {
    if (nameInputRef.value) nameInputRef.value.focus()
  })
}

function saveName() {
  if (editName.value.trim()) {
    petStore.setCharacterName(editName.value.trim())
  }
  isEditingName.value = false
}

// 情绪显示
const emotionMap = {
  happy: { icon: '😊', text: '开心' },
  normal: { icon: '😌', text: '普通' },
  bored: { icon: '😐', text: '无聊' },
  sleepy: { icon: '😴', text: '困倦' },
  angry: { icon: '😤', text: '生气' }
}

const emotionIcon = computed(() => emotionMap[petStore.emotion]?.icon || '😌')
const emotionText = computed(() => emotionMap[petStore.emotion]?.text || '普通')

// 陪伴天数
const companionDays = computed(() => {
  const diff = Date.now() - petStore.companionStartTime
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))
})

// 大小调节
function changeSize(delta) {
  const newSize = Math.max(0.5, Math.min(2, petStore.petSize + delta))
  petStore.setPetSize(Math.round(newSize * 10) / 10)
}
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

.info-panel {
  width: 280px;
  max-height: 420px;
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
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(147, 112, 219, 0.1), rgba(255, 182, 193, 0.15));
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-frame {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 182, 193, 0.5);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name-display {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.name-display:hover {
  background: rgba(255, 182, 193, 0.1);
}

.char-name {
  font-size: 16px;
  font-weight: 700;
  color: #4a4a6a;
}

.edit-hint {
  font-size: 12px;
  opacity: 0.5;
}

.name-input {
  padding: 4px 10px;
  border: 1px solid rgba(255, 182, 193, 0.5);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  outline: none;
  width: 100px;
  color: #4a4a6a;
}

/* 信息卡片 */
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}

.card-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 11px;
  color: #999;
}

.card-value {
  font-size: 13px;
  font-weight: 600;
  color: #4a4a6a;
}

.emotion-text {
  color: #ff69b4;
}

/* 好感度条 */
.mood-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
  margin: 2px 0;
}

.mood-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb6c1, #ff69b4);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 大小调节 */
.size-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}

.size-label {
  font-size: 12px;
  color: #666;
}

.size-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.size-btn {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 50%;
  background: white;
  color: #ff69b4;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.size-btn:hover {
  background: rgba(255, 182, 193, 0.2);
}

.size-value {
  font-size: 12px;
  color: #4a4a6a;
  font-weight: 600;
  min-width: 36px;
  text-align: center;
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
