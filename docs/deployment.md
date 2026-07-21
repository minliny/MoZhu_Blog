# Deployment

## 当前真实部署状态

- GitHub Actions：已实现
- GitHub Pages：已实现
- Vercel：待配置
- Netlify：待配置

## GitHub Actions + GitHub Pages

仓库包含工作流文件 [deploy-blog.yml](../.github/workflows/deploy-blog.yml)。

当前流程：

1. 推送到 `main`，每 30 分钟定时检查，或由 `repository_dispatch` 触发
2. 在 `blog-frontend/` 执行 `npm ci`
3. 根据仓库名选择 Notion 或公开 fixtures 内容源
4. Notion 模式生成 `.content/notion/` 无状态全量快照
5. 空 Excerpt 通过 GitHub Models 生成摘要并写回 Notion 作为缓存
6. 构建并校验 `blog-frontend/dist/`
7. 只上传 `dist/` 为 Pages 构建产物，并保存不可变快照
8. 发布后检查首页和 `content-manifest.json`

## 需要的 GitHub Secrets

在 GitHub 仓库设置中添加：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

说明：

- 当前 Pages 工作流不要求手动提供 `SITE_URL`，因为工作流会根据仓库名自动推导。
- GitHub Models 使用 Actions 自带的 `github.token` 和 `models: read`，不需要新增 API Key Secret。
- 只有 `minliny.github.io` 仓库读取 Notion Secrets；模板仓库使用 `content/fixtures`。
- 不要把真实 Token 写入代码库或提交到 `.env.example`。
- 对于当前仓库 `minliny/MoZhu_Blog`，工作流推导出的站点地址是 `https://minliny.github.io/MoZhu_Blog`

## GitHub Pages 设置建议

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. 确认 Source 使用 GitHub Actions
4. 首次推送到 `main` 后检查 Actions 是否成功

## 当前仓库的预期访问地址

- 仓库地址：[https://github.com/minliny/MoZhu_Blog](https://github.com/minliny/MoZhu_Blog)
- GitHub Pages 地址：[https://minliny.github.io/MoZhu_Blog](https://minliny.github.io/MoZhu_Blog)

## 其他平台

### Vercel

待配置。

### Netlify

待配置。
