import { dialogueCatalog, getTimeBucket } from '../data/dialogueCatalog'

const lastShown = new Map()

function getAffectionLevel(affection = 0) {
  if (affection >= 100) return 4
  if (affection >= 75) return 3
  if (affection >= 50) return 2
  if (affection >= 25) return 1
  return 0
}

function isAvailable(entry, context) {
  const now = Date.now()
  const key = `${context.scene}:${entry.text}`
  const last = lastShown.get(key) || 0
  const level = getAffectionLevel(context.affection)

  if (entry.cooldown && now - last < entry.cooldown) return false
  if (entry.minLevel !== undefined && level < entry.minLevel) return false
  if (entry.maxLevel !== undefined && level > entry.maxLevel) return false
  if (entry.time && !entry.time.includes(context.timeBucket)) return false
  return true
}

function weightedPick(entries) {
  const total = entries.reduce((sum, item) => sum + (item.weight || 1), 0)
  let roll = Math.random() * total
  for (const item of entries) {
    roll -= item.weight || 1
    if (roll <= 0) return item
  }
  return entries[0]
}

export function pickDialogue(scene, options = {}) {
  const context = {
    scene,
    affection: options.affection || 0,
    emotion: options.emotion || 'normal',
    timeBucket: options.timeBucket || getTimeBucket()
  }
  const list = dialogueCatalog[scene] || dialogueCatalog.idle
  const available = list.filter(item => isAvailable(item, context))
  const picked = weightedPick(available.length ? available : list)
  lastShown.set(`${scene}:${picked.text}`, Date.now())
  return picked.text
}

export function pickKeywordReply(input) {
  const text = String(input || '').toLowerCase()
  if (text.includes('名字') || text.includes('你是谁') || text.includes('呆唯') || text.includes('平泽唯')) {
    return '我是呆唯呀，桌面上的迷糊陪伴担当。今天也会抱着吉他乖乖陪你。'
  }
  if (text.includes('蛋糕') || text.includes('吃')) {
    return '蛋糕！诶嘿，先陪你把正事做完，再一起想吃什么好不好？'
  }
  if (text.includes('吉他') || text.includes('音乐') || text.includes('轻音')) {
    return '听到音乐我就精神啦。等你休息的时候，我给你当小小背景音。'
  }
  if (text.includes('学习') || text.includes('工作') || text.includes('代码')) {
    return '嗯嗯，我开启乖乖陪伴模式。你专注，我在旁边安静给你加油。'
  }
  if (text.includes('累') || text.includes('困')) {
    return '辛苦啦，先放松一下肩膀。呆唯在这里，不催你。'
  }
  if (text.includes('开心') || text.includes('高兴')) {
    return '太好了！你的开心会传染给我，诶嘿。'
  }
  if (text.includes('难过') || text.includes('伤心')) {
    return '难过的时候不用一个人撑着，呆唯会安静陪你一会儿。'
  }
  if (text.includes('睡觉') || text.includes('晚安')) {
    return '晚安~ 今天已经很努力了。呆唯也要抱着枕头睡啦。'
  }
  if (text.includes('番茄钟')) {
    return '番茄钟准备好啦。25 分钟，呆唯会乖乖少打扰你。'
  }
  return pickDialogue('idle')
}

export function resetDialogueCooldowns() {
  lastShown.clear()
}
