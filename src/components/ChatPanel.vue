<template>
  <div class="chat-panel-overlay" @click.self="$emit('close')">
    <div class="chat-panel">
      <!-- 标题栏 -->
      <div class="chat-header">
        <span class="chat-title">💬 和{{ petStore.characterName }}聊天</span>
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
            <p>{{ msg.text }}</p>
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
          placeholder="说点什么吧..."
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

defineEmits(['close'])

const petStore = usePetStore()
const inputText = ref('')
const messagesRef = ref(null)

const messages = computed(() => petStore.chatMessages)

function formatNow() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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

  setTimeout(async () => {
    const reply = await getAIReply(text, petStore.data.settings.ai)
    petStore.addChatMessage('pet', reply)
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
    petStore.addChatMessage('pet', `嘿嘿~ 你来找我玩啦！有什么想和我说的吗？`)
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
  width: 300px;
  height: 420px;
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

.clear-btn {
  margin-left: auto;
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  color: #999;
  font-size: 11px;
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
  max-width: 180px;
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
