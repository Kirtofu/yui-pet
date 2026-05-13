<template>
  <div class="panel-overlay" @click.self="$emit('close')">
    <div class="shortcuts-panel">
      <div class="panel-header">
        <span class="panel-title">🎯 快捷动作</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <section class="setting-section">
          <label class="switch-row">
            <span>启用对话驱动操作</span>
            <input type="checkbox" :checked="petStore.actionsConfig.enabled" @change="toggleEnabled($event)" />
          </label>
          <label class="switch-row">
            <span>执行前确认</span>
            <select :value="petStore.actionsConfig.confirmPolicy" @change="changePolicy($event)">
              <option value="never">从不（直接执行）</option>
              <option value="risky">仅风险动作（推荐）</option>
              <option value="always">总是确认</option>
            </select>
          </label>
          <p class="hint">在聊天里提出明确操作需求时，桌宠会尝试触发对应快捷方式。AI 也会基于此列表智能调用。</p>
        </section>

        <section class="setting-section">
          <div class="section-header">
            <h4>我的快捷方式 ({{ shortcuts.length }})</h4>
            <button class="primary-btn small" @click="startAdd">+ 新增</button>
          </div>

          <div v-if="!shortcuts.length" class="empty">还没有快捷方式，点击右上角新增。</div>

          <div v-for="sc in shortcuts" :key="sc.id" class="shortcut-item">
            <template v-if="editingId === sc.id">
              <div class="edit-grid">
                <input v-model="editForm.icon" class="text-input emoji" maxlength="2" placeholder="🎯" />
                <input v-model="editForm.label" class="text-input" placeholder="名字（如 LeetCode）" />
                <select v-model="editForm.type" class="text-input">
                  <option value="open_url">打开网页</option>
                  <option value="search_web">网页搜索</option>
                  <option value="open_app">启动程序</option>
                  <option value="open_path">打开文件/文件夹</option>
                </select>
                <input v-model="editForm.keywords" class="text-input" placeholder="触发关键词（逗号分隔）" />
                <input v-if="editForm.type === 'open_url'" v-model="editForm.target" class="text-input" placeholder="https://example.com" />
                <input v-else-if="editForm.type === 'search_web'" v-model="editForm.target" class="text-input" placeholder="默认搜索词（可空）" />
                <input v-else-if="editForm.type === 'open_app'" v-model="editForm.command" class="text-input" placeholder="例如 calc.exe 或 D:\\Program\\app.exe" />
                <input v-else-if="editForm.type === 'open_path'" v-model="editForm.target" class="text-input" placeholder="例如 D:\\项目 或 C:\\Users" />
                <select v-if="editForm.type === 'search_web'" v-model="editForm.engine" class="text-input">
                  <option value="bing">Bing</option>
                  <option value="google">Google</option>
                  <option value="baidu">百度</option>
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="zhihu">知乎</option>
                </select>
              </div>
              <div class="row-buttons">
                <button class="primary-btn" @click="saveEdit(sc)">保存</button>
                <button class="ghost-btn" @click="editingId = null">取消</button>
              </div>
            </template>
            <template v-else>
              <div class="shortcut-main">
                <span class="shortcut-icon">{{ sc.icon || '✨' }}</span>
                <div class="shortcut-info">
                  <div class="shortcut-label">{{ sc.label || sc.id }} <span class="shortcut-type">· {{ typeLabel(sc.type) }}</span></div>
                  <div class="shortcut-target">{{ describeShortcut(sc) }}</div>
                  <div class="shortcut-keywords">关键词：{{ (sc.keywords || []).join('、') || '（无）' }}</div>
                </div>
              </div>
              <div class="shortcut-buttons">
                <button class="ghost-btn small" @click="testShortcut(sc)">测试</button>
                <button class="ghost-btn small" @click="startEdit(sc)">编辑</button>
                <button class="ghost-btn small danger" @click="removeShortcut(sc)">删除</button>
              </div>
            </template>
          </div>

          <div v-if="adding" class="shortcut-item adding">
            <div class="edit-grid">
              <input v-model="newForm.icon" class="text-input emoji" maxlength="2" placeholder="🎯" />
              <input v-model="newForm.label" class="text-input" placeholder="名字" />
              <select v-model="newForm.type" class="text-input">
                <option value="open_url">打开网页</option>
                <option value="search_web">网页搜索</option>
                <option value="open_app">启动程序</option>
                <option value="open_path">打开文件/文件夹</option>
              </select>
              <input v-model="newForm.keywords" class="text-input" placeholder="触发关键词（逗号分隔）" />
              <input v-if="newForm.type === 'open_url'" v-model="newForm.target" class="text-input" placeholder="https://example.com" />
              <input v-else-if="newForm.type === 'open_app'" v-model="newForm.command" class="text-input" placeholder="例如 calc.exe" />
              <input v-else-if="newForm.type === 'open_path'" v-model="newForm.target" class="text-input" placeholder="例如 D:\\项目" />
              <input v-else-if="newForm.type === 'search_web'" v-model="newForm.target" class="text-input" placeholder="默认搜索词（可空）" />
              <select v-if="newForm.type === 'search_web'" v-model="newForm.engine" class="text-input">
                <option value="bing">Bing</option>
                <option value="google">Google</option>
                <option value="baidu">百度</option>
              </select>
            </div>
            <div class="row-buttons">
              <button class="primary-btn" @click="saveNew">添加</button>
              <button class="ghost-btn" @click="adding = false">取消</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { usePetStore } from '../stores/petStore'
