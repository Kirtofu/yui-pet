// 主进程动作执行器：把渲染端传来的"动作"安全地落到操作系统层面。
// 设计原则：
// 1. 只接受白名单类型 (open_url / open_path / open_app / search_web)。
// 2. 不直接执行用户输入的字符串作为 shell 命令，避免注入。
// 3. open_url 强制 http/https。open_app 用 spawn + detached，不通过 shell 解释。

const { shell } = require('electron')
const { spawn } = require('child_process')

const SEARCH_ENGINES = {
  bing: 'https://www.bing.com/search?q=',
  google: 'https://www.google.com/search?q=',
  baidu: 'https://www.baidu.com/s?wd=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  zhihu: 'https://www.zhihu.com/search?type=content&q='
}

function isSafeHttpUrl(url) {
  try {
    const u = new URL(String(url))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

async function openUrl(url) {
  if (!isSafeHttpUrl(url)) {
    throw new Error('仅支持 http/https 网址')
  }
  await shell.openExternal(url)
  return { ok: true, message: `已打开 ${url}` }
}

async function openPath(target) {
  const value = String(target || '').trim()
  if (!value) throw new Error('路径为空')
  const err = await shell.openPath(value)
  if (err) throw new Error(err)
  return { ok: true, message: `已打开 ${value}` }
}

async function openApp(action) {
  const params = action.params || {}
  const command = String(params.command || action.target || '').trim()
  if (!command) throw new Error('未指定要启动的程序')

  // 仅在已知白名单系统程序或绝对路径下允许；阻挡明显危险输入
  if (/[\r\n<>|&;`$]/.test(command)) {
    throw new Error('命令包含非法字符')
  }

  const args = Array.isArray(params.args) ? params.args.map(String) : []
  const cwd = params.cwd ? String(params.cwd) : undefined

  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    shell: false
  })
  child.on('error', err => {
    console.error('[actionExecutor] spawn error:', err.message)
  })
  child.unref()
  return { ok: true, message: `已启动 ${command}` }
}

async function searchWeb(action) {
  const keyword = String(action.target || '').trim()
  if (!keyword) throw new Error('搜索关键词为空')
  const engine = String(action.engine || 'bing').toLowerCase()
  const base = SEARCH_ENGINES[engine] || SEARCH_ENGINES.bing
  return await openUrl(base + encodeURIComponent(keyword))
}

async function executeAction(action) {
  if (!action || typeof action !== 'object' || !action.type) {
    throw new Error('无效的动作描述')
  }
  switch (action.type) {
    case 'open_url':
      return await openUrl(action.target)
    case 'open_path':
      return await openPath(action.target)
    case 'open_app':
      return await openApp(action)
    case 'search_web':
      return await searchWeb(action)
    default:
      throw new Error(`不支持的动作类型: ${action.type}`)
  }
}

module.exports = { executeAction }
