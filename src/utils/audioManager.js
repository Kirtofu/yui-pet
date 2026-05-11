let audioContext = null

function getAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audioContext = new Ctx()
  }
  return audioContext
}

export function playUiSound(type, settings = {}) {
  if (settings.muted) return
  const ctx = getAudioContext()
  if (!ctx) return

  const volume = Math.max(0, Math.min(1, settings.volume ?? 0.6))
  const tones = {
    click: [660, 0.05],
    headpat: [880, 0.08],
    popup: [720, 0.06],
    reminder: [520, 0.12],
    pomodoro: [760, 0.14],
    error: [220, 0.08]
  }
  const [freq, duration] = tones[type] || tones.click
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.value = 0.0001
  gain.gain.exponentialRampToValueAtTime(0.08 * volume, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.02)
}

export async function playVoiceLine(line, settings = {}) {
  if (!line?.voice || settings.muted) return false
  try {
    const audio = new Audio(line.voice)
    audio.volume = Math.max(0, Math.min(1, settings.volume ?? 0.6))
    await audio.play()
    return true
  } catch {
    return false
  }
}
