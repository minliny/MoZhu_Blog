# blog-frontend

这个目录是站点前端和构建脚本的实际实现目录。

## 常用命令

```bash
npm install
npm run sync:notion
npm run sync:notion:dry
npm run build
npm run serve
```

## 环境变量

运行时会读取当前目录下的 `.env` 文件。

请参考：

- `./.env.example`
- `../README.md`
- `../docs/setup.md`
- `../docs/notion-database.md`
- `../docs/deployment.md`

## 目录说明

- `scripts/sync-notion.js`: 从 Notion 同步文章到 `posts/`
- `scripts/generate-posts.js`: 生成 `posts.json`
- `scripts/generate-rss.js`: 生成 `feed.xml`
- `scripts/build.js`: 串联构建流程
- `posts/`: 本地 Markdown 文章
