// 番茄钟 & 提醒定时器工具

/**
 * 创建一个倒计时器
 * @param {number} duration 持续时间（秒）
 * @param {function} onTick 每秒回调 (remainingSeconds)
 * @param {function} onComplete 完成回调
 * @returns {{ start, pause, resume, reset, isRunning }}
 */
export function createCountdown(duration, onTick, onComplete) {
  let remaining = duration
  let intervalId = null
  let running = false

  function tick() {
    remaining--
    if (onTick) onTick(remaining)
    if (remaining <= 0) {
      clearInterval(intervalId)
      intervalId = null
      running = false
      if (onComplete) onComplete()
    }
  }

  function start() {
    if (running) return
    running = true
    intervalId = setInterval(tick, 1000)
  }

  function pause() {
    if (!running) return
    running = false
    clearInterval(intervalId)
    intervalId = null
  }

  function resume() {
    if (running || remaining <= 0) return
    start()
  }

  function reset(newDuration) {
    pause()
    remaining = newDuration || duration
    if (onTick) onTick(remaining)
  }

  function getRemaining() {
    return remaining
  }

  function isRunning() {
    return running
  }

  return { start, pause, resume, reset, getRemaining, isRunning }
}

/**
 * 格式化秒数为 mm:ss
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
