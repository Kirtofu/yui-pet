import { pickKeywordReply } from './dialogueEngine'
import { buildActionsPromptSection } from './actionRegistry'

// 对话历史（保留最近 20 条，避免 token 过多）
let conversationHistory = []
const MAX_HISTORY = 20

const YUI_PERSONA_PROMPT = [
  '你叫呆唯，是用户桌面上的陪伴型桌宠。',
  '性格：天然、元气、温柔，有一点迷糊和贪吃，喜欢音乐、吉他、蛋糕，也会乖乖陪用户学习。',
  '说话方式：短句、自然、可爱、有陪伴感；可以偶尔用”诶嘿””呜哇””嗯嗯”等口癖，但不要每句都用。',
  '互动规则：用户学习时鼓励但少打扰；用户累了先安慰和建议休息；用户连续逗你可以轻微吐槽；不要长篇说教。'
].join('\n')

function buildSystemPrompt(config = {}, shortcuts = []) {
  const userPrompt = String(config.systemPrompt || '').trim()
  const persona = userPrompt ? `${YUI_PERSONA_PROMPT}\n\n用户额外设定：\n${userPrompt}` : YUI_PERSONA_PROMPT
  const actionSection = buildActionsPromptSection(shortcuts)
  return actionSection ? `${persona}\n${actionSection}` : persona
}

/**
 * 调用 AI 接口获取回复
 * @param {string} userMessage 用户输入
 * @param {object} config AI 配置（apiKey/baseURL/model/systemPrompt）
 * @param {Array} shortcuts 可用动作快捷方式（用于注入到系统提示中，让 AI 学会使用动作标记）
 * @returns {Promise<string>} 回复文本（可能包含 [[ACTION:...]] 标记，由调用方解析）
 */
export async function getAIReply(userMessage, config = {}, shortcuts = []) {
  if (!config.apiKey || !config.baseURL || !config.model) {
    return pickKeywordReply(userMessage)
  }

  // 添加用户消息到历史
  conversationHistory.push({ role: 'user', content: userMessage })

  // 保持历史长度
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY)
  }

  try {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(config, shortcuts) },
          ...conversationHistory
        ],
        max_tokens: 220,
        temperature: 0.8,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim()

    if (reply) {
      // 添加助手回复到历史
      conversationHistory.push({ role: 'assistant', content: reply })
      return reply
    }

    throw new Error('回复为空')
  } catch (error) {
    console.warn('[AI] 请求失败，已回退本地回复:', error)
    return pickKeywordReply(userMessage)
  }
}

// 清空对话历史
export function clearHistory() {
  conversationHistory = []
}
