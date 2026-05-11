// 场景化台词库。支持权重、冷却、时间段和好感等级过滤。
export const dialogueCatalog = {
  greeting: [
    { text: '早上好呀~ 今天也一起加油！', weight: 4, time: ['morning'] },
    { text: '中午啦，记得吃饭哦。', weight: 3, time: ['noon'] },
    { text: '晚上好~ 今天辛苦了。', weight: 4, time: ['evening'] },
    { text: '这么晚还在忙吗？要保护身体哦。', weight: 3, time: ['night'], minLevel: 1 }
  ],
  idle: [
    { text: '我在这里陪着你哦~', weight: 5, cooldown: 90000 },
    { text: '偷偷看你一眼。', weight: 3, cooldown: 120000 },
    { text: '今天也要顺顺利利的。', weight: 2, minLevel: 1 },
    { text: '要不要喝口水？', weight: 2, time: ['afternoon', 'evening'] }
  ],
  click: [
    { text: '嗯？怎么啦~', weight: 5, cooldown: 12000 },
    { text: '我在我在。', weight: 4, cooldown: 12000 },
    { text: '点我干嘛呀，好痒。', weight: 3, cooldown: 18000 },
    { text: '再点我要晕啦。', weight: 1, cooldown: 20000 }
  ],
  headpat: [
    { text: '嘿嘿，摸摸头最喜欢了~', weight: 5, cooldown: 15000 },
    { text: '好舒服，再一下下就好。', weight: 3, minLevel: 1 },
    { text: '呜哇，突然被夸奖一样开心。', weight: 2 }
  ],
  drag: [
    { text: '哇啊，慢一点慢一点！', weight: 4, cooldown: 18000 },
    { text: '被拎起来了……', weight: 3 },
    { text: '要把我放到哪里呀？', weight: 2 }
  ],
  pomodoro: [
    { text: '专注结束啦，你做得很好！', weight: 4 },
    { text: '休息一下吧，补充能量很重要。', weight: 3 },
    { text: '今天的努力我都有看到哦。', weight: 2, minLevel: 2 }
  ],
  reminder: [
    { text: '提醒时间到啦~', weight: 4 },
    { text: '小小提醒，不要忘记正事哦。', weight: 3 },
    { text: '我来敲敲你的小脑袋提醒一下。', weight: 1, minLevel: 2 }
  ],
  sleepy: [
    { text: '好困……让我眯一会儿。', weight: 5 },
    { text: '眼皮有点重了。', weight: 3 },
    { text: '呼……呼……', weight: 2 }
  ],
  angry: [
    { text: '哼，点太多次啦。', weight: 5, cooldown: 20000 },
    { text: '我也需要一点休息时间嘛。', weight: 3 },
    { text: '再闹我就假装不理你了。', weight: 2 }
  ],
  night: [
    { text: '已经很晚了，早点睡会更有精神。', weight: 4 },
    { text: '深夜还在努力，很厉害，但也要休息。', weight: 3, minLevel: 1 }
  ],
  bored: [
    { text: '有点无聊……陪我说句话嘛。', weight: 5, cooldown: 90000 },
    { text: '我在旁边安静等你。', weight: 3 },
    { text: '要不要给今天列个小目标？', weight: 2 }
  ],
  task: [
    { text: '任务完成！给你一朵小花。', weight: 4 },
    { text: '做得好，今天又前进一点点。', weight: 3 }
  ]
}

export function getTimeBucket(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}
