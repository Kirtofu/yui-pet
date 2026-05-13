<template>
  <div class="chat-panel-overlay" @click.self="$emit('close')">
    <div class="chat-panel">
      <!-- 标题栏 -->
      <div class="chat-header">
        <span class="chat-title">💬 和{{ petStore.characterName }}聊天</span>
        <button class="header-btn" @click="$emit('open-shortcuts')" title="快捷动作">🎯</button>
        <button class="clear-btn" @click="clearMessages">清空</button>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message"
          :class="msg.role"
        >
          <div class="message-avatar">
            {{ msg.role === 'pet' ? '🐾' : '👤' }}
          </div>
          <div class="message-bubble">
            <p v-if="msg.text">{{ msg.text }}</p>

            <!-- 动作卡片：待确认 / 执行中 / 已完成 / 失败 -->
            <div v-if="msg.actions && msg.actions.length" class="action-list">
              <div
                v-for="(act, idx) in msg.actions"
                :key="idx"
                class="action-card"
                :class="`status-${act.status || 'pending'}`"
              >
                <div class="action-card-main">
                  <span class="action-card-icon">{{ act.icon || '✨' }}</span>
                  <div class="action-card-text">
                    <div class="action-card-title">{{ act.label || '执行动作' }}</div>
                    <div class="action-card-desc">{{ describeAction(act) }}</div>
                  </div>
                </div>
                <div v-if="act.status === 'pending'" class="action-card-buttons">
                  <button class="action-btn primary" @click="confirmAction(msg, idx)">执行</button>
                  <button class="action-btn ghost" @click="cancelAction(msg, idx)">取消</button>
                </div>
                <div v-else-if="act.status === 'running'" class="action-card-status running">执行中...</div>
                <div v-else-if="act.status === 'done'" class="action-card-status done">✓ 已为你完成</div>
                <div v-else-if="act.status === 'failed'" class="action-card-status failed">⚠ {{ act.message || '执行失败' }}</div>
                <div v-else-if="act.status === 'cancelled'" class="action-card-status cancelled">已取消</div>
              </div>
            </div>

            <span class="message-time">{{ msg.time }}</span>
          </div>
        </div>
      </div>

      <div class="quick-replies">
        <button v-for="reply in petStore.data.chat.quickReplies" :key="reply" @click="sendQuick(reply)">
          {{ reply }}
        </button>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <input
          v-model="inputText"
          class="chat-input"
          placeholder="说点什么吧... 比如「帮我打开 leetcode」"
          @keydown.enter="sendMessage"
          maxlength="200"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted } from 'vue'
import { usePetStore } from '../stores/petStore'
import { getAIReply } from '../utils/ai'
import {
  matchIntent,
  parseActionMarkers,
  executeAction,
  needsConfirmation
} from '../utils/actionRegistry'

defineEmits(['close', 'open-shortcuts'])

const petStore = usePetStore()
const inputText = ref('')
const messagesRef = ref(null)

const messages = computed(() => petStore.chatMessages)

function formatNow() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function describeAction(act) {
  if (!act || !act.action) return ''
  const a = act.action
  if (a.type === 'open_url') return a.target
  if (a.type === 'search_web') return `在 ${a.engine || 'bing'} 搜索"${a.target}"`
  if (a.type === 'open_app') return `启动 ${(a.params && a.params.command) || a.target}`
  if (a.type === 'open_path') return `打开 ${a.target}`
  return ''
}

function chooseReply(action, sourceLabel) {
  const label = sourceLabel || ''
  const replies = {
    open_url: [`好嘞~ 我这就帮你打开${label}。`, `嗯嗯，${label}马上来！`, `诶嘿，已经在打开${label}啦。`],
    search_web: [`好的~ 我帮你搜一下${label}。`, `嗯嗯，马上搜${label}。`],
    open_app: [`好~ 我帮你启动${label}。`, `${label}启动中，稍等下哦。`],
    open_path: [`收到，正在为你打开${label}。`]
  }
  const arr = replies[action.type] || ['好的，我来帮你~']
  return arr[Math.floor(Math.random() * arr.length)]
}

function failureReply(label) {
  return label
    ? `呜呜，${label}没能打开，可能是路径不对或者权限不够。`
    : '呜呜，刚才那个操作我没能完成，可能配置不太对。'
}

async function runAction(message, index) {
  const act = message.actions[index]
  if (!act || act.status !== 'pending') return
  act.status = 'running'
  petStore.updateChatMessage(message.id, { actions: [...message.actions] })

  const result = await executeAction(act.action)

  if (result && result.ok) {
    act.status = 'done'
    act.message = result.message || ''
  } else {
    act.status = 'failed'
    act.message = (result && result.message) || '执行失败'
    // 给用户一个安慰回复
    petStore.addChatMessage('pet', failureReply(act.label))
  }
  petStore.updateChatMessage(message.id, { actions: [...message.actions] })
  await nextTick()
  scrollToBottom()
}

function confirmAction(message, idx) {
  runAction(message, idx)
}

function cancelAction(message, idx) {
  const act = message.actions[idx]
  if (!act) return
  act.status = 'cancelled'
  petStore.updateChatMessage(message.id, { actions: [...message.actions] })
}

/**
 * 把一组带 status='pending' 的动作附加到一条桌宠消息上，
 * 然后根据 confirmPolicy 决定是直接执行还是等用户点确认。
 */
