# 桌面宠物 Desktop Pet

基于自定义角色图片构建的可爱桌面宠物应用。使用 Electron + Vue 3 开发，打包后是一个独立的 Windows 桌面程序（.exe），双击即可运行。

当前角色：**平泽唯（呆唯）**

## 运行方式

### 开发模式（调试用） 

```bash
# 安装依赖
npm install

# 启动开发模式（Vite + Electron 同时启动）
npm run dev
```

### 打包为 .exe 便携程序

```bash
npm run build
```

打包完成后，在 `release/` 目录下会生成 `DesktopPet.exe`，免安装，双击直接运行。

### 直接运行已打包版本

如果你已经有 `DesktopPet.exe`，不需要启动开发服务。直接双击：

```text
release/DesktopPet.exe
```

`npm run dev` 只用于开发调试；正常使用和分发请使用 `release/DesktopPet.exe` 或 GitHub Release 里的 exe。

## 功能列表

- ✅ 透明窗口、无边框、桌面置顶
- ✅ 鼠标拖拽移动桌宠
- ✅ 右键菜单（聊天/番茄钟/提醒/角色信息/置顶/透明度/自启动/隐藏/退出）
- ✅ 多状态角色图片切换（待机/开心/生气/困倦/拖拽）
- ✅ 情绪系统（好感度影响桌宠表现）
- ✅ 时间段问候（早/中/晚/深夜不同台词）
- ✅ AI 聊天（接入 DeepSeek，支持上下文对话）
- ✅ 对话驱动操作（例如“帮我打开 leetcode”“搜一下 Vue 3 教程”）
- ✅ 快捷动作管理（网页、应用、路径、搜索；带白名单和确认策略）
- ✅ 番茄钟（工作25分钟/休息5分钟，可调节）
- ✅ 定时提醒（喝水/休息/吃饭/睡觉/护眼）
- ✅ 角色信息面板（名称/好感度/情绪/陪伴天数/互动次数）
- ✅ 桌宠大小调节
- ✅ 开机自启动
- ✅ 位置记忆（下次启动恢复上次位置）
- ✅ 随机自言自语

## 项目结构

```
desktop-pet/
├─ docs/
│  ├─ ACTION_TRIGGERS.md       # 桌宠动作触发条件
├─ electron/
│  ├─ main.js                  # Electron 主进程
│  ├─ preload.js               # 预加载脚本（安全桥接）
│  ├─ actionExecutor.js        # 对话动作执行器
│  └─ tray-icon.png            # 系统托盘图标
├─ public/
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ index.html
└─ src/
   ├─ main.js                  # Vue 入口
   ├─ App.vue                  # 根组件
   ├─ assets/
   │  └─ character/            # 角色状态图片（Q版透明PNG）
   ├─ components/
   │  ├─ PetCharacter.vue       # 桌宠角色主体
   │  ├─ SpeechBubble.vue       # 气泡对话
   │  ├─ ContextMenu.vue        # 右键菜单
   │  ├─ ChatPanel.vue          # 聊天面板
   │  ├─ ShortcutsPanel.vue     # 快捷动作管理
   │  ├─ PomodoroPanel.vue      # 番茄钟
   │  ├─ ReminderPanel.vue      # 提醒设置
   │  ├─ CharacterInfoPanel.vue # 角色信息
   │  ├─ SettingsPanel.vue      # 设置面板
   │  ├─ StudyPanel.vue         # 学习陪伴
   │  └─ AchievementsPanel.vue  # 成就面板
   ├─ composables/
   │  └─ usePetBehavior.js      # 自动行为、移动、鼠标看向
   ├─ data/
   │  ├─ defaultData.js         # 默认持久化数据
   │  └─ dialogueCatalog.js     # 分类台词库
   ├─ stores/
   │  └─ petStore.js            # Pinia 状态管理
   ├─ utils/
   │  ├─ ai.js                  # AI 对话接口
   │  ├─ actionRegistry.js      # 意图匹配、动作标记解析
   │  ├─ audioManager.js        # 音效管理
   │  ├─ dialogueEngine.js      # 台词选择与关键词回复
   │  ├─ stateMachine.js        # 状态机
   │  └─ storage.js             # 持久化工具
   └─ styles/
      ├─ global.css             # 全局样式
      └─ animation.css          # 动画关键帧
```

## 接入 AI 对话

聊天功能通过 `src/utils/ai.js` 实现。

运行程序后打开：

```text
右键桌宠 -> 设置 -> AI 配置
```

填写：

```text
API Key: 你的密钥
baseURL: https://api.deepseek.com/chat/completions
model: deepseek-chat
system prompt: 呆唯的人设或你想要的角色设定
```

配置会保存在本机：

```text
%APPDATA%/desktop-pet/pet-settings.json
```

### 支持的 AI 服务

只要兼容 OpenAI 格式的 API 都可以直接替换：

| 服务商 | API_URL | model |
|--------|---------|-------|
| DeepSeek | `https://api.deepseek.com/chat/completions` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-3.5-turbo` / `gpt-4o` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-turbo` |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | `glm-4-flash` |
| Moonshot | `https://api.moonshot.cn/v1/chat/completions` | `moonshot-v1-8k` |

### 修改角色人设

推荐在设置面板里改 `system prompt`。如果没有配置 API Key，程序会自动使用本地关键词回复，不会影响运行。

代码里也保留了默认呆唯人设，位置：

```text
src/data/defaultData.js
src/utils/ai.js
```

## 替换角色图片

将不同状态的 Q 版角色图片（透明背景 PNG）放入 `src/assets/character/` 目录：

- `idle.png` - 待机状态
- `happy.png` - 开心/被点击
- `angry.png` - 生气
- `sleepy.png` - 困倦
- `drag.png` - 被拖拽

替换后重新打包即可：

```bash
npm run build
```

### 如何生成 Q 版角色图

推荐用 AI 图像工具，上传你的角色原图，使用类似提示词：

> 将这张人物图片转换为 Q 版桌宠角色，chibi style，透明背景 PNG，保留原人物的发型、服装、配色。

需要分别生成 idle / happy / angry / sleepy / drag 五个状态。

## 修改角色名称

在 `src/stores/petStore.js` 中修改默认名称：

```js
const characterName = ref('呆唯')  // 改成你想要的名字
```

也可以在运行时通过右键菜单 → 角色信息面板中直接修改。

## 注意事项

- 首次打包需要下载 Electron 二进制文件（约 109MB），建议使用国内镜像加速
- 打包命令中已配置跳过代码签名，适合个人使用
- 设置数据保存在 `%APPDATA%/desktop-pet/pet-settings.json`，删除此文件可重置所有设置
