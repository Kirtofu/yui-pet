import { onMounted, onUnmounted } from 'vue'
import { usePetStore } from '../stores/petStore'

const WINDOW_WIDTH = 360
const WINDOW_HEIGHT = 480

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function isPassiveState(state) {
  return ['idle', 'hover', 'sit', 'sleep', 'sleepy', 'bored'].includes(state)
}

function canAutoBehaviorRun(state) {
  return !['drag', 'remind', 'pomodoro', 'headpat', 'startled', 'click', 'happy', 'angry', 'talk'].includes(state)
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item.name
  }
  return items[0].name
}

function getBehaviorWeights(emotion, focusMode) {
  if (focusMode) {
    return [
      { name: 'idle', weight: 7 },
      { name: 'sit', weight: 4 },
      { name: 'sleep', weight: 1 }
    ]
  }
  const map = {
    happy: [
      { name: 'walk', weight: 5 },
      { name: 'lookMouse', weight: 3 },
      { name: 'stretch', weight: 2 },
      { name: 'idle', weight: 2 }
    ],
    sleepy: [
      { name: 'sleep', weight: 6 },
      { name: 'sit', weight: 3 },
      { name: 'idle', weight: 2 },
      { name: 'walk', weight: 1 }
    ],
    bored: [
      { name: 'talk', weight: 4 },
      { name: 'walk', weight: 2 },
      { name: 'lookMouse', weight: 2 },
      { name: 'idle', weight: 2 }
    ],
    angry: [
      { name: 'idle', weight: 8 },
      { name: 'sit', weight: 2 }
    ],
    normal: [
      { name: 'idle', weight: 4 },
      { name: 'walk', weight: 3 },
      { name: 'lookMouse', weight: 2 },
      { name: 'stretch', weight: 1 },
      { name: 'sit', weight: 1 }
    ]
  }
  return map[emotion] || map.normal
}

