# Notion Database Schema

本项目依赖一个数据库作为博客内容源。同步脚本会读取数据库中 `Status = Published` 的页面，并将其正文转换为临时快照中的 Markdown 文件。

## 字段定义

| 字段名 | 类型 | 必填 | 可选值 | 用途 |
| --- | --- | --- | --- | --- |
| 名称 | `title` | 是 | 无 | 文章标题，Notion 默认标题字段 |
| Slug | `rich_text` | 否 | 小写英文、数字、连字符 | 可选 URL 覆盖；默认由页面 ID 生成 |
| Status | `select` | 是 | `Draft`, `Published` | 控制文章是否发布 |
| Date | `date` | 否 | 日期 | 默认使用页面创建日期 |
| Excerpt | `rich_text` | 否 | 任意文本 | 留空时由 AI 理解正文后生成 |
| Group | `select` | 否 | `tech`, `notes`, `life` | 默认使用 `notes` |
| Tags | `multi_select` | 否 | 自定义 | 标签展示和分类扩展 |
| Cover | `url` 或 `files` | 否 | 图片 URL/文件 | 封面；Notion 文件会镜像到本地媒体 |
| Aliases | `multi_select` 或 `rich_text` | 否 | 小写 Slug | 历史 Slug，构建时生成重定向 |

## 字段说明

### 名称

- 类型：`title`
- 说明：Notion 数据库默认标题字段
- 用途：作为文章标题输出到 frontmatter

### Slug

- 类型：`rich_text`
- 说明：可选的文章 URL 覆盖；留空会自动生成稳定 URL
- 推荐格式：`2026-04-26-my-first-post`
- 要求：仅使用小写字母、数字和连字符

### Status

- 类型：`select`
- 必须包含以下选项：
  - `Draft`
  - `Published`
- 规则：
  - `Draft` 不发布
  - `Published` 才发布

### Date

- 类型：`date`
- 说明：可选覆盖；留空使用 Notion 页面创建日期

### Excerpt

- 类型：`rich_text`
- 说明：可选覆盖；留空时由 AI 语义理解后重写 60–120 字摘要
- 生成结果会写回该字段作为可编辑缓存；清空后下次发布会重新生成

### Group

- 类型：`select`
- 建议选项：
  - `tech`
  - `notes`
  - `life`
- 说明：可选覆盖；留空默认为 `notes`

### Tags

- 类型：`multi_select`
- 说明：可选，用于附加标签信息

### Cover

- 类型：`url` 或 `files`
- 说明：可选；Notion 托管文件会下载到内容寻址的 `media/` 目录

### Aliases

- 类型：`multi_select` 或 `rich_text`
- 说明：可选的历史 Slug；不得与任何当前 Slug 或其他 Alias 重复

## 创建步骤

1. 在 Notion 中创建一个新数据库
2. 保留默认标题字段，并重命名为 `名称`
3. 创建 `Status` select 字段，至少包含 `Published`
4. 需要手工覆盖自动值时，再创建其他可选字段
5. 将数据库共享给你的 Notion Integration
6. 将数据库 ID 填入环境变量 `NOTION_DATABASE_ID`

## 同步行为

- 只会拉取 `Status = Published` 的页面
- Notion 正文作为博客正文来源
- Slug、Date 和 Group 留空时会本地自动生成
- Excerpt 留空时会调用 AI 生成并写回 Notion，不会直接复制正文开头
- 同步脚本每次生成一个完整的临时快照，并原子替换 `.content/notion/`；不会读取旧的 `posts/` 目录
- 文章从 Published 移出后不会进入下一份快照，构建产物会随之下线；历史 Slug 请填入 `Aliases` 保留重定向
- 同步不会读取或修改仓库中的手工文章；生产内容只来自这份 Notion 快照
