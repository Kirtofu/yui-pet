<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="panel-header">
        <span class="panel-title">⚙️ 设置</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <section class="setting-section">
          <h4>外观</h4>
          <label class="setting-row">
            <span>桌宠大小</span>
            <input v-model.number="petStore.data.settings.petSize" type="range" min="0.5" max="2" step="0.1" @input="save" />
            <b>{{ Math.round(petStore.data.settings.petSize * 100) }}%</b>
          </label>
          <label class="setting-row">
            <span>透明度</span>
            <input v-model.number="petStore.data.settings.opacity" type="range" min="0.3" max="1" step="0.05" @input="setOpacity" />
            <b>{{ Math.round(petStore.data.settings.opacity * 100) }}%</b>
          </label>
          <label class="switch-row">
            <span>夜间模式</span>
            <input v-model="petStore.data.settings.nightMode" type="checkbox" @change="save" />
          </label>
          <label class="switch-row">
            <span>显示阴影</span>
            <input v-model="petStore.data.settings.showShadow" type="checkbox" @change="save" />
          </label>
          <label class="switch-row">
            <span>显示在任务栏</span>
            <input v-model="petStore.data.settings.showInTaskbar" type="checkbox" @change="setTaskbar" />
          </label>
        </section>

        <section class="setting-section">
          <h4>音效与语音</h4>
          <label class="switch-row">
            <span>静音</span>
            <input v-model="petStore.data.settings.muted" type="checkbox" @change="save" />
          </label>
          <label class="setting-row">
            <span>音量</span>
            <input v-model.number="petStore.data.settings.volume" type="range" min="0" max="1" step="0.05" @input="save" />
            <b>{{ Math.round(petStore.data.settings.volume * 100) }}%</b>
          </label>
          <p class="hint">语音包接口已预留：台词可绑定 voice 文件；没有语音时只显示气泡。</p>
        </section>

        <section class="setting-section">
          <h4>AI 接口</h4>
          <input v-model="petStore.data.settings.ai.apiKey" class="text-input" type="password" placeholder="API Key（可选）" @change="save" />
          <input v-model="petStore.data.settings.ai.baseURL" class="text-input" placeholder="baseURL" @change="save" />
          <input v-model="petStore.data.settings.ai.model" class="text-input" placeholder="model" @change="save" />
          <textarea v-model="petStore.data.settings.ai.systemPrompt" class="text-area" placeholder="system prompt" @change="save"></textarea>
          <p class="hint">未配置 API 或请求失败时，会自动使用本地关键词回复。</p>
        </section>

        <section class="setting-section">
          <h4>对话驱动操作</h4>
          <label class="switch-row">
            <span>启用</span>
            <input type="checkbox" :checked="petStore.actionsConfig.enabled" @change="setActionsEnabled($event)" />
          </label>
          <label class="switch-row">
            <span>执行前确认</span>
            <select :value="petStore.actionsConfig.confirmPolicy" @change="setPolicy($event)" class="text-input small">
              <option value="never">从不</option>
              <option value="risky">仅风险动作</option>
              <option value="always">总是确认</option>
            </select>
          </label>
          <button class="primary-btn" @click="$emit('open-shortcuts')">管理快捷方式 ({{ petStore.actionShortcuts.length }})</button>
          <p class="hint">开启后，桌宠可以根据聊天内容执行已登记的快捷动作。AI 也会基于此列表智能调用。</p>
        </section>

        <section class="setting-section">
          <h4>数据</h4>
          <div class="button-row">
            <button class="soft-btn" @click="copyExport">导出配置</button>
            <button class="soft-btn danger" @click="resetData">重置数据</button>
          </div>
          <textarea v-model="importText" class="text-area" placeholder="粘贴导出的 JSON 后点击导入"></textarea>
          <button class="primary-btn" @click="importData">导入配置</button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePetStore } from '../stores/petStore'

defineEmits(['close', 'open-shortcuts'])

const petStore = usePetStore()
const importText = ref('')

function save() {
  petStore.saveState()
}

function setActionsEnabled(event) {
  petStore.setActionsEnabled(event.target.checked)
}

function setPolicy(event) {
  petStore.setActionsConfirmPolicy(event.target.value)
}

async function setOpacity() {
  if (window.electronAPI) await window.electronAPI.setOpacity(petStore.data.settings.opacity)
  save()
}

async function setTaskbar() {
  if (window.electronAPI) await window.electronAPI.setShowInTaskbar(petStore.data.settings.showInTaskbar)
  save()
}

async function copyExport() {
  const text = petStore.exportData()
  await navigator.clipboard?.writeText(text)
  petStore.showSpeech('配置已经复制到剪贴板啦。', 2500, 'settings')
}

async function importData() {
  if (!importText.value.trim()) return
  try {
    await petStore.importData(importText.value)
    petStore.showSpeech('配置导入完成。', 2500, 'settings')
    importText.value = ''
  } catch {
    petStore.showSpeech('导入失败，JSON 格式可能不对。', 3000, 'settings')
  }
}

async function resetData() {
  await petStore.resetData()
  petStore.showSpeech('数据已重置。', 2500, 'settings')
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

.settings-panel {
  width: 330px;
  max-height: 520px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 18px;
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  animation: panel-slide-in 0.25s ease;
}

.panel-header,
.button-row,
.setting-row,
.switch-row {
  display: flex;
  align-items: center;
}

.panel-header {
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
  color: #777;
}

.panel-body {
  max-height: 462px;
  overflow: auto;
  padding: 14px;
}

.setting-section {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.setting-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4a4a6a;
}

.setting-row {
  gap: 10px;
  margin: 8px 0;
  font-size: 12px;
  color: #666;
}

.setting-row span {
  width: 70px;
}

.setting-row input {
  flex: 1;
}

.setting-row b {
  min-width: 38px;
  color: #ff69b4;
}

.switch-row {
  justify-content: space-between;
  margin: 8px 0;
  font-size: 13px;
  color: #555;
}

.text-input,
.text-area {
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 182, 193, 0.35);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  color: #4a4a6a;
  font-size: 12px;
}

.text-area {
  min-height: 62px;
  resize: vertical;
}

.button-row {
  gap: 8px;
  margin-bottom: 8px;
}

.soft-btn,
.primary-btn {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.soft-btn {
  background: rgba(255, 182, 193, 0.18);
  color: #4a4a6a;
}

.soft-btn.danger {
  color: #e74c3c;
}

.primary-btn {
  width: 100%;
  margin-top: 8px;
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
  color: #fff;
  font-weight: 700;
}

.soft-btn:hover,
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.2);
}

.hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #999;
}

@keyframes panel-slide-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
