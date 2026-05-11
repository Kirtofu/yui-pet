// 本地存储工具：封装 localStorage 和 Electron 持久化，并提供安全合并。
import { cloneDefaultData } from '../data/defaultData'

const STORAGE_PREFIX = 'desktop-pet:'
const APP_DATA_KEY = 'appData'

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

export function deepMerge(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : defaultValue
  }
  if (!isObject(defaultValue)) {
    return savedValue === undefined || savedValue === null ? defaultValue : savedValue
  }
  const result = { ...defaultValue }
  if (!isObject(savedValue)) return result
  Object.keys(savedValue).forEach(key => {
    result[key] = key in defaultValue
      ? deepMerge(defaultValue[key], savedValue[key])
      : savedValue[key]
  })
  return result
}

// 本地 localStorage 存取（用于非 Electron 环境或临时数据）
export function getLocal(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setLocal(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.warn('[storage] setLocal error', e)
  }
}

export function removeLocal(key) {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

// Electron 持久化存取
export async function getElectronSettings() {
  if (window.electronAPI) {
    try {
      return await window.electronAPI.getSettings()
    } catch {
      return {}
    }
  }
  return getLocal('settings', {})
}

export async function setElectronSettings(data) {
  if (window.electronAPI) {
    try {
      return await window.electronAPI.setSettings(data)
    } catch {
      return false
    }
  }
  setLocal('settings', { ...getLocal('settings', {}), ...data })
  return true
}

export async function loadAppData() {
  const defaults = cloneDefaultData()
  try {
    const settings = await getElectronSettings()
    const saved = settings?.[APP_DATA_KEY] || settings || {}
    if (!settings?.[APP_DATA_KEY]) {
      if (saved.characterName) defaults.character.name = saved.characterName
      if (saved.companionStartTime) defaults.character.companionStartTime = saved.companionStartTime
      if (saved.mood !== undefined) defaults.pet.mood = saved.mood
      if (saved.petSize) defaults.settings.petSize = saved.petSize
      if (saved.autoLaunch !== undefined) defaults.settings.autoLaunch = saved.autoLaunch
      if (saved.opacity !== undefined) defaults.settings.opacity = saved.opacity
    }
    return deepMerge(defaults, saved)
  } catch {
    return defaults
  }
}

export async function saveAppData(data) {
  return setElectronSettings({ [APP_DATA_KEY]: data })
}

export async function resetAppData() {
  const defaults = cloneDefaultData()
  await saveAppData(defaults)
  return defaults
}

export function exportAppData(data) {
  return JSON.stringify(data, null, 2)
}

export function importAppData(raw) {
  return deepMerge(cloneDefaultData(), JSON.parse(raw))
}
