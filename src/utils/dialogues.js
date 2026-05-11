// 对话文本库：根据时间段、情绪、互动类型返回不同台词

// 时间段问候
export function getTimeDialogue() {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 9) {
    return pickRandom([
      '早上好呀~ 新的一天开始了！☀️',
      '起床啦！今天也要元气满满哦~',
      '早安~ 记得吃早餐呀 🍞',
      '新的一天，新的开始！加油~'
    ])
  } else if (hour >= 11 && hour < 13) {
    return pickRandom([
      '该吃午饭啦~ 不要饿着肚子哦 🍱',
      '中午了！休息一下吧~',
      '午餐时间到~ 吃点好吃的犒劳自己吧',
      '记得按时吃饭，身体最重要哦~'
    ])
  } else if (hour >= 14 && hour < 17) {
    return pickRandom([
      '下午也要继续加油哦！💪',
      '专注工作/学习中... 你是最棒的！',
      '下午茶时间~ 喝杯水吧 🍵',
      '坚持就是胜利，你可以的~'
    ])
  } else if (hour >= 18 && hour < 21) {
    return pickRandom([
      '晚上好~ 辛苦一天了 🌙',
      '今天过得怎么样呀？',
      '晚上记得放松一下哦~',
      '忙碌了一天，好好休息吧~'
    ])
  } else if (hour >= 21 && hour < 23) {
    return pickRandom([
      '夜深了，早点休息哦~ 🌛',
      '该准备睡觉啦~ 晚安~',
      '不要太晚睡哦，明天还要早起呢~',
      '今天辛苦了，好梦~ ✨'
    ])
  } else if (hour >= 23 || hour < 6) {
    return pickRandom([
      '都这么晚了还不睡吗？😴',
      '熬夜对身体不好哦... 快去睡觉！',
      '夜猫子！快去休息吧~',
      '再不睡我要生气了哦！💢 （其实是担心你）'
    ])
  }
  return null
}

// 随机对话（根据情绪）
export function getRandomDialogue(emotion) {
  const dialogues = {
    happy: [
      '嘿嘿~ 今天心情超好的！✨',
      '和你在一起好开心呀~',
      '你今天也很棒哦！(◕ᴗ◕✿)',
      '被你点到了~ 好痒！',
      '哇~ 你来找我玩啦！'
    ],
    normal: [
      '有什么事吗？我在呢~',
      '嗯？怎么了？',
      '我在这里陪着你哦~',
      '点我干嘛~ 无聊了吗？',
      '今天天气不错呢~'
    ],
    bored: [
      '好无聊啊... 陪我聊聊天嘛~',
      '你是不是忘了我... 😢',
      '哼，好久没理我了...',
      '我好寂寞... 来陪陪我吧',
      '无聊到想数星星了...'
    ],
    sleepy: [
      '好困... 让我眯一会儿... 😴',
      '呼... 呼... （假装睡着）',
      '打哈欠~ 好想睡觉...',
      '困了... 但是想等你...',
      'zzZ... zzZ...'
    ],
    angry: [
      '哼！你都不来看我！💢',
      '生气了！不理你了！',
      '哼哼~ 除非你多陪陪我...',
      '我要罢工了！（其实不会）',
      '你再不来我就... 就... 继续等你吧'
    ]
  }

  return pickRandom(dialogues[emotion] || dialogues.normal)
}

// 情绪相关台词
export function getEmotionDialogue(emotion) {
  const map = {
    bored: [
      '好无聊... 有人在吗...',
      '一个人待着好寂寞...',
      '想找人聊天...'
    ],
    sleepy: [
      '好困... 要睡着了...',
      '眼皮好重...',
      '呼... 呼...'
    ],
    happy: [
      '今天好开心！',
      '嘿嘿~ 心情超好~',
      '幸福感满满~'
    ]
  }
  return pickRandom(map[emotion] || ['...'])
}

// 自言自语
export function getMonologue() {
  return pickRandom([
    '今天的云好好看呀~',
    '在想要不要吃零食...',
    '啦啦啦~ 🎵',
    '好想出去玩...',
    '你在忙什么呢？',
    '我最喜欢你了~ ❤️',
    '嗯... 让我想想...',
    '偷偷看你一眼~ 👀',
    '希望你今天一切顺利~',
    '加油加油！你是最棒的！',
    '好想吃蛋糕... 🍰',
    '哼哼~ 我可是很厉害的桌宠哦！'
  ])
}

// 聊天预设回复
export function getChatReply(input) {
  const text = input.toLowerCase().trim()

  // 关键词匹配
  if (text.includes('你好') || text.includes('嗨') || text.includes('hi') || text.includes('hello')) {
    return pickRandom(['你好呀~ 很高兴见到你！', '嗨嗨~ 有什么事吗？', '你好！今天过得怎么样？'])
  }
  if (text.includes('名字') || text.includes('你是谁') || text.includes('叫什么')) {
    return '我是你的桌面小伙伴呆唯呀~ 平泽唯（Yui）就是我！你可以叫我呆唯哦！'
  }
  if (text.includes('累') || text.includes('辛苦') || text.includes('疲惫')) {
    return pickRandom(['辛苦了~ 要不要休息一下？', '累了就歇歇吧，我陪着你~', '抱抱~ 你已经很努力了！'])
  }
  if (text.includes('开心') || text.includes('高兴') || text.includes('快乐')) {
    return pickRandom(['看到你开心我也好开心！✨', '太好了！继续保持好心情哦~', '开心就好~ 嘿嘿'])
  }
  if (text.includes('难过') || text.includes('伤心') || text.includes('不开心')) {
    return pickRandom(['别难过了~ 我一直在你身边哦', '抱抱你~ 一切都会好起来的', '有我陪着你呢，不要伤心了~'])
  }
  if (text.includes('学习') || text.includes('工作') || text.includes('写代码')) {
    return pickRandom(['加油！你一定可以的！💪', '专注一下，我在旁边安静陪你~', '学习/工作辛苦了，记得劳逸结合哦~'])
  }
  if (text.includes('睡觉') || text.includes('晚安') || text.includes('困')) {
    return pickRandom(['晚安~ 做个好梦哦 🌙', '早点休息吧~ 明天见~', '晚安晚安~ 我会在梦里保护你的！'])
  }
  if (text.includes('喜欢') || text.includes('爱')) {
    return pickRandom(['我也喜欢你哦~ ❤️', '嘿嘿~ 被喜欢的感觉真好~', '最喜欢你了！(◕ᴗ◕✿)'])
  }
  if (text.includes('吃') || text.includes('饿') || text.includes('饭')) {
    return pickRandom(['记得按时吃饭哦~ 🍱', '想吃什么好吃的？', '不要饿着肚子！身体最重要~'])
  }
  if (text.includes('无聊')) {
    return pickRandom(['那就陪我聊聊天嘛~', '要不要玩个游戏？（虽然我还不会...）', '无聊的话就来找我呀！'])
  }

  // 默认回复
  return pickRandom([
    '嗯嗯~ 我在听呢~',
    '原来如此~ 继续说吧！',
    '好的好的~ (认真点头)',
    '嗯？再说一遍？我刚才在发呆...',
    '我虽然不太懂，但我会一直陪着你的~',
    '说得好！（虽然我不太明白...）',
    '嘿嘿~ 和你聊天好开心~'
  ])
}

// 工具函数：随机选取
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
