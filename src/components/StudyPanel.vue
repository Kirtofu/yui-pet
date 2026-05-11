<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="study-panel">
      <div class="panel-header">
        <span class="panel-title">📚 学习陪伴</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <section class="summary">
          <label class="switch-row">
            <span>专注模式</span>
            <input v-model="petStore.data.study.focusMode" type="checkbox" @change="save" />
          </label>
          <label class="goal-row">
            <span>今日目标</span>
            <input v-model.number="petStore.data.study.dailyGoalMinutes" type="number" min="10" max="600" @change="save" />
            <b>分钟</b>
          </label>
          <div class="progress">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p>今日专注 {{ petStore.data.stats.focusTodayMinutes }} / {{ petStore.data.study.dailyGoalMinutes }} 分钟</p>
        </section>

        <section>
          <h4>近 7 天专注</h4>
          <div class="bars">
            <div v-for="item in focusDays" :key="item.date" class="bar-item">
              <div class="bar-track"><span :style="{ height: barHeight(item.minutes) + '%' }"></span></div>
              <small>{{ item.date }}</small>
            </div>
          </div>
        </section>

        <section>
          <h4>今日任务</h4>
          <div class="task-input">
            <input v-model="newTask" placeholder="添加一个任务..." @keydown.enter="addTask" />
            <button @click="addTask">添加</button>
          </div>
          <div v-if="!petStore.tasks.length" class="empty">还没有任务，先写一个小目标吧。</div>
          <div v-for="task in petStore.tasks" :key="task.id" class="task-row">
            <input type="checkbox" :checked="task.done" @change="petStore.updateTask(task.id, { done: $event.target.checked })" />
            <input :value="task.title" :class="{ done: task.done }" @change="petStore.updateTask(task.id, { title: $event.target.value })" />
            <button @click="petStore.deleteTask(task.id)">删</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePetStore } from '../stores/petStore'

defineEmits(['close'])

const petStore = usePetStore()
const newTask = ref('')
const focusDays = computed(() => petStore.getSevenDayFocus())
const progress = computed(() => {
  const goal = petStore.data.study.dailyGoalMinutes || 1
  return Math.min(100, Math.round((petStore.data.stats.focusTodayMinutes / goal) * 100))
})

function barHeight(minutes) {
  const max = Math.max(60, ...focusDays.value.map(item => item.minutes))
  return Math.max(4, Math.round((minutes / max) * 100))
}

function addTask() {
  petStore.addTask(newTask.value)
  newTask.value = ''
}

function save() {
  petStore.saveState()
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

.study-panel {
  width: 330px;
  max-height: 520px;
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

.close-btn,
.task-input button,
.task-row button {
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

section {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4a4a6a;
}

.switch-row,
.goal-row,
.task-row,
.task-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-row,
.goal-row {
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
}

.goal-row input {
  width: 72px;
}

.progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffb6c1, #ff69b4);
}

.summary p,
.empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: #888;
}

.bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 108px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #999;
}

.bar-track {
  width: 18px;
  height: 76px;
  border-radius: 9px;
  background: rgba(255, 182, 193, 0.18);
  display: flex;
  align-items: end;
  overflow: hidden;
}

.bar-track span {
  width: 100%;
  border-radius: inherit;
  background: linear-gradient(180deg, #ff8fab, #ff69b4);
}

.task-input input,
.task-row input[type='text'],
.task-row input:not([type]) {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid rgba(255, 182, 193, 0.35);
  border-radius: 10px;
  color: #4a4a6a;
}

.task-input button {
  padding: 8px 10px;
  background: #ff8fab;
  color: #fff;
}

.task-row {
  margin-top: 8px;
}

.task-row input.done {
  text-decoration: line-through;
  color: #aaa;
}

.task-row button {
  padding: 7px 8px;
  background: rgba(255, 100, 100, 0.12);
  color: #e74c3c;
}
</style>
