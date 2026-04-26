# Notion Database Schema

本项目依赖一个数据库作为博客内容源。同步脚本会读取数据库中 `Status = Published` 的页面，并将其正文转换为本地 Markdown 文件。

## 字段定义

| 字段名 | 类型 | 必填 | 可选值 | 用途 |
| --- | --- | --- | --- | --- |
| 名称 | `title` | 是 | 无 | 文章标题，Notion 默认标题字段 |
| Slug | `rich_text` | 是 | 推荐 `日期-标题` | 文章 URL 和本地文件名 |
| Status | `select` | 是 | `Draft`, `Published` | 控制文章是否发布 |
| Date | `date` | 是 | 日期 | 发布时间和排序依据 |
| Excerpt | `rich_text` | 是 | 任意文本 | 首页摘要和 RSS 描述 |
| Group | `select` | 是 | `tech`, `notes`, `life` | 首页分组 |
| Tags | `multi_select` | 否 | 自定义 | 标签展示和分类扩展 |
| Cover | `url` | 否 | 图片 URL | 封面链接，当前会写入 frontmatter |

## 字段说明

### 名称

- 类型：`title`
- 说明：Notion 数据库默认标题字段
- 用途：作为文章标题输出到 frontmatter

### Slug

- 类型：`rich_text`
- 说明：文章 URL 和本地 Markdown 文件名
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
- 说明：用于文章排序、frontmatter 生成和 RSS `pubDate`

### Excerpt

- 类型：`rich_text`
- 说明：首页摘要、RSS 描述、SEO description 默认内容来源

### Group

- 类型：`select`
- 建议选项：
  - `tech`
  - `notes`
  - `life`
- 说明：首页列表分组字段

### Tags

- 类型：`multi_select`
- 说明：可选，用于附加标签信息

### Cover

- 类型：`url`
- 说明：可选，写入文章 frontmatter，便于后续扩展封面展示

## 创建步骤

1. 在 Notion 中创建一个新数据库
2. 保留默认标题字段，并重命名为 `名称`
3. 按上表创建其余字段
4. 为 `Status` 和 `Group` 配置可选值
5. 将数据库共享给你的 Notion Integration
6. 将数据库 ID 填入环境变量 `NOTION_DATABASE_ID`

## 同步行为

- 只会拉取 `Status = Published` 的页面
- Notion 正文作为博客正文来源
- 同步脚本默认会删除不再处于已发布状态的 Notion 托管文章
- 手工创建且没有 `notionId` 的本地文章不会被脚本覆盖
