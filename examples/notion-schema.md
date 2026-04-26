# Notion Schema Example

| 字段名 | 类型 | 必填 | 示例值 | 用途 |
| --- | --- | --- | --- | --- |
| 名称 | `title` | 是 | 欢迎使用 MoZhu_Blog | 文章标题 |
| Slug | `rich_text` | 是 | 2026-04-26-welcome-to-notion-blog | URL 和文件名 |
| Status | `select` | 是 | Published | 控制是否发布 |
| Date | `date` | 是 | 2026-04-26 | 发布时间 |
| Excerpt | `rich_text` | 是 | 这是一篇示例文章。 | 首页摘要和 RSS 描述 |
| Group | `select` | 是 | notes | 分组 |
| Tags | `multi_select` | 否 | sample, getting-started | 标签 |
| Cover | `url` | 否 | https://example.com/cover.png | 封面链接 |

## Status 选项

- `Draft`
- `Published`

## Group 选项

- `tech`
- `notes`
- `life`