async function attachAndMaybeRun(petMessage, actions) {
  if (!actions || !actions.length) return
  const policy = petStore.actionsConfig.confirmPolicy || 'risky'
  const decorated = actions.map(item => ({
    label: item.label,
    icon: item.icon,
    action: item.action,
    status: needsConfirmation(item.action, policy) ? 'pending' : 'pending'
  }))
  petStore.updateChatMessage(petMessage.id, { actions: decorated })

  // 对于不需要确认的动作，自动触发
  for (let i = 0; i < decorated.length; i++) {
    if (!needsConfirmation(decorated[i].action, policy)) {
      // 取最新的 message 引用
      const fresh = petStore.chatMessages.find(m => m.id === petMessage.id)
      if (fresh) await runAction(fresh, i)
    }
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return

  petStore.addChatMessage('user', text)
  inputText.value = ''
  petStore.addMood(2)
  petStore.addAffection(1, 'chat')
  await nextTick()
  scrollToBottom()

  const actionsEnabled = petStore.actionsConfig.enabled !== false

  // 第一层：本地意图匹配（毫秒级，无 API 调用）
  if (actionsEnabled) {
    const intent = matchIntent(text, petStore.actionShortcuts)
    if (intent) {
      const reply = chooseReply(intent.action, intent.label)
      const petMsg = petStore.addChatMessage('pet', reply)
      await attachAndMaybeRun(petMsg, [intent])
      await nextTick()
      scrollToBottom()
      return
    }
  }

  // 第二层：调用 AI（提示中已注入动作能力说明，AI 可在回复中嵌入标记）
  setTimeout(async () => {
    const shortcutsForAI = actionsEnabled ? petStore.actionShortcuts : []
    const raw = await getAIReply(text, petStore.data.settings.ai, shortcutsForAI)
    const { text: clean, actions } = actionsEnabled
      ? parseActionMarkers(raw, petStore.actionShortcuts)
      : { text: raw, actions: [] }

    const visibleText = clean || (actions.length ? '好嘞~' : raw)
    const petMsg = petStore.addChatMessage('pet', visibleText)
    if (actions.length) await attachAndMaybeRun(petMsg, actions)

    await nextTick()
    scrollToBottom()
  }, 300)
}

function sendQuick(text) {
  inputText.value = text
  sendMessage()
}

function clearMessages() {
  petStore.clearChatMessages()
  petStore.addChatMessage('pet', '聊天记录清空啦，我们重新开始。')
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

onMounted(() => {
  if (!petStore.chatMessages.length) {
    petStore.addChatMessage('pet', `嘿嘿~ 你来找我玩啦！可以试试说「帮我打开 leetcode」让我帮你操作。`)
  }
  scrollToBottom()
})
</script>

<style scoped>
.chat-panel-overlay {
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

.chat-panel {
  width: 320px;
  height: 440px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 182, 193, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: panel-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.3), rgba(255, 218, 233, 0.3));
  border-bottom: 1px solid rgba(255, 182, 193, 0.2);
}

.header-btn {
  margin-left: auto;
  margin-right: 6px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 182, 193, 0.25);
}

.clear-btn {
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  color: #999;
  font-size: 11px;
  cursor: pointer;
}

.chat-title {
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

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 182, 193, 0.4);
  border-radius: 2px;
}

.message {
  display: flex;
  gap: 8px;
  animation: msg-in 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 182, 193, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: rgba(100, 149, 237, 0.15);
}

.message-bubble {
  max-width: 220px;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #4a4a6a;
  position: relative;
}

.message.pet .message-bubble {
  background: rgba(255, 182, 193, 0.15);
  border: 1px solid rgba(255, 182, 193, 0.2);
  border-top-left-radius: 4px;
}

.message.user .message-bubble {
  background: rgba(100, 149, 237, 0.12);
  border: 1px solid rgba(100, 149, 237, 0.2);
  border-top-right-radius: 4px;
}

.message-bubble p {
  margin: 0;
}

.message-time {
  font-size: 10px;
  color: #bbb;
  margin-top: 4px;
  display: block;
}

/* 动作卡片 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.action-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 182, 193, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  transition: all 0.2s;
}

.action-card.status-done {
  border-color: rgba(120, 200, 130, 0.55);
  background: rgba(232, 250, 234, 0.7);
}

.action-card.status-failed {
  border-color: rgba(231, 76, 60, 0.4);
  background: rgba(255, 230, 226, 0.75);
}

.action-card.status-cancelled {
  opacity: 0.6;
}

.action-card-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-card-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.action-card-text {
  flex: 1;
  min-width: 0;
}

.action-card-title {
  font-size: 12px;
  font-weight: 600;
  color: #4a4a6a;
}

.action-card-desc {
  font-size: 10px;
  color: #999;
  word-break: break-all;
  margin-top: 1px;
}

.action-card-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
}

.action-btn.ghost {
  background: rgba(0, 0, 0, 0.05);
  color: #888;
}

.action-btn.ghost:hover {
  background: rgba(0, 0, 0, 0.08);
}

.action-card-status {
  margin-top: 6px;
  font-size: 11px;
  color: #888;
}

.action-card-status.done {
  color: #4caf50;
}

.action-card-status.failed {
  color: #e74c3c;
}

.action-card-status.running {
  color: #ff8fab;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.5);
}

.quick-replies {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 12px 0;
}

.quick-replies button {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 182, 193, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #4a4a6a;
  padding: 5px 9px;
  font-size: 11px;
  transition: all 0.2s;
  cursor: pointer;
}

.quick-replies button:hover,
.clear-btn:hover {
  background: rgba(255, 182, 193, 0.18);
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  background: rgba(255, 255, 255, 0.8);
  color: #4a4a6a;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: rgba(255, 105, 180, 0.5);
}

.chat-input::placeholder {
  color: #ccc;
}

.send-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff8fab, #ff69b4);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@keyframes msg-in {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
