// 渲染端动作注册表：
// - 关键词意图匹配（matchIntent）
// - AI 回复中动作标记解析（parseActionMarkers）
// - 给 AI 注入"可用动作"系统提示（buildActionsPromptSection）
// - 桥接 Electron 执行（executeAction）
// 设计要点：所有"打开应用 / 打开路径"必须命中预先注册的 shortcut，避免 AI 凭空生成可执行文件路径。

const SAFE_WHITELIST_TYPES = ['open_url', 'open_path', 'open_app', 'search_web']

// "打开/启动 X" 类触发短语（左侧动词 + 右侧目标）
const OPEN_VERB_PATTERNS = [
  /(?:帮我?|帮忙|麻烦|可以|来|请|快)?\s*(?:打开|启动|运行|开启|跳转到|访问|进入|去|上|开)\s*(?:一?个|一?下)?\s*([^\s,，。!！?？]+)/i,
  /(?:我想|我要|想要|要)\s*(?:看|去|刷|访问|进入|跳转到|查看|开|上)\s*([^\s,，。!！?？]+)/i
]

// 搜索类触发短语：捕获关键词
const SEARCH_PATTERNS = [
  /(?:帮我?|麻烦)?\s*(?:搜索|搜一下|查询|查一下|搜)\s*[:：]?\s*(.+)$/i,
  /(?:百度|google|谷歌|bing|必应)\s*[一]?\s*下\s*[:：]?\s*(.+)$/i
]

function normalize(str) {
  return String(str || '').trim().toLowerCase()
}

function isValidShortcut(sc) {
  if (!sc || !sc.id || !sc.type) return false
  return SAFE_WHITELIST_TYPES.includes(sc.type)
}

/**
 * 在用户消息中尝试匹配一个动作意图。
 * 命中"打开/启动 + 关键词" 或 "搜索 + 关键词" 时返回结构化动作；否则返回 null。
 */
export function matchIntent(message, shortcuts = []) {
  const text = String(message || '').trim()
  if (!text) return null

  // 搜索意图优先（"搜一下 X"、"百度一下 X"）
  for (const re of SEARCH_PATTERNS) {
    const m = text.match(re)
    if (m && m[1]) {
      const keyword = m[1].trim().replace(/^[:：]\s*/, '')
      if (!keyword) continue
      const engine = /百度/.test(text) ? 'baidu'
        : /(google|谷歌)/i.test(text) ? 'google'
        : 'bing'
      return {
        source: 'intent',
        action: { type: 'search_web', target: keyword, engine },
        label: `搜索"${keyword}"`,
        icon: '🔎'
      }
    }
  }

  // 快捷方式关键词匹配（必须搭配"打开/启动..."类触发词，避免误触发）
  const opensTargets = []
  for (const re of OPEN_VERB_PATTERNS) {
    let scan = text
    let m
    while ((m = re.exec(scan)) !== null) {
      if (m[1]) opensTargets.push(normalize(m[1]))
      scan = scan.slice(m.index + m[0].length)
    }
  }
  if (!opensTargets.length) return null

  const lowerText = normalize(text)
  for (const sc of shortcuts) {
    if (!isValidShortcut(sc)) continue
    const keywords = (sc.keywords || []).map(normalize).filter(Boolean)
    if (!keywords.length) continue
    const hit = keywords.some(kw =>
      opensTargets.some(t => t === kw || t.includes(kw)) || lowerText.includes(`打开${kw}`)
    )
    if (hit) {
      return {
        source: 'intent',
        shortcut: sc,
        action: { type: sc.type, target: sc.target, params: sc.params, engine: sc.engine },
        label: sc.label || sc.id,
        icon: sc.icon || '✨'
      }
    }
  }

  return null
}

const MARKER_RE = /\[\[ACTION:([a-z_]+)\|([^\]]+)\]\]/gi

/**
 * 从 AI 回复中提取所有 [[ACTION:...]] 标记，并返回清洗后的纯文本 + 动作数组。
 */
