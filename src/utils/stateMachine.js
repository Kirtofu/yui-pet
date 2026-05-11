export const STATE_CONFIG = {
  idle: { priority: 0, duration: 0 },
  walk: { priority: 1, duration: 6000 },
  sleep: { priority: 1, duration: 18000 },
  happy: { priority: 3, duration: 2200 },
  angry: { priority: 3, duration: 2800 },
  bored: { priority: 1, duration: 6000 },
  drag: { priority: 100, duration: 0 },
  talk: { priority: 4, duration: 3500 },
  remind: { priority: 8, duration: 5000 },
  pomodoro: { priority: 7, duration: 5000 },
  blink: { priority: 2, duration: 220 },
  hover: { priority: 1, duration: 0 },
  headpat: { priority: 6, duration: 2400 },
  startled: { priority: 5, duration: 1400 },
  stretch: { priority: 2, duration: 3200 },
  sit: { priority: 1, duration: 9000 },
  work: { priority: 4, duration: 5000 },
  rest: { priority: 4, duration: 5000 },
  click: { priority: 4, duration: 1200 }
}

export function canEnterState(currentState, nextState, force = false) {
  if (force) return true
  const current = STATE_CONFIG[currentState] || STATE_CONFIG.idle
  const next = STATE_CONFIG[nextState] || STATE_CONFIG.idle
  return next.priority >= current.priority
}

export function getStateDuration(state) {
  return (STATE_CONFIG[state] || STATE_CONFIG.idle).duration
}
