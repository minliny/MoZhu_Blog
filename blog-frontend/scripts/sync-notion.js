'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('@notionhq/client');
const {
  maskId,
  parseGroupAllowlist,
  validateDatabaseSchema,
  validatePublishedPages,
} = require('./content-schema');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT_DIR = path.resolve(__dirname, '..');
const REQUIRED_ENV = ['NOTION_TOKEN', 'NOTION_DATABASE_ID'];
const DRY_RUN = process.argv.includes('--dry-run');
const ALLOW_EMPTY_SYNC = process.env.ALLOW_EMPTY_NOTION_SYNC === '1';
const STRICT_UNSUPPORTED_BLOCKS = process.env.STRICT_UNSUPPORTED_BLOCKS === '1';
const AI_SUMMARY_MODEL = process.env.AI_SUMMARY_MODEL || 'openai/gpt-4.1-mini';
const AI_SUMMARY_WRITEBACK = process.env.AI_SUMMARY_WRITEBACK === '1';
const AI_SUMMARY_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const AI_SUMMARY_SOURCE_LIMIT = 12_000;
const MAX_MEDIA_BYTES = parsePositiveInteger(process.env.NOTION_MEDIA_MAX_BYTES, 15 * 1024 * 1024);
const MEDIA_TIMEOUT_MS = parsePositiveInteger(process.env.NOTION_MEDIA_TIMEOUT_MS, 20_000);
const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const MEDIA_PROTOCOLS = new Set(['http:', 'https:']);
const IMAGE_EXTENSIONS = new Map([
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveContentDir(value = process.env.CONTENT_DIR) {
  const resolved = value
    ? path.resolve(ROOT_DIR, value)
    : path.join(ROOT_DIR, '.content', 'notion');
  const filesystemRoot = path.parse(resolved).root;
  const relativeToProject = path.relative(ROOT_DIR, resolved);

  if (
    resolved === filesystemRoot
    || resolved === ROOT_DIR
    || relativeToProject.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativeToProject)
  ) {
    throw new Error(`Unsafe CONTENT_DIR: ${resolved}`);
  }
  return resolved;
}

function ensureEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function appendYamlArray(lines, name, values) {
  if (!values || values.length === 0) {
    lines.push(`${name}: []`);
    return;
  }
  lines.push(`${name}:`);
  values.forEach((value) => lines.push(`  - ${yamlString(value)}`));
}

function serializeFrontmatter(article) {
  const lines = [
    '---',
    `notionId: ${yamlString(article.notionId)}`,
    `title: ${yamlString(article.title)}`,
    `date: ${yamlString(article.date)}`,
    `excerpt: ${yamlString(article.excerpt)}`,
    `group: ${yamlString(article.group)}`,
  ];
  appendYamlArray(lines, 'tags', article.tags);
  lines.push(`cover: ${yamlString(article.cover || '')}`);
  appendYamlArray(lines, 'aliases', article.aliases);
  lines.push(`updatedAt: ${yamlString(article.updatedAt)}`, '---', '');
  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeMarkdownText(value) {
  return escapeHtml(value)
    .replace(/\\/g, '\\\\')
    .replace(/([`*_[\]{}()#+.!|>-])/g, '\\$1');
}

function escapeImageAlt(value) {
  return escapeHtml(value).replace(/\\/g, '\\\\').replace(/([\[\]])/g, '\\$1');
}

function inlineCode(value) {
  const text = String(value ?? '');
  const longestFence = Math.max(0, ...(text.match(/`+/g) || []).map((match) => match.length));
  const fence = '`'.repeat(Math.max(1, longestFence + 1));
  const padding = /^`|`$|^\s|\s$/.test(text) ? ' ' : '';
  return `${fence}${padding}${text}${padding}${fence}`;
}

function codeFence(value) {
  const text = String(value ?? '');
  const longestFence = Math.max(0, ...(text.match(/`+/g) || []).map((match) => match.length));
  return '`'.repeat(Math.max(3, longestFence + 1));
}

function sanitizeUrl(value, allowedProtocols, options = {}) {
  const raw = String(value || '').trim();
  if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return '';

  if (options.allowRelative && (/^#/.test(raw) || /^(?:\.\.\/|\.\/|\/(?!\/))/.test(raw))) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    return allowedProtocols.has(parsed.protocol) ? raw : '';
  } catch (_error) {
    return '';
  }
}

function markdownDestination(url) {
  const encoded = String(url).replace(/[<>\\\s]/g, (character) => encodeURIComponent(character));
  return `<${encoded}>`;
}

function incrementCounter(counter, key) {
  counter.set(key, (counter.get(key) || 0) + 1);
}

function plainTextFromRichText(richText) {
  return (richText || []).map((item) => item.plain_text || '').join('');
}

function richTextToMarkdown(richText, context) {
  return (richText || []).map((item) => {
    const rawText = item.plain_text || '';
    if (!rawText) return '';

    let text = item.annotations?.code ? inlineCode(rawText) : escapeMarkdownText(rawText);
    if (!item.annotations?.code) {
      if (item.annotations?.bold) text = `**${text}**`;
      if (item.annotations?.italic) text = `*${text}*`;
      if (item.annotations?.strikethrough) text = `~~${text}~~`;
    }

    const href = item.href || item.text?.link?.url;
    if (href) {
      const safeHref = sanitizeUrl(href, LINK_PROTOCOLS, { allowRelative: true });
      if (safeHref) {
        text = `[${text}](${markdownDestination(safeHref)})`;
      } else {
        incrementCounter(context.unsafeUrlCounts, 'rich_text_link');
      }
    }
    return text;
  }).join('');
}

async function listAllResults(fetchPage) {
  let cursor;
  const results = [];
  do {
    const response = await fetchPage(cursor);
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function fetchDatabasePages(client) {
  return listAllResults((start_cursor) => client.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: 'Status',
      select: { equals: 'Published' },
    },
    sorts: [{ property: 'Date', direction: 'descending' }],
    start_cursor,
    page_size: 100,
  }));
}

async function fetchBlockChildren(client, blockId) {
  const children = await listAllResults((start_cursor) => client.blocks.children.list({
    block_id: blockId,
    start_cursor,
    page_size: 100,
  }));

  for (const child of children) {
    if (child.has_children) {
      child.children = await fetchBlockChildren(client, child.id);
    }
  }
  return children;
}

function createMediaStore() {
  return {
    files: new Map(),
    bySourceUrl: new Map(),
  };
}

function imageSourceFromBlock(block) {
  if (block.type !== 'image') return null;
  if (block.image?.type === 'external' && block.image.external?.url) {
    return { kind: 'external', url: block.image.external.url };
  }
  if (block.image?.type === 'file' && block.image.file?.url) {
    return { kind: 'notion-file', url: block.image.file.url };
  }
  return null;
}

async function downloadNotionImage(url, mediaStore, options = {}) {
  const sourceUrl = sanitizeUrl(url, MEDIA_PROTOCOLS);
  if (!sourceUrl) throw new Error('Notion media URL does not use an allowed HTTP(S) protocol');
  if (mediaStore.bySourceUrl.has(sourceUrl)) return mediaStore.bySourceUrl.get(sourceUrl);

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('This Node.js runtime does not provide fetch()');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || MEDIA_TIMEOUT_MS);
  let response;
  try {
    response = await fetchImpl(sourceUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'MoZhu_Blog content sync' },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`media download timed out after ${options.timeoutMs || MEDIA_TIMEOUT_MS}ms`);
    throw new Error(`media download failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`media download returned HTTP ${response.status}`);
  if (!sanitizeUrl(response.url || sourceUrl, MEDIA_PROTOCOLS)) {
    throw new Error('media download redirected to a disallowed protocol');
  }

  const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const extension = IMAGE_EXTENSIONS.get(contentType);
  if (!extension) {
    throw new Error(`unsupported image Content-Type "${contentType || 'missing'}"`);
  }

  const maxBytes = options.maxBytes || MAX_MEDIA_BYTES;
  const declaredLength = Number.parseInt(response.headers.get('content-length') || '0', 10);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`image exceeds ${maxBytes} byte limit`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error(`image exceeds ${maxBytes} byte limit`);

  const hash = sha256(buffer);
  const fileName = `${hash}.${extension}`;
  const publicPath = `../media/${fileName}`;
  if (!mediaStore.files.has(fileName)) {
    mediaStore.files.set(fileName, { buffer, contentType, hash, fileName });
  }
  mediaStore.bySourceUrl.set(sourceUrl, publicPath);
  return publicPath;
}

function unsupportedBlockComment(type, context) {
  incrementCounter(context.unsupportedCounts, type);
  return `<!-- unsupported notion block: ${type} -->`;
}

function normalizeParagraph(text) {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function normalizeGeneratedExcerpt(value) {
  return String(value || '')
    .replace(/^\s*(?:摘要|摘要内容|summary)\s*[:：]\s*/i, '')
    .replace(/^\s*["“]|["”]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateSmartExcerpt(article, options = {}) {
  const token = options.token || process.env.AI_SUMMARY_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Excerpt is empty and AI_SUMMARY_TOKEN is unavailable; provide an Excerpt or enable AI summary generation.');
  }

  const fetchImpl = options.fetchImpl || fetch;
  const model = options.model || AI_SUMMARY_MODEL;
  const source = String(article.body || '').slice(0, AI_SUMMARY_SOURCE_LIMIT);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30_000);
  let response;
  try {
    response = await fetchImpl(options.endpoint || AI_SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是中文个人博客的编辑。请对文章进行理解后重写摘要，不要直接复制开头或拼接原文句子。',
          },
          {
            role: 'user',
            content: [
              `文章标题：${article.title}`,
              '',
              '文章正文：',
              source,
              '',
              '请用与文章相同的语言生成 60–120 字的单段摘要，概括主题、关键方法或经验以及主要价值。不要使用 Markdown、引号、标题或“本文”之类的开场白，只输出摘要正文。',
            ].join('\n'),
          },
        ],
        temperature: 0.2,
        max_tokens: 180,
        seed: 430,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`AI summary request failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  const excerpt = normalizeGeneratedExcerpt(payload.choices?.[0]?.message?.content);
  if (Array.from(excerpt).length < 20) {
    throw new Error('AI summary response was empty or too short');
  }
  return excerpt;
}

async function writeExcerptToNotion(client, pageId, excerpt) {
  await client.pages.update({
    page_id: pageId,
    properties: {
      Excerpt: {
        rich_text: [{ type: 'text', text: { content: excerpt } }],
      },
    },
  });
}

function prefixLines(value, prefix) {
  return String(value || '').split('\n').map((line) => `${prefix}${line}`).join('\n');
}

async function renderChildren(children, context, depth = 0) {
  const chunks = [];
  for (const child of children || []) {
    const rendered = await renderBlock(child, context, depth);
    if (rendered) chunks.push(rendered);
  }
  return chunks.join('\n\n').trim();
}

async function renderBlock(block, context, depth = 0) {
  const indent = '  '.repeat(depth);
  switch (block.type) {
    case 'paragraph':
      return normalizeParagraph(richTextToMarkdown(block.paragraph.rich_text, context));
    case 'heading_1':
      return `# ${richTextToMarkdown(block.heading_1.rich_text, context)}`;
    case 'heading_2':
      return `## ${richTextToMarkdown(block.heading_2.rich_text, context)}`;
    case 'heading_3':
      return `### ${richTextToMarkdown(block.heading_3.rich_text, context)}`;
    case 'quote':
      return prefixLines(richTextToMarkdown(block.quote.rich_text, context), '> ');
    case 'divider':
      return '---';
    case 'code': {
      const rawLanguage = block.code.language && block.code.language !== 'plain text' ? block.code.language : '';
      const language = /^[a-z0-9_+.-]+$/i.test(rawLanguage) ? rawLanguage : '';
      const code = plainTextFromRichText(block.code.rich_text);
      const fence = codeFence(code);
      return `${fence}${language}\n${code}\n${fence}`;
    }
    case 'callout': {
      const text = normalizeParagraph(richTextToMarkdown(block.callout.rich_text, context));
      return prefixLines(text || 'Callout', '> ');
    }
    case 'image': {
      const source = imageSourceFromBlock(block);
      const alt = escapeImageAlt(plainTextFromRichText(block.image.caption) || 'image');
      if (!source) return unsupportedBlockComment('image_missing_source', context);

      if (source.kind === 'notion-file') {
        const localPath = await downloadNotionImage(source.url, context.mediaStore);
        return `![${alt}](${markdownDestination(localPath)})`;
      }

      const safeUrl = sanitizeUrl(source.url, MEDIA_PROTOCOLS);
      if (!safeUrl) {
        incrementCounter(context.unsafeUrlCounts, 'image');
        return unsupportedBlockComment('image_unsafe_url', context);
      }
      return `![${alt}](${markdownDestination(safeUrl)})`;
    }
    case 'bookmark':
    case 'link_preview': {
      const url = block[block.type]?.url;
      const safeUrl = sanitizeUrl(url, LINK_PROTOCOLS);
      if (!safeUrl) {
        incrementCounter(context.unsafeUrlCounts, block.type);
        return unsupportedBlockComment(`${block.type}_unsafe_url`, context);
      }
      return `[${escapeMarkdownText(safeUrl)}](${markdownDestination(safeUrl)})`;
    }
    case 'bulleted_list_item': {
      const text = richTextToMarkdown(block.bulleted_list_item.rich_text, context) || ' ';
      const childText = await renderChildren(block.children, context, depth + 1);
      return [`${indent}- ${text}`, childText].filter(Boolean).join('\n');
    }
    case 'numbered_list_item': {
      const text = richTextToMarkdown(block.numbered_list_item.rich_text, context) || ' ';
      const childText = await renderChildren(block.children, context, depth + 1);
      return [`${indent}1. ${text}`, childText].filter(Boolean).join('\n');
    }
    case 'to_do': {
      const checked = block.to_do.checked ? 'x' : ' ';
      const text = richTextToMarkdown(block.to_do.rich_text, context) || ' ';
      const childText = await renderChildren(block.children, context, depth + 1);
      return [`${indent}- [${checked}] ${text}`, childText].filter(Boolean).join('\n');
    }
    case 'toggle': {
      const summary = richTextToMarkdown(block.toggle.rich_text, context) || '详情';
      const childText = await renderChildren(block.children, context, depth + 1);
      return [`**${summary}**`, childText].filter(Boolean).join('\n\n');
    }
    case 'equation': {
      const expression = escapeHtml(block.equation?.expression || '');
      if (!expression) return unsupportedBlockComment('equation_empty', context);
      return `$$\n${expression}\n$$`;
    }
    default: {
      const comment = unsupportedBlockComment(block.type || 'unknown', context);
      const childText = await renderChildren(block.children, context, depth + 1);
      return [comment, childText].filter(Boolean).join('\n\n');
    }
  }
}

async function materializeCover(coverSource, mediaStore) {
  if (!coverSource) return '';
  if (coverSource.kind === 'notion-file') {
    return downloadNotionImage(coverSource.url, mediaStore);
  }

  const safeUrl = sanitizeUrl(coverSource.url, MEDIA_PROTOCOLS);
  if (!safeUrl) throw new Error('cover URL does not use an allowed HTTP(S) protocol');
  return safeUrl;
}

async function buildArticle(client, article, context) {
  const [blocks, cover] = await Promise.all([
    fetchBlockChildren(client, article.notionId),
    materializeCover(article.coverSource, context.mediaStore),
  ]);
  const body = (await renderChildren(blocks, context)).trim();
  if (!body) throw new Error('article body is empty');
  let excerpt = article.excerpt;
  if (!excerpt) {
    excerpt = await context.generateSummary({ ...article, body });
    context.summaryCount += 1;
    if (context.writeSummary) {
      try {
        await context.writeSummary(article.notionId, excerpt);
        context.summaryWritebackCount += 1;
      } catch (error) {
        context.summaryWritebackErrors.push(
          `Page ${maskId(article.notionId)}: AI summary was generated but Excerpt writeback failed: ${error.message}`
        );
      }
    }
  }
  const normalizedArticle = {
    ...article,
    excerpt,
    cover,
  };
  delete normalizedArticle.coverSource;
  const markdown = `${serializeFrontmatter(normalizedArticle)}${body}${body ? '\n' : ''}`;
  return {
    ...normalizedArticle,
    markdown,
    hash: sha256(markdown),
    path: `posts/${normalizedArticle.slug}.md`,
  };
}

async function buildSnapshot(client, articles, options = {}) {
  const context = {
    mediaStore: createMediaStore(),
    unsupportedCounts: new Map(),
    unsafeUrlCounts: new Map(),
    summaryCount: 0,
    summaryWritebackCount: 0,
    summaryWritebackErrors: [],
    generateSummary: options.generateSummary || ((article) => generateSmartExcerpt(article)),
    writeSummary: options.writeSummary
      || (AI_SUMMARY_WRITEBACK && !DRY_RUN
        ? (pageId, excerpt) => writeExcerptToNotion(client, pageId, excerpt)
        : null),
  };
  const builtArticles = [];
  const errors = [];

  for (const article of articles) {
    try {
      builtArticles.push(await buildArticle(client, article, context));
    } catch (error) {
      errors.push(`Page ${maskId(article.notionId)}: content export failed: ${error.message}`);
    }
  }

  builtArticles.sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug));
  return { ...context, articles: builtArticles, errors };
}

function createManifest(snapshot) {
  const media = [...snapshot.mediaStore.files.values()]
    .map((file) => ({
      path: `media/${file.fileName}`,
      hash: file.hash,
      bytes: file.buffer.length,
      contentType: file.contentType,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    schemaVersion: 1,
    source: 'notion',
    generatedAt: new Date().toISOString(),
    count: snapshot.articles.length,
    mediaCount: media.length,
    articles: snapshot.articles.map((article) => ({
      id: article.notionId,
      notionId: article.notionId,
      slug: article.slug,
      aliases: article.aliases,
      hash: article.hash,
      updatedAt: article.updatedAt,
      path: article.path,
    })),
    media,
  };
}

function writeSnapshot(contentDir, snapshot, manifest) {
  const parentDir = path.dirname(contentDir);
  fs.mkdirSync(parentDir, { recursive: true });
  const stageDir = fs.mkdtempSync(path.join(parentDir, `.${path.basename(contentDir)}-stage-`));
  const backupDir = path.join(parentDir, `.${path.basename(contentDir)}-backup-${process.pid}-${Date.now()}`);
  let movedExisting = false;
  let promoted = false;

  try {
    const postsDir = path.join(stageDir, 'posts');
    const mediaDir = path.join(stageDir, 'media');
    fs.mkdirSync(postsDir, { recursive: true });
    fs.mkdirSync(mediaDir, { recursive: true });

    snapshot.articles.forEach((article) => {
      fs.writeFileSync(path.join(stageDir, article.path), article.markdown, 'utf8');
    });
    snapshot.mediaStore.files.forEach((file) => {
      fs.writeFileSync(path.join(mediaDir, file.fileName), file.buffer);
    });
    fs.writeFileSync(path.join(stageDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    if (fs.existsSync(contentDir)) {
      fs.renameSync(contentDir, backupDir);
      movedExisting = true;
    }
    fs.renameSync(stageDir, contentDir);
    promoted = true;

    if (movedExisting) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Snapshot published, but old snapshot cleanup failed: ${error.message}`);
      }
    }
  } catch (error) {
    if (!promoted && movedExisting && !fs.existsSync(contentDir) && fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, contentDir);
    }
    throw error;
  } finally {
    if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

function printCounterSummary(label, counter) {
  if (counter.size === 0) {
    console.log(`${label}: none`);
    return;
  }
  const summary = [...counter.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key}=${count}`)
    .join(', ');
  console.log(`${label}: ${summary}`);
}

function throwCollectedErrors(label, errors) {
  if (errors.length === 0) return;
  throw new Error(`${label} (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}`);
}

async function main() {
  ensureEnv();
  const contentDir = resolveContentDir();
  const groupAllowlist = parseGroupAllowlist();
  console.log(`Starting stateless Notion snapshot${DRY_RUN ? ' (dry-run)' : ''}...`);
  console.log(`Content directory: ${contentDir}`);
  console.log(`Group allowlist: ${groupAllowlist.join(', ')}`);
  console.log(`Strict unsupported blocks: ${STRICT_UNSUPPORTED_BLOCKS ? 'enabled' : 'disabled'}`);

  const client = new Client({ auth: process.env.NOTION_TOKEN });
  const database = await client.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
  const databaseValidation = validateDatabaseSchema(database, { groupAllowlist });
  databaseValidation.warnings.forEach((warning) => console.warn(`Schema warning: ${warning}`));
  throwCollectedErrors('Database schema validation failed', databaseValidation.errors);

  const pages = await fetchDatabasePages(client);
  if (pages.length === 0 && !ALLOW_EMPTY_SYNC) {
    throw new Error('No published Notion pages found. Set ALLOW_EMPTY_NOTION_SYNC=1 only for an intentional empty snapshot.');
  }

  const pageValidation = validatePublishedPages(pages, { groupAllowlist });
  throwCollectedErrors('Published content validation failed', pageValidation.errors);
  console.log(`Published pages validated: ${pages.length}`);

  const snapshot = await buildSnapshot(client, pageValidation.articles);
  console.log(`AI summaries generated: ${snapshot.summaryCount}`);
  console.log(`AI summaries written back to Notion: ${snapshot.summaryWritebackCount}`);
  snapshot.summaryWritebackErrors.forEach((warning) => console.warn(`Summary cache warning: ${warning}`));
  printCounterSummary('Unsupported block summary', snapshot.unsupportedCounts);
  printCounterSummary('Blocked URL summary', snapshot.unsafeUrlCounts);
  if (STRICT_UNSUPPORTED_BLOCKS && snapshot.unsupportedCounts.size > 0) {
    snapshot.errors.push('Unsupported Notion blocks are present while STRICT_UNSUPPORTED_BLOCKS=1.');
  }
  throwCollectedErrors('Content snapshot generation failed', snapshot.errors);

  const manifest = createManifest(snapshot);
  if (DRY_RUN) {
    console.log(`Dry run complete. articles=${manifest.count} media=${manifest.mediaCount} writes=0`);
    return;
  }

  writeSnapshot(contentDir, snapshot, manifest);
  console.log(`Notion snapshot published. articles=${manifest.count} media=${manifest.mediaCount}`);
  console.log(`Manifest: ${path.join(contentDir, 'manifest.json')}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Notion sync failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildArticle,
  buildSnapshot,
  createManifest,
  downloadNotionImage,
  escapeMarkdownText,
  generateSmartExcerpt,
  normalizeGeneratedExcerpt,
  renderBlock,
  resolveContentDir,
  richTextToMarkdown,
  sanitizeUrl,
  serializeFrontmatter,
  writeSnapshot,
};