export function usePetBehavior() {
  const petStore = usePetStore()
  let behaviorTimer = null
  let mouseTimer = null
  let animationFrame = null
  let lastCursor = null
  let lastStartledAt = 0
  let isMoving = false

  async function getWorkArea() {
    if (window.electronAPI?.getWorkArea) return window.electronAPI.getWorkArea()
    return { x: 0, y: 0, width: window.screen.availWidth, height: window.screen.availHeight }
  }

  async function getPosition() {
    if (window.electronAPI?.getPosition) return window.electronAPI.getPosition()
    return [0, 0]
  }

  async function moveTo(targetX, targetY, duration = 2400) {
    if (!window.electronAPI?.setPosition) return
    const area = await getWorkArea()
    const [startX, startY] = await getPosition()
    const endX = clamp(targetX, area.x, area.x + area.width - WINDOW_WIDTH)
    const endY = clamp(targetY, area.y, area.y + area.height - WINDOW_HEIGHT)
    const moveDirection = endX < startX ? 'left' : 'right'
    if (Math.abs(endX - startX) <= 4 && Math.abs(endY - startY) <= 4) {
      petStore.setState('idle', { force: true })
      return
    }
    if (Math.abs(endX - startX) > 4) {
      petStore.setFacing(moveDirection)
    }
    const start = performance.now()
    petStore.setLookDirection(0, 0)
    petStore.setState('walk', { force: true })
    isMoving = true
    let lastX = startX

    return new Promise(resolve => {
      const tick = now => {
        const t = clamp((now - start) / duration, 0, 1)
        const eased = easeInOutCubic(t)
        const x = Math.round(startX + (endX - startX) * eased)
        const y = Math.round(startY + (endY - startY) * eased)
        if (Math.abs(x - lastX) > 1) {
          petStore.setFacing(x < lastX ? 'left' : 'right')
          lastX = x
        } else if (Math.abs(endX - startX) > 4) {
          petStore.setFacing(moveDirection)
        }
        window.electronAPI.setPosition(x, y)
        if (t < 1 && petStore.currentState !== 'drag') {
          animationFrame = requestAnimationFrame(tick)
        } else {
          isMoving = false
          if (petStore.currentState === 'walk') petStore.setState('idle', { force: true })
          resolve()
        }
      }
      animationFrame = requestAnimationFrame(tick)
    })
  }

  async function randomWalk() {
    const area = await getWorkArea()
    const [x, y] = await getPosition()
    const step = 80 + Math.random() * 180
    const direction = Math.random() > 0.5 ? 1 : -1
    let nextX = x + step * direction
    if (nextX <= area.x + 10 || nextX >= area.x + area.width - WINDOW_WIDTH - 10) {
      nextX = x - step * direction
    }
    petStore.behaviorName = '随机散步'
    await moveTo(nextX, y, 2200 + Math.random() * 1600)
  }

  async function lookAtMouse() {
    if (!window.electronAPI?.getCursorPoint) return
    const point = await window.electronAPI.getCursorPoint()
    const [x, y] = await getPosition()
    const centerX = x + WINDOW_WIDTH / 2
    const centerY = y + WINDOW_HEIGHT / 2
    const dx = point.x - centerX
    const dy = point.y - centerY
    if (Math.abs(dx) > 18) {
      petStore.setFacing(dx < 0 ? 'left' : 'right')
    }
    petStore.setLookDirection(
      clamp(dx / 220, -1, 1),
      clamp(dy / 180, -1, 1)
    )
    petStore.behaviorName = '看向鼠标'
    petStore.setState('hover', { force: isPassiveState(petStore.currentState), duration: 1800 })
  }

  async function runBehavior() {
    if (!petStore.isReady || isMoving || !canAutoBehaviorRun(petStore.currentState)) return
    const behavior = pickWeighted(getBehaviorWeights(petStore.emotion, petStore.focusMode))
    if (behavior === 'walk') await randomWalk()
    if (behavior === 'idle') {
      petStore.behaviorName = '原地发呆'
      petStore.setState('idle')
    }
    if (behavior === 'sleep') {
      petStore.behaviorName = '打瞌睡'
      petStore.setState('sleep')
      if (Math.random() < 0.4) petStore.speakScene('sleepy')
    }
    if (behavior === 'stretch') {
      petStore.behaviorName = '伸懒腰'
      petStore.setState('stretch')
    }
    if (behavior === 'lookMouse') {
      await lookAtMouse()
    }
    if (behavior === 'sit') {
      petStore.behaviorName = '坐下休息'
      petStore.setState('sit')
    }
    if (behavior === 'talk') {
      petStore.behaviorName = '自言自语'
      petStore.randomMonologue()
      petStore.setState('talk')
    }
  }

  function scheduleBehavior() {
    const base = petStore.focusMode ? 90000 : 35000
    const jitter = Math.random() * (petStore.emotion === 'happy' ? 35000 : 65000)
    clearTimeout(behaviorTimer)
    behaviorTimer = setTimeout(async () => {
      await runBehavior()
      scheduleBehavior()
    }, base + jitter)
  }

  async function checkMouse() {
    if (!window.electronAPI?.getCursorPoint || isMoving) return
    const point = await window.electronAPI.getCursorPoint()
    const [x, y] = await getPosition()
    const centerX = x + WINDOW_WIDTH / 2
    const centerY = y + WINDOW_HEIGHT / 2
    const distance = Math.hypot(point.x - centerX, point.y - centerY)
    const now = Date.now()

    if (lastCursor) {
      const speed = Math.hypot(point.x - lastCursor.x, point.y - lastCursor.y)
      if (distance < 140 && speed > 180 && now - lastStartledAt > 7000) {
        lastStartledAt = now
        petStore.setLookDirection(0, 0)
        petStore.onStartled()
      } else if (distance < 260 && isPassiveState(petStore.currentState)) {
        const dx = point.x - centerX
        const dy = point.y - centerY
        if (Math.abs(dx) > 18) {
          petStore.setFacing(dx < 0 ? 'left' : 'right')
        }
        petStore.setLookDirection(
          clamp(dx / 220, -1, 1),
          clamp(dy / 180, -1, 1)
        )
        petStore.behaviorName = '看向鼠标'
        petStore.setState('hover', { force: true, duration: 500 })
      } else if (petStore.currentState === 'hover') {
        petStore.setLookDirection(0, 0)
        petStore.setState('idle', { force: true })
      }
    }
    lastCursor = point
  }

  onMounted(() => {
    scheduleBehavior()
    mouseTimer = setInterval(checkMouse, 120)
  })

  onUnmounted(() => {
    clearTimeout(behaviorTimer)
    clearInterval(mouseTimer)
    petStore.setLookDirection(0, 0)
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })

  return {
    moveTo,
    runBehavior
  }
}
