<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="achievement-panel">
      <div class="panel-header">
        <span class="panel-title">🏅 成就</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="panel-body">
        <div v-for="item in petStore.achievements" :key="item.id" class="achievement" :class="{ unlocked: item.unlocked }">
          <div class="badge">{{ item.unlocked ? '🏅' : '🔒' }}</div>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
            <small v-if="item.unlockedAt">解锁于 {{ formatDate(item.unlockedAt) }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePetStore } from '../stores/petStore'

defineEmits(['close'])
const petStore = usePetStore()

function formatDate(ts) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
.panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievement-panel {
  width: 320px;
  max-height: 500px;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 182, 193, 0.3);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.14);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 182, 193, 0.16);
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #4a4a6a;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
}

.panel-body {
  max-height: 444px;
  overflow: auto;
  padding: 14px;
}

.achievement {
  display: flex;
  gap: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.62);
  opacity: 0.58;
}

.achievement.unlocked {
  opacity: 1;
  background: rgba(255, 245, 196, 0.56);
}

.badge {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 182, 193, 0.2);
  flex-shrink: 0;
}

strong {
  font-size: 13px;
  color: #4a4a6a;
}

p {
  margin: 4px 0;
  font-size: 12px;
  color: #777;
}

small {
  font-size: 10px;
  color: #aaa;
}
</style>
