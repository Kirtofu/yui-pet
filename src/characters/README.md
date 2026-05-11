# 角色资源目录

每个角色使用独立目录，例如 `yui/`。推荐结构：

```text
src/characters/<角色ID>/
  character.json
  images/
    idle.png
    happy.png
    angry.png
    sleepy.png
    drag.png
  sounds/
    click.wav
    headpat.wav
    reminder.wav
```

`character.json` 字段：

- `name`：角色名称
- `defaultImage`：默认图片
- `states`：不同状态对应图片路径
- `dialogueFile`：台词文件路径
- `soundDir`：音效或语音目录
- `defaultScale`：默认缩放比例

当前项目仍兼容 `src/assets/character/` 下的原有图片。后续导入角色包时，只需要按上面的格式解包并把角色注册到持久化数据的 `characters` 列表。
