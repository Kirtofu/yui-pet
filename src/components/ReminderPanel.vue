<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="reminder-panel">
      <div class="panel-header">
        <span class="panel-title">⏰ 提醒设置</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <div v-for="item in petStore.reminders" :key="item.id" class="reminder-item">
          <div class="reminder-main">
            <span class="reminder-icon">{{ item.icon }}</span>
            <div class="reminder-detail">
              <input :value="item.title" @change="update(item.id, { title: $event.target.value })" />
              <textarea :value="item.content" @change="update(item.id, { content: $event.target.value })"></textarea>
              <div class="reminder-options">
                <input :value="item.time" type="time" @change="update(item.id, { time: $event.target.value })" />
                <select :value="item.cycle" @change="update(item.id, { cycle: $event.target.value })">
                  <option value="once">一次</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                </select>
              </div>
            </div>
          </div>
          <div class="reminder-actions">
            <label><input :checked="item.enabled" type="checkbox" @change="update(item.id, { enabled: $event.target.checked })" /> 启用</label>
            <button @click="petStore.completeReminder(item.id)">测试</button>
            <button class="danger" @click="petStore.deleteReminder(item.id)">删除</button>
          </div>
        </div>

        <div class="custom-reminder">
          <h4>新增提醒</h4>
          <input v-model="form.title" placeholder="标题" />
          <textarea v-model="form.content" placeholder="内容"></textarea>
          <div class="reminder-options">
            <input v-model="form.time" type="time" />
            <select v-model="form.cycle">
              <option value="once">一次</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </div>
          <button class="add-btn" @click="addReminder">添加提醒</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { usePetStore } from '../stores/petStore'

defineEmits(['close'])

const petStore = usePetStore()
const form = reactive({
  title: '',
  content: '',
  time: '09:00',
  cycle: 'daily'
})

function update(id, patch) {
  petStore.updateReminder(id, patch)
}

function addReminder() {
  if (!form.title.trim()) return
  petStore.addReminder({ ...form })
  form.title = ''
  form.content = ''
  form.time = '09:00'
  form.cycle = 'daily'
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

.reminder-panel {
  width: 340px;
  max-height: 520px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 1px solid rgba(255, 182, 193, 0.3);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.14);
  overflow: hidden;
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

.close-btn,
button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.close-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
}

.panel-body {
  max-height: 462px;
  overflow: auto;
  padding: 14px;
}

.reminder-item,
.custom-reminder {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.reminder-main {
  display: flex;
  gap: 10px;
}

.reminder-icon {
  font-size: 20px;
}

.reminder-detail {
  flex: 1;
}

input,
textarea,
select {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid rgba(255, 182, 193, 0.32);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.82);
  color: #4a4a6a;
  font-size: 12px;
}

textarea {
  min-height: 46px;
  margin-top: 6px;
  resize: vertical;
}

.reminder-options {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.reminder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.reminder-actions button,
.add-btn {
  padding: 7px 10px;
  background: rgba(255, 182, 193, 0.2);
  color: #4a4a6a;
}

.reminder-actions .danger {
  color: #e74c3c;
  background: rgba(255, 100, 100, 0.12);
}

.custom-reminder h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4a4a6a;
}

.add-btn {
  width: 100%;
  margin-top: 8px;
  color: #fff;
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
}
</style>
