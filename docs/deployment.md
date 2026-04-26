# Deployment

## 当前真实部署状态

- GitHub Actions：已实现
- GitHub Pages：已实现
- Vercel：待配置
- Netlify：待配置

## GitHub Actions + GitHub Pages

仓库包含工作流文件 [deploy-blog.yml](../.github/workflows/deploy-blog.yml)。

当前流程：

1. 推送到 `main` 分支
2. 在 `blog-frontend/` 执行 `npm ci`
3. 自动计算 `SITE_URL`
4. 执行 `npm run sync:notion`
5. 执行 `npm run build`
6. 上传 `blog-frontend/` 目录为 Pages 构建产物
7. 发布到 GitHub Pages

## 需要的 GitHub Secrets

在 GitHub 仓库设置中添加：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

说明：

- 当前 Pages 工作流不要求手动提供 `SITE_URL`，因为工作流会根据仓库名自动推导。
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