import { executeAction } from '../utils/actionRegistry'

defineEmits(['close'])

const petStore = usePetStore()
const shortcuts = computed(() => petStore.actionShortcuts)

const editingId = ref(null)
const editForm = reactive({})
const adding = ref(false)
const newForm = reactive(emptyForm())

function emptyForm() {
  return { icon: '✨', label: '', type: 'open_url', keywords: '', target: '', command: '', engine: 'bing' }
}

function typeLabel(type) {
  return { open_url: '网页', open_app: '程序', open_path: '路径', search_web: '搜索' }[type] || type
}

function describeShortcut(sc) {
  if (sc.type === 'open_url') return sc.target
  if (sc.type === 'open_app') return (sc.params && sc.params.command) || sc.target
  if (sc.type === 'open_path') return sc.target
  if (sc.type === 'search_web') return `${sc.engine || 'bing'} · ${sc.target || '由用户输入'}`
  return ''
}

function startEdit(sc) {
  editingId.value = sc.id
  editForm.icon = sc.icon || '✨'
  editForm.label = sc.label || ''
  editForm.type = sc.type
  editForm.keywords = (sc.keywords || []).join(', ')
  editForm.target = sc.target || ''
  editForm.command = (sc.params && sc.params.command) || ''
  editForm.engine = sc.engine || 'bing'
}

function saveEdit(sc) {
  const patch = {
    icon: editForm.icon,
    label: editForm.label,
    type: editForm.type,
    keywords: editForm.keywords,
    target: editForm.target,
    engine: editForm.engine
  }
  if (editForm.type === 'open_app') {
    patch.params = { command: editForm.command }
    patch.target = editForm.command
  } else {
    patch.params = undefined
  }
  petStore.updateShortcut(sc.id, patch)
  editingId.value = null
}

function startAdd() {
  Object.assign(newForm, emptyForm())
  adding.value = true
}

function saveNew() {
  if (!newForm.label.trim()) return
  const item = {
    icon: newForm.icon,
    label: newForm.label,
    type: newForm.type,
    keywords: newForm.keywords,
    target: newForm.target,
    engine: newForm.engine
  }
  if (newForm.type === 'open_app') {
    item.params = { command: newForm.command }
    item.target = newForm.command
  }
  petStore.addShortcut(item)
  adding.value = false
}

function removeShortcut(sc) {
  if (!confirm(`确定删除"${sc.label || sc.id}"？`)) return
  petStore.deleteShortcut(sc.id)
}

async function testShortcut(sc) {
  const result = await executeAction({ type: sc.type, target: sc.target, params: sc.params, engine: sc.engine })
  if (result && result.ok) {
    petStore.showSpeech(`已尝试执行 ${sc.label}~`, 2500, 'settings')
  } else {
    petStore.showSpeech(`执行失败：${(result && result.message) || '未知错误'}`, 3500, 'settings')
  }
}

function toggleEnabled(event) {
  petStore.setActionsEnabled(event.target.checked)
}

function changePolicy(event) {
  petStore.setActionsConfirmPolicy(event.target.value)
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
  box-sizing: border-box;
  padding: 12px;
}

.shortcuts-panel {
  width: min(340px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 1px solid rgba(255, 182, 193, 0.3);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  animation: panel-slide-in 0.25s ease;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 182, 193, 0.16);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(16px);
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
  cursor: pointer;
  flex-shrink: 0;
}

.panel-body {
  padding: 14px;
  overflow: auto;
  flex: 1;
}

.setting-section {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.setting-section h4 {
  margin: 0;
  font-size: 13px;
  color: #4a4a6a;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0;
  font-size: 13px;
  color: #555;
}

.switch-row select {
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #999;
}

.empty {
  padding: 16px 8px;
  text-align: center;
  color: #aaa;
  font-size: 12px;
}

.shortcut-item {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(255, 250, 252, 0.7);
  border: 1px solid rgba(255, 182, 193, 0.18);
}

.shortcut-item.adding {
  background: rgba(255, 240, 246, 0.85);
}

.shortcut-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.shortcut-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.shortcut-info {
  flex: 1;
  min-width: 0;
}

.shortcut-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a4a6a;
}

.shortcut-type {
  font-size: 11px;
  color: #ff8fab;
  font-weight: normal;
}

.shortcut-target {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  word-break: break-all;
}

.shortcut-keywords {
  font-size: 10px;
  color: #bbb;
  margin-top: 2px;
}

.shortcut-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  justify-content: flex-end;
}

.edit-grid {
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 6px;
}

.edit-grid .text-input {
  grid-column: span 2;
}

.edit-grid .text-input.emoji {
  grid-column: span 1;
  text-align: center;
}

.edit-grid .text-input.emoji + .text-input {
  grid-column: span 1;
}

.row-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.text-input {
  border: 1px solid rgba(255, 182, 193, 0.35);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
  color: #4a4a6a;
}

.text-input:focus {
  border-color: rgba(255, 105, 180, 0.5);
}

.primary-btn,
.ghost-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 600;
}

.primary-btn.small,
.ghost-btn.small {
  padding: 4px 10px;
  font-size: 11px;
}

.primary-btn {
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
}

.ghost-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #777;
}

.ghost-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.ghost-btn.danger {
  color: #e74c3c;
}

.ghost-btn.danger:hover {
  background: rgba(231, 76, 60, 0.1);
}

@keyframes panel-slide-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