export function parseActionMarkers(replyText, shortcuts = []) {
  const raw = String(replyText || '')
  const actions = []
  const re = new RegExp(MARKER_RE.source, 'gi')
  let m
  while ((m = re.exec(raw)) !== null) {
    const type = m[1].toLowerCase()
    const args = m[2].split('|').map(s => s.trim())

    let action = null
    let label = ''
    let icon = '✨'

    if (type === 'open_url') {
      action = { type: 'open_url', target: args[0] }
      label = args[1] || args[0]
      icon = '🌐'
    } else if (type === 'shortcut') {
      const sc = shortcuts.find(s => s.id === args[0])
      if (sc && isValidShortcut(sc)) {
        action = { type: sc.type, target: sc.target, params: sc.params, engine: sc.engine }
        label = sc.label || sc.id
        icon = sc.icon || '✨'
      }
    } else if (type === 'search' || type === 'search_web') {
      action = { type: 'search_web', target: args[0], engine: args[1] || 'bing' }
      label = `搜索"${args[0]}"`
      icon = '🔎'
    }

    if (action) actions.push({ source: 'ai', action, label, icon })
  }

  const cleaned = raw
    .replace(re, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,，。]+|[\s]+$/g, '')
    .trim()

  return { text: cleaned, actions }
}

/**
 * 给 AI 系统提示拼接一段"可用动作"说明。
 * shortcuts 已经被裁剪过（只含 id/label/keywords/简要类型）。
 */
export function buildActionsPromptSection(shortcuts = []) {
  const valid = (shortcuts || []).filter(isValidShortcut)
  if (!valid.length) return ''

  const lines = valid.slice(0, 30).map(sc => {
    const kw = (sc.keywords || []).slice(0, 4).join('/')
    const typeHint = sc.type === 'open_url' ? '网页'
      : sc.type === 'open_app' ? '应用'
      : sc.type === 'open_path' ? '路径'
      : sc.type === 'search_web' ? '搜索' : '动作'
    return `- ${sc.id}（${typeHint}・${sc.label || sc.id}・关键词：${kw}）`
  })

  return [
    '',
    '【你拥有"操作桌面"的能力】用户明示要打开 / 启动 / 搜索某样东西时，你可以在回复里嵌入以下标记，系统会自动执行（标记本身不会显示给用户，用户只看到正文）。',
    '指令格式：',
    '- 打开网页：[[ACTION:open_url|完整URL|可选标签]]',
    '- 调用快捷方式：[[ACTION:shortcut|快捷方式ID]]',
    '- 网页搜索：[[ACTION:search|关键词|可选引擎 bing/google/baidu]]',
    '可用快捷方式：',
    ...lines,
    '使用守则：',
    '1) 只在用户明确希望执行操作时才嵌入指令；闲聊不要乱用。',
    '2) 先用一句口语化的话告诉用户你在做什么（比如"好的~我帮你打开 LeetCode"），再附指令。',
    '3) 一次回复可以包含多个指令；不要重复同一个指令。',
    '4) 不要在指令里写任何用户没明示过的路径或文件名。'
  ].join('\n')
}

/**
 * 执行动作（通过 Electron IPC）。
 * 在浏览器环境（如开发调试 SPA）下回退到 window.open。
 */
export async function executeAction(action) {
  if (!action || !action.type) return { ok: false, message: '无效动作' }

  if (window.electronAPI?.executeAction) {
    try {
      return await window.electronAPI.executeAction(action)
    } catch (e) {
      return { ok: false, message: String(e && e.message ? e.message : e) }
    }
  }

  // 浏览器回退：仅支持 open_url / search_web
  if (action.type === 'open_url' && /^https?:\/\//.test(String(action.target || ''))) {
    window.open(action.target, '_blank', 'noopener')
    return { ok: true, message: '已在浏览器打开' }
  }
  if (action.type === 'search_web') {
    const engines = {
      bing: 'https://www.bing.com/search?q=',
      google: 'https://www.google.com/search?q=',
      baidu: 'https://www.baidu.com/s?wd='
    }
    const base = engines[action.engine] || engines.bing
    window.open(base + encodeURIComponent(action.target || ''), '_blank', 'noopener')
    return { ok: true, message: '已在浏览器搜索' }
  }
  return { ok: false, message: '当前环境无法执行此动作' }
}

/**
 * 判断某动作是否需要在执行前向用户确认。
 * policy: 'always' | 'risky' | 'never'
 */
export function needsConfirmation(action, policy = 'risky') {
  if (!action || !action.type) return false
  if (policy === 'never') return false
  if (policy === 'always') return true
  // 'risky'：非 URL / 搜索类需要确认
  return action.type !== 'open_url' && action.type !== 'search_web'
}
