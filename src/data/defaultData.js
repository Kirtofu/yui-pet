// 应用默认数据。所有持久化数据都从这里合并，避免配置损坏导致白屏。
export const APP_DATA_VERSION = 2

export const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_meet', title: '第一次见面', desc: '第一次启动桌宠', unlocked: false, unlockedAt: null },
  { id: 'streak_3', title: '连续陪伴 3 天', desc: '连续打开桌宠 3 天', unlocked: false, unlockedAt: null },
  { id: 'pomodoro_5', title: '番茄达人', desc: '完成 5 次番茄钟', unlocked: false, unlockedAt: null },
  { id: 'headpat_10', title: '摸摸头', desc: '摸头 10 次', unlocked: false, unlockedAt: null },
  { id: 'late_study', title: '深夜还在学习', desc: '深夜仍在专注或聊天', unlocked: false, unlockedAt: null },
  { id: 'mood_100', title: '满分好感', desc: '好感度达到 100', unlocked: false, unlockedAt: null }
]

export const DEFAULT_REMINDERS = [
  { id: 'water', icon: '💧', title: '喝水', content: '该喝水啦~', time: '10:30', repeat: true, cycle: 'daily', sound: 'reminder', enabled: false, completed: [] },
  { id: 'lunch', icon: '🍱', title: '吃饭', content: '按时吃饭哦~', time: '12:00', repeat: true, cycle: 'daily', sound: 'reminder', enabled: false, completed: [] },
  { id: 'rest', icon: '🧘', title: '休息', content: '站起来活动一下吧~', time: '15:30', repeat: true, cycle: 'daily', sound: 'reminder', enabled: false, completed: [] },
  { id: 'sleep', icon: '🌙', title: '睡觉', content: '夜深了，准备休息吧~', time: '23:00', repeat: true, cycle: 'daily', sound: 'reminder', enabled: false, completed: [] },
  { id: 'exercise', icon: '🏃', title: '运动', content: '动一动，身体会更轻松~', time: '19:30', repeat: true, cycle: 'daily', sound: 'reminder', enabled: false, completed: [] }
]

export const DEFAULT_DATA = {
  version: APP_DATA_VERSION,
  character: {
    id: 'yui',
    name: '呆唯',
    nickname: '你',
    levelNames: ['刚认识的人', '熟悉的朋友', '可靠伙伴', '亲密搭档', '最喜欢的人'],
    companionStartTime: Date.now()
  },
  settings: {
    alwaysOnTop: true,
    opacity: 1,
    autoLaunch: false,
    petSize: 1,
    showShadow: true,
    showInTaskbar: false,
    theme: 'pink',
    bubbleStyle: 'soft',
    fontSize: 14,
    nightMode: false,
    muted: false,
    volume: 0.65,
    ai: {
      apiKey: '',
      baseURL: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      systemPrompt: '你叫呆唯，是用户桌面上的陪伴型桌宠。你的性格天然、元气、温柔，有一点迷糊和贪吃，喜欢音乐、吉他、蛋糕和陪用户学习。回复要短、自然、可爱但不要装腔，不要长篇说教；用户累了就安静陪伴，用户学习时就乖乖鼓励。'
    }
  },
  pet: {
    mood: 70,
    affection: 30,
    emotion: 'normal',
    currentState: 'idle',
    previousState: 'idle',
    facing: 'right',
    lastInteractionDate: '',
    todayInteractions: 0,
    dailyGain: 0,
    clickBurst: []
  },
  stats: {
    totalCompanionMs: 0,
    todayCompanionMs: 0,
    lastActiveDate: '',
    consecutiveDays: 0,
    pomodoroCompleted: 0,
    headpatCount: 0,
    focusTodayMinutes: 0,
    focusHistory: {},
    reminderHistory: []
  },
  study: {
    focusMode: false,
    dailyGoalMinutes: 60,
    tasks: []
  },
  chat: {
    messages: [],
    quickReplies: ['今天要学习', '我有点累', '想吃蛋糕吗', '开始番茄钟']
  },
  reminders: DEFAULT_REMINDERS,
  achievements: DEFAULT_ACHIEVEMENTS,
  characters: [
    {
      id: 'yui',
      name: '呆唯',
      configPath: 'src/characters/yui/character.json',
      enabled: true
    }
  ]
}

export function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA))
}
