# GitHub 快速上传与更新流程

这份文档适用于本项目，也可以复用到以后其他项目。

## 第一次上传到 GitHub

### 1. 准备项目

确认项目根目录里有 `.gitignore`，至少忽略这些内容：

```gitignore
node_modules/
dist/
release/
.env
*.log
```

这些文件不应该直接上传到仓库：

- `node_modules/`：依赖包，别人运行 `npm install` 会自动安装。
- `dist/`、`release/`：构建产物，体积大，应该通过打包命令重新生成。
- `.env`、`pet-settings.json`：本地配置和密钥。
- 日志、截图、临时文件。

### 2. 初始化 git

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
```

### 3. 在 GitHub 新建仓库

在 GitHub 网页点击：

```text
右上角 + -> New repository
```

建议填写：

```text
Repository name: yui-pet
Description: Electron + Vue desktop pet app
Visibility: Public 或 Private
```

注意：

- 不要勾选 `Add a README file`。
- 不要勾选 `.gitignore`。
- 不要勾选 `license`。

因为本地项目已经有这些文件，远端保持空仓库最简单。

### 4. 关联远端并推送

把下面命令里的 `<你的用户名>` 换成你的 GitHub 用户名：

```bash
git remote add origin https://github.com/<你的用户名>/yui-pet.git
git push -u origin main
```

如果你把仓库名改成了别的，也同步替换 URL 里的仓库名。

## 以后更新版本怎么提交

每次做完一轮功能后，在项目根目录执行：

```bash
git status
git add .
git commit -m "描述这次更新"
git push
```

例子：

```bash
git add .
git commit -m "Improve pet movement and speech bubble layout"
git push
```

## 发布新版 exe

源码仓库不建议直接提交 `release/DesktopPet.exe`。更推荐使用 GitHub Release。

本地先打包：

```bash
npm run build
```

然后在 GitHub 页面：

```text
右侧 Releases -> Create a new release
```

建议：

```text
Tag: v1.0.0
Title: Desktop Pet v1.0.0
附件: release/DesktopPet.exe
```

以后版本号递增：

```text
v1.0.1
v1.1.0
v2.0.0
```

简单规则：

- 修 bug：最后一位加 1，例如 `v1.0.1`。
- 加小功能：中间一位加 1，例如 `v1.1.0`。
- 大改版：第一位加 1，例如 `v2.0.0`。

## 常用命令

查看当前改了什么：

```bash
git status
```

查看具体代码差异：

```bash
git diff
```

撤销某个还没提交的文件修改：

```bash
git restore 文件路径
```

查看提交历史：

```bash
git log --oneline
```

查看远端仓库：

```bash
git remote -v
```

## 如果换电脑继续开发

先克隆仓库：

```bash
git clone https://github.com/<你的用户名>/yui-pet.git
cd yui-pet
npm install
npm run dev
```

## 如果 GitHub 上已经改过，本地也改过

先拉取远端更新：

```bash
git pull
```

如果没有冲突，再提交本地改动：

```bash
git add .
git commit -m "描述这次更新"
git push
```

如果出现冲突，打开提示的冲突文件，保留需要的代码，删掉 `<<<<<<<`、`=======`、`>>>>>>>` 标记后再提交。

## 推荐日常流程

```bash
git pull
npm install
npm run dev
```

开发完成后：

```bash
npm run build
git status
git add .
git commit -m "描述这次更新"
git push
```
