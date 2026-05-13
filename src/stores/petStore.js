// 桌宠统一状态管理：数据、状态机、成就、提醒、聊天和学习任务都从这里维护。
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { cloneDefaultData } from '../data/defaultData'
import { loadAppData, saveAppData, resetAppData, exportAppData, importAppData } from '../utils/storage'
import { pickDialogue } from '../utils/dialogueEngine'
import { canEnterState, getStateDuration } from '../utils/stateMachine'
import { playUiSound } from '../utils/audioManager'

const MAX_DAILY_GAIN = 20
const MAX_CHAT_MESSAGES = 120
const OLD_SIMPLE_PROMPT = '你是一个可爱、温柔、有陪伴感的桌宠，说话简短自然。'
const OLD_QUICK_REPLIES = ['今天要学习', '我有点累', '陪我聊聊', '开始番茄钟']

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function timeText(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getEmotionByMood(mood) {
  if (mood >= 80) return 'happy'
  if (mood >= 50) return 'normal'
  if (mood >= 30) return 'bored'
  if (mood >= 15) return 'sleepy'
  return 'angry'
}

function getAffectionLevel(affection) {
  if (affection >= 100) return 4
  if (affection >= 75) return 3
  if (affection >= 50) return 2
  if (affection >= 25) return 1
  return 0
}

export const usePetStore = defineStore('pet', () => {
  const data = reactive(cloneDefaultData())
  const currentState = ref(data.pet.currentState || 'idle')
  const previousState = ref('idle')
  const showBubble = ref(false)
  const bubbleText = ref('')
  const bubbleScene = ref('idle')
  const behaviorName = ref('原地发呆')
  const lookX = ref(0)
  const lookY = ref(0)
  const isReady = ref(false)

  let bubbleTimer = null
  let stateTimer = null
  let saveTimer = null
  let companionTimer = null

  const characterName = computed({
    get: () => data.character.name,
    set: value => {
      data.character.name = value || '呆唯'
      scheduleSave()
    }
  })
  const companionStartTime = computed(() => data.character.companionStartTime)
  const mood = computed({
    get: () => data.pet.mood,
    set: value => {
      data.pet.mood = Math.max(0, Math.min(100, Number(value) || 0))
      scheduleSave()
    }
  })
  const affection = computed(() => data.pet.affection)
  const affectionLevel = computed(() => getAffectionLevel(data.pet.affection))
  const affectionLevelName = computed(() => data.character.levelNames[affectionLevel.value] || '伙伴')
  const emotion = computed(() => getEmotionByMood(data.pet.mood))
  const todayInteractions = computed(() => data.pet.todayInteractions)
  const alwaysOnTop = computed({
    get: () => data.settings.alwaysOnTop,
    set: value => {
      data.settings.alwaysOnTop = Boolean(value)
      scheduleSave()
    }
  })
  const opacity = computed({
    get: () => data.settings.opacity,
    set: value => {
      data.settings.opacity = Math.max(0.3, Math.min(1, Number(value) || 1))
      scheduleSave()
    }
  })
  const autoLaunch = computed({
    get: () => data.settings.autoLaunch,
    set: value => {
      data.settings.autoLaunch = Boolean(value)
      scheduleSave()
    }
  })
  const petSize = computed({
    get: () => data.settings.petSize,
    set: value => {
      data.settings.petSize = Math.max(0.5, Math.min(2, Number(value) || 1))
      scheduleSave()
    }
  })
  const focusMode = computed(() => data.study.focusMode)
  const facing = computed(() => data.pet.facing || 'right')
  const chatMessages = computed(() => data.chat.messages)
  const tasks = computed(() => data.study.tasks)
  const reminders = computed(() => data.reminders)
  const achievements = computed(() => data.achievements)
  const actionsConfig = computed(() => data.settings.actions || { enabled: true, confirmPolicy: 'risky', shortcuts: [] })
  const actionShortcuts = computed(() => actionsConfig.value.shortcuts || [])

  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveState(), 400)
  }

  async function saveState() {
    data.pet.currentState = currentState.value
    data.pet.previousState = previousState.value
    data.pet.emotion = emotion.value
    await saveAppData(JSON.parse(JSON.stringify(data)))
  }

  function applyLoadedData(loaded) {
    Object.keys(data).forEach(key => {
      delete data[key]
    })
    Object.assign(data, loaded)
    const defaults = cloneDefaultData()
    if (data.settings.ai.systemPrompt === OLD_SIMPLE_PROMPT) {
      data.settings.ai.systemPrompt = defaults.settings.ai.systemPrompt
    }
    if (JSON.stringify(data.chat.quickReplies) === JSON.stringify(OLD_QUICK_REPLIES)) {
      data.chat.quickReplies = defaults.chat.quickReplies
    }
    currentState.value = data.pet.currentState || 'idle'
    previousState.value = data.pet.previousState || 'idle'
  }

  async function init() {
    const loaded = await loadAppData()
    applyLoadedData(loaded)
    rolloverDailyData()
    unlockAchievement('first_meet')
    startCompanionClock()
    isReady.value = true
    scheduleSave()
  }

  function rolloverDailyData() {
    const today = todayKey()
    if (data.pet.lastInteractionDate !== today) {
      data.pet.lastInteractionDate = today
      data.pet.todayInteractions = 0
      data.pet.dailyGain = 0
      data.stats.todayCompanionMs = 0
    }
    if (data.stats.lastActiveDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      data.stats.consecutiveDays = data.stats.lastActiveDate === todayKey(yesterday)
        ? data.stats.consecutiveDays + 1
        : 1
      data.stats.lastActiveDate = today
      if (data.stats.consecutiveDays >= 3) unlockAchievement('streak_3')
    }
  }

  function startCompanionClock() {
    clearInterval(companionTimer)
    companionTimer = setInterval(() => {
      data.stats.totalCompanionMs += 60 * 1000
      data.stats.todayCompanionMs += 60 * 1000
      scheduleSave()
    }, 60 * 1000)
  }

  function setState(state, options = {}) {
    if (!canEnterState(currentState.value, state, options.force)) return false
    clearTimeout(stateTimer)
    previousState.value = currentState.value
    currentState.value = state
    data.pet.currentState = state
    data.pet.previousState = previousState.value

    const duration = options.duration ?? getStateDuration(state)
    if (duration > 0) {
      stateTimer = setTimeout(() => {
        if (currentState.value === state) setState(options.nextState || 'idle', { force: true })
      }, duration)
    }
    return true
  }

  function restoreState() {
    setState(previousState.value || 'idle', { force: true })
  }

  function showSpeech(text, duration = 4000, scene = 'idle') {
    bubbleText.value = text
    bubbleScene.value = scene
    showBubble.value = true
    playUiSound(scene === 'reminder' ? 'popup' : 'click', data.settings)
    clearTimeout(bubbleTimer)
    bubbleTimer = setTimeout(() => {
      showBubble.value = false
    }, duration)
  }

  function speakScene(scene, duration = 4000) {
    const text = pickDialogue(scene, {
      affection: data.pet.affection,
      emotion: emotion.value
    })
    showSpeech(text, duration, scene)
    return text
  }

  function addMood(value) {
    data.pet.mood = Math.max(0, Math.min(100, data.pet.mood + value))
    if (data.pet.mood >= 100) unlockAchievement('mood_100')
    scheduleSave()
  }

  function addAffection(value, reason = 'interact') {
    if (data.pet.dailyGain >= MAX_DAILY_GAIN && value > 0) return false
    const gain = Math.min(value, MAX_DAILY_GAIN - data.pet.dailyGain)
    data.pet.affection = Math.max(0, Math.min(100, data.pet.affection + gain))
    data.pet.dailyGain += Math.max(0, gain)
    if (data.pet.affection >= 100) unlockAchievement('mood_100')
    scheduleSave()
    return true
  }

  function onInteract(type) {
    rolloverDailyData()
    data.pet.todayInteractions++

    if (type === 'click') {
      const now = Date.now()
      data.pet.clickBurst = data.pet.clickBurst.filter(ts => now - ts < 4500)
      data.pet.clickBurst.push(now)
      if (emotion.value === 'angry' || data.pet.clickBurst.length >= 6) {
        setState('angry', { force: true })
        showSpeech(pickDialogue('angry', { affection: data.pet.affection }), 3500, 'angry')
        addMood(-3)
      } else {
        setState('click')
        showSpeech(pickDialogue('click', { affection: data.pet.affection }), 3200, 'click')
        addMood(1)
        addAffection(1, 'click')
      }
      playUiSound('click', data.settings)
    } else if (type === 'dblclick') {
      setState('happy', { force: true })
      showSpeech('有什么想和我说的吗？', 2500, 'happy')
      addMood(2)
      addAffection(1, 'dblclick')
    }
    scheduleSave()
  }

  function onHeadpat() {
    setState('headpat', { force: true })
    data.stats.headpatCount++
    addMood(4)
    addAffection(3, 'headpat')
    if (data.stats.headpatCount >= 10) unlockAchievement('headpat_10')
    showSpeech(pickDialogue('headpat', { affection: data.pet.affection }), 3600, 'headpat')
    playUiSound('headpat', data.settings)
    scheduleSave()
  }

  function onStartled() {
    if (setState('startled')) {
      showSpeech('哇啊，吓我一跳。', 1800, 'startled')
    }
  }

  function decayEmotion() {
    const amount = focusMode.value ? 1 : 2
    addMood(-amount)
    if (emotion.value === 'sleepy') {
      setState('sleep')
    } else if (emotion.value === 'bored' && Math.random() < 0.35) {
      speakScene('bored', 4200)
    }
  }

  function timeGreeting() {
    const hour = new Date().getHours()
    if (hour >= 23 || hour < 5) unlockAchievement('late_study')
    speakScene(hour >= 23 || hour < 6 ? 'night' : 'greeting', 5000)
  }

  function randomMonologue() {
    if (focusMode.value) return
    speakScene(emotion.value === 'bored' ? 'bored' : 'idle', 4200)
  }

  function onPomodoroComplete(type, minutes = 25) {
    if (type === 'work') {
      data.stats.pomodoroCompleted++
      data.stats.focusTodayMinutes += minutes
      const today = todayKey()
      data.stats.focusHistory[today] = (data.stats.focusHistory[today] || 0) + minutes
      if (data.stats.pomodoroCompleted >= 5) unlockAchievement('pomodoro_5')
    }
    addMood(5)
    addAffection(2, 'pomodoro')
    setState('pomodoro', { force: true })
    speakScene('pomodoro', 5200)
    playUiSound('pomodoro', data.settings)
    scheduleSave()
  }

  function startDrag() {
    setState('drag', { force: true })
    if (Math.random() < 0.35) speakScene('drag', 2500)
  }

  function endDrag() {
    setState('rest', { force: true, duration: 800 })
    addMood(1)
    addAffection(1, 'drag')
  }

  function setCharacterName(name) {
    data.character.name = name || data.character.name
    scheduleSave()
  }

  function setPetSize(size) {
    data.settings.petSize = Math.max(0.5, Math.min(2, size))
    scheduleSave()
  }

  function setSetting(key, value) {
    data.settings[key] = value
    scheduleSave()
  }

  function setFacing(direction) {
    data.pet.facing = direction === 'left' ? 'left' : 'right'
  }

  function setLookDirection(x = 0, y = 0) {
    lookX.value = Math.max(-1, Math.min(1, Number(x) || 0))
    lookY.value = Math.max(-1, Math.min(1, Number(y) || 0))
  }

  function addChatMessage(role, text, extra = null) {
    const message = { id: crypto.randomUUID(), role, text, time: timeText(), ts: Date.now() }
    if (extra && typeof extra === 'object') Object.assign(message, extra)
    data.chat.messages.push(message)
    if (data.chat.messages.length > MAX_CHAT_MESSAGES) {
      data.chat.messages = data.chat.messages.slice(-MAX_CHAT_MESSAGES)
    }
    scheduleSave()
    return message
  }

  function updateChatMessage(id, patch) {
    const item = data.chat.messages.find(msg => msg.id === id)
    if (!item) return
    Object.assign(item, patch)
    scheduleSave()
  }

  function clearChatMessages() {
    data.chat.messages = []
    scheduleSave()
  }

  function addTask(title) {
    const trimmed = String(title || '').trim()
    if (!trimmed) return
    data.study.tasks.push({ id: crypto.randomUUID(), title: trimmed, done: false, createdAt: Date.now(), doneAt: null })
    scheduleSave()
  }

  function updateTask(id, patch) {
    const task = data.study.tasks.find(item => item.id === id)
    if (!task) return
    const wasDone = task.done
    Object.assign(task, patch)
    if (!wasDone && task.done) {
      task.doneAt = Date.now()
      addAffection(1, 'task')
      showSpeech(pickDialogue('task', { affection: data.pet.affection }), 3500, 'task')
    }
    scheduleSave()
  }

  function deleteTask(id) {
    data.study.tasks = data.study.tasks.filter(item => item.id !== id)
    scheduleSave()
  }

  function addReminder(reminder) {
    data.reminders.push({
      id: crypto.randomUUID(),
      icon: reminder.icon || '⏰',
      title: reminder.title || '提醒',
      content: reminder.content || '',
      time: reminder.time || '09:00',
      repeat: Boolean(reminder.repeat),
      cycle: reminder.cycle || 'daily',
      sound: reminder.sound || 'reminder',
      enabled: reminder.enabled ?? true,
      completed: []
    })
    scheduleSave()
  }

  function updateReminder(id, patch) {
    const item = data.reminders.find(reminder => reminder.id === id)
    if (!item) return
    Object.assign(item, patch)
    scheduleSave()
  }

  function deleteReminder(id) {
    data.reminders = data.reminders.filter(item => item.id !== id)
    scheduleSave()
  }

  function completeReminder(id) {
    const item = data.reminders.find(reminder => reminder.id === id)
    if (!item) return
    item.completed.push(Date.now())
    data.stats.reminderHistory.push({ id, title: item.title, ts: Date.now() })
    setState('remind', { force: true })
    showSpeech(item.content || pickDialogue('reminder'), 5000, 'reminder')
    playUiSound(item.sound || 'reminder', data.settings)
    scheduleSave()
  }

  function unlockAchievement(id) {
    const item = data.achievements.find(achievement => achievement.id === id)
    if (!item || item.unlocked) return
    item.unlocked = true
    item.unlockedAt = Date.now()
    if (isReady.value) showSpeech(`成就解锁：${item.title}`, 3800, 'achievement')
  }

  // ---------- 动作快捷方式（用于"对话驱动操作系统"） ----------
  function ensureActionsSettings() {
    if (!data.settings.actions) {
      data.settings.actions = { enabled: true, confirmPolicy: 'risky', shortcuts: [] }
    }
    if (!Array.isArray(data.settings.actions.shortcuts)) {
      data.settings.actions.shortcuts = []
    }
    return data.settings.actions
  }

  function addShortcut(shortcut) {
    const cfg = ensureActionsSettings()
    const item = {
      id: shortcut.id || ('sc-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36))),
      icon: shortcut.icon || '✨',
      label: String(shortcut.label || shortcut.id || '快捷方式').trim(),
      keywords: Array.isArray(shortcut.keywords)
        ? shortcut.keywords.map(k => String(k).trim()).filter(Boolean)
        : String(shortcut.keywords || '').split(/[,，\s]+/).map(s => s.trim()).filter(Boolean),
      type: shortcut.type || 'open_url',
      target: shortcut.target || '',
      params: shortcut.params || undefined,
      engine: shortcut.engine || undefined
    }
    cfg.shortcuts.push(item)
    scheduleSave()
    return item
  }

  function updateShortcut(id, patch) {
    const cfg = ensureActionsSettings()
    const item = cfg.shortcuts.find(s => s.id === id)
    if (!item) return
    if (patch.keywords !== undefined && !Array.isArray(patch.keywords)) {
      patch = {
        ...patch,
        keywords: String(patch.keywords).split(/[,，\s]+/).map(s => s.trim()).filter(Boolean)
      }
    }
    Object.assign(item, patch)
    scheduleSave()
  }

  function deleteShortcut(id) {
    const cfg = ensureActionsSettings()
    cfg.shortcuts = cfg.shortcuts.filter(s => s.id !== id)
    scheduleSave()
  }

  function setActionsEnabled(value) {
    ensureActionsSettings().enabled = Boolean(value)
    scheduleSave()
  }

  function setActionsConfirmPolicy(policy) {
    const allowed = ['always', 'risky', 'never']
    ensureActionsSettings().confirmPolicy = allowed.includes(policy) ? policy : 'risky'
    scheduleSave()
  }

  function getSevenDayFocus() {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const key = todayKey(date)
      return { date: key.slice(5), minutes: data.stats.focusHistory[key] || 0 }
    })
  }

  async function resetData() {
    const defaults = await resetAppData()
    applyLoadedData(defaults)
  }

  function exportData() {
    return exportAppData(JSON.parse(JSON.stringify(data)))
  }

  async function importData(raw) {
    const parsed = importAppData(raw)
    applyLoadedData(parsed)
    await saveState()
  }

  function dispose() {
    clearTimeout(bubbleTimer)
    clearTimeout(stateTimer)
    clearTimeout(saveTimer)
    clearInterval(companionTimer)
  }

  return {
    data,
    isReady,
    characterName,
    companionStartTime,
    mood,
    affection,
    affectionLevel,
    affectionLevelName,
    emotion,
    todayInteractions,
    currentState,
    previousState,
    showBubble,
    bubbleText,
    bubbleScene,
    behaviorName,
    lookX,
    lookY,
    alwaysOnTop,
    opacity,
    autoLaunch,
    petSize,
    focusMode,
    facing,
    chatMessages,
    tasks,
    reminders,
    achievements,
    actionsConfig,
    actionShortcuts,
    init,
    saveState,
    setState,
    restoreState,
    showSpeech,
    speakScene,
    onInteract,
    onHeadpat,
    onStartled,
    addMood,
    addAffection,
    decayEmotion,
    timeGreeting,
    randomMonologue,
    onPomodoroComplete,
    startDrag,
    endDrag,
    setCharacterName,
    setPetSize,
    setSetting,
    setFacing,
    setLookDirection,
    addChatMessage,
    updateChatMessage,
    clearChatMessages,
    addTask,
    updateTask,
    deleteTask,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    unlockAchievement,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    setActionsEnabled,
    setActionsConfirmPolicy,
    getSevenDayFocus,
    resetData,
    exportData,
    importData,
    dispose
  }
})
