# Skill Sync — 需求文档

## 一句话描述

一个本地 Web 工具，在一个中心目录管理所有编码助手的 rule 和 skill 文件，通过 symlink 同步到各编辑器的全局目录。

## 核心概念

- **中心仓库（Central Repo）**：用户选择的一个目录，统一存放 rule 文件和 skill 目录
- **编辑器（Editor）**：各编码助手，各有自己的 rules 目录和 skills 目录
- **同步（Sync）**：从中心仓库创建 symlink 到编辑器目录，实现一处修改、处处生效
- **Symlink 类型**：文件用 `file` 类型，目录用 `junction` 类型（Windows）

## 目录结构

### 中心仓库

```
<central-repo>/
├── rules/
│   ├── coding-style.md        # 单个 rule 文件
│   ├── no-overengineering.md
│   └── review-guidelines.md
└── skills/
    ├── skill-a/               # 单个 skill 目录
    │   └── SKILL.md
    └── skill-b/
        └── SKILL.md
```

### 编辑器目录（示例）

```
~/.claude/rules/coding-style.md  → symlink → central-repo/rules/coding-style.md
~/.claude/skills/skill-a/        → symlink → central-repo/skills/skill-a/
~/.trae/rules/coding-style.md    → symlink → central-repo/rules/coding-style.md
```

## 功能需求

### 1. 中心仓库设置

- 用户可选择/输入中心仓库路径
- 路径保存到 config.json
- 自动扫描中心仓库下的 `rules/` 和 `skills/` 目录

### 2. 编辑器管理

- 预置默认编辑器列表（Claude Code、Trae、Cursor、QClaw、WorkBuddy、CodeBuddy、CodeArts）
- 每个编辑器可配置：
  - `id`：唯一标识
  - `name`：显示名称
  - `rulesDir`：rule 文件存放目录路径（支持 `~` 展开）
  - `skillsDir`：skill 目录存放路径
  - `enabled`：是否启用
- 支持新增/编辑/删除编辑器
- 编辑器路径有默认值，用户可修改

### 3. Rule 同步

- 扫描中心仓库 `rules/` 目录下的所有文件
- 显示 rule 文件列表
- 用户勾选要同步的 rule + 勾选目标编辑器
- 点击同步 → 在编辑器 rulesDir 下创建 symlink
- 已存在且指向正确的 symlink → 跳过
- 已存在但非 symlink 或指向错误 → 提示冲突
- 支持取消同步（删除 symlink）

### 4. Skill 同步

- 扫描中心仓库 `skills/` 目录下的所有子目录
- 显示 skill 目录列表
- 用户勾选要同步的 skill + 勾选目标编辑器
- 点击同步 → 在编辑器 skillsDir 下创建 symlink
- 同上冲突检测逻辑
- 支持取消同步

### 5. 状态查看

- 矩阵视图：编辑器 × rule/skill 的同步状态
- 已同步 ✅ / 未同步 ⬜ / 冲突 ⚠️
- 可查看单个编辑器的详细同步情况

### 6. Symlink 创建逻辑（Windows）

```javascript
const sourceStat = fs.statSync(source);
const linkType = sourceStat.isDirectory() ? 'junction' : 'file';
fs.symlinkSync(source, target, linkType);
```

- 需要管理员权限或开启开发者模式
- 目标目录不存在时自动创建
- 目录用 junction，文件用 file

## 配置文件格式

`config.json`：

```json
{
  "centralRepo": "D:/code/central-skills",
  "editors": [
    {
      "id": "claude-code",
      "name": "Claude Code",
      "rulesDir": "~/.claude/rules",
      "skillsDir": "~/.claude/commands",
      "enabled": true
    },
    {
      "id": "trae",
      "name": "Trae",
      "rulesDir": "~/.trae/rules",
      "skillsDir": "",
      "enabled": true
    },
    {
      "id": "cursor",
      "name": "Cursor",
      "rulesDir": "~/.cursor/rules",
      "skillsDir": "",
      "enabled": true
    },
    {
      "id": "qclaw",
      "name": "QClaw",
      "rulesDir": "",
      "skillsDir": "~/.qclaw/skills",
      "enabled": true
    }
  ]
}
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取配置 |
| PUT | `/api/config/repo` | 更新中心仓库路径 |
| GET | `/api/editors` | 获取编辑器列表 |
| POST | `/api/editors` | 新增编辑器 |
| PUT | `/api/editors/:id` | 更新编辑器 |
| DELETE | `/api/editors/:id` | 删除编辑器 |
| GET | `/api/scan` | 扫描中心仓库 rules/skills |
| GET | `/api/status` | 全部编辑器同步状态 |
| GET | `/api/status/:editorId` | 单个编辑器同步状态 |
| POST | `/api/sync` | 执行同步 |
| POST | `/api/unsync` | 取消同步 |

### sync 请求体

```json
{
  "editorIds": ["claude-code", "trae"],
  "rules": ["coding-style.md", "no-overengineering.md"],
  "skills": ["skill-a"]
}
```

### unsync 请求体

同 sync

## 前端界面

### 布局

顶部：中心仓库路径设置
Tab 切换：Rules | Skills | Status | Editors

### Rules Tab

```
┌──────────────────────────────────────────────────┐
│ Rules                                            │
├──────────────┬───────────────────────────────────┤
│ ☑ coding-style.md      │ ☑ Claude Code           │
│ ☑ no-overengineer.md   │ ☑ Trae                  │
│ ☐ review-guidelines.md │ ☐ Cursor                │
│                        │ ☑ QClaw                 │
├────────────────────────┴─────────────────────────┤
│ [全选Rules] [全选Editors]    [同步选中] [取消同步] │
└──────────────────────────────────────────────────┘
```

左侧：rule 文件列表（带 checkbox）
右侧：编辑器列表（带 checkbox）
底部：操作按钮

### Skills Tab

同 Rules Tab，左侧换成 skill 目录列表

### Status Tab

矩阵视图：

```
                Claude Code  Trae  Cursor  QClaw
coding-style.md     ✅        ✅     ⬜      ✅
no-overengineer.md  ✅        ⬜     ⬜      ⬜
skill-a/            ✅        ✅     ⬜      ⬜
skill-b/            ⬜        ⬜     ⬜      ⬜
```

### Editors Tab

编辑器列表，每个可展开编辑路径、启用/禁用、删除

## 技术栈

- 后端：Node.js + Express
- 前端：单 HTML 文件，原生 JS + CSS，无框架无构建
- 存储：config.json 文件

## 当前已完成的代码

位置：`D:\code\skill-sync\`

| 文件 | 状态 | 说明 |
|------|------|------|
| `config.json` | ✅ | 编辑器默认配置 |
| `lib/scanner.js` | ✅ | 扫描中心仓库 + 查同步状态 |
| `lib/linker.js` | ✅ | symlink 创建/删除/同步/取消同步 |
| `server.js` | ✅ | Express API 全部接口已实现 |
| `public/index.html` | ❌ | 前端未写 |
| `package.json` | ❌ | 缺少 start 命令 |

后端 API 已完整可用，前端需要从零实现。
