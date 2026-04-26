# Troubleshooting

## `Missing required environment variables`

原因：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `SITE_URL`

至少有一个未配置。

处理：

1. 检查 `blog-frontend/.env` 是否存在
2. 检查变量名是否拼写正确
3. 检查值是否为空

## `No published Notion pages found`

原因：

- 数据库里没有 `Status = Published` 的文章
- Integration 没有访问数据库权限

处理：

1. 确认数据库共享给 Integration
2. 确认至少有一篇文章的 `Status` 为 `Published`
3. 如确实需要空库运行，可设置 `ALLOW_EMPTY_NOTION_SYNC=1`

## `Invalid slug`

原因：

- `Slug` 中包含大写字母、空格、下划线或中文

处理：

- 使用仅包含小写字母、数字和连字符的 slug
- 推荐格式：`2026-04-26-my-first-post`

## `Slug conflict`

原因：

- 不同 Notion 页面使用了相同 `Slug`
- 本地已有同名 Markdown 文件但绑定了不同 `notionId`

处理：

1. 回到 Notion 检查重复 slug
2. 检查 `blog-frontend/posts/` 中是否已有冲突文件

## GitHub Actions 部署失败

重点检查：

- GitHub Secrets 中是否已配置 `NOTION_TOKEN`
- GitHub Secrets 中是否已配置 `NOTION_DATABASE_ID`
- 仓库 Pages Source 是否设置为 GitHub Actions
- `npm ci` 是否能正常安装依赖

## 本地预览看不到文章

原因通常是：

- 尚未执行 `npm run build`
- `posts.json` 未更新
- 打开的是错误的端口或路径

处理：

```bash
cd blog-frontend
npm run build
npm run serve
```
